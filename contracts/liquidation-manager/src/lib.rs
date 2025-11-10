#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

// Liquidation Manager for Legasi protocol
// Monitors positions and triggers soft liquidations

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidationIntent {
    pub id: String,
    pub position_id: String,
    pub collateral_to_sell: i128,
    pub min_output: i128,
    pub deadline: u64,
    pub status: IntentStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum IntentStatus {
    Pending,
    Executed,
    Cancelled,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    Intent(String),
    PositionIntents(String),
    NextIntentId,
    LoansContract,
    PriceOracle,
    PolicyRegistry,
}

#[contract]
pub struct LiquidationManagerContract;

#[contractimpl]
impl LiquidationManagerContract {
    /// Initialize the contract
    pub fn initialize(
        env: Env,
        loans_contract: Address,
        price_oracle: Address,
        policy_registry: Address,
    ) -> Result<(), String> {
        if env.storage().instance().has(&DataKey::LoansContract) {
            return Err(String::from_str(&env, "Already initialized"));
        }

        env.storage()
            .instance()
            .set(&DataKey::LoansContract, &loans_contract);
        env.storage()
            .instance()
            .set(&DataKey::PriceOracle, &price_oracle);
        env.storage()
            .instance()
            .set(&DataKey::PolicyRegistry, &policy_registry);
        env.storage().instance().set(&DataKey::NextIntentId, &1u64);

        Ok(())
    }

    /// Check if a position needs liquidation
    pub fn check_liquidation(env: Env, position_id: String) -> Result<bool, String> {
        // Get position from Loans contract
        let loans_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::LoansContract)
            .ok_or(String::from_str(&env, "Loans contract not set"))?;

        // In production, call loans_contract.get_position(position_id)
        // For now, we'll return a simplified check

        // Get current LTV from price oracle
        let current_ltv = Self::get_position_ltv(&env, &position_id)?;

        // Get liquidation threshold
        let threshold = Self::get_liquidation_threshold(&env)?;

        Ok(current_ltv > threshold)
    }

    /// Create liquidation intent
    pub fn create_intent(
        env: Env,
        position_id: String,
        collateral_to_sell: i128,
        min_output: i128,
    ) -> Result<String, String> {
        // Verify position needs liquidation
        if !Self::check_liquidation(env.clone(), position_id.clone())? {
            return Err(String::from_str(&env, "Position healthy"));
        }

        // Generate intent ID
        let intent_id = Self::generate_intent_id(&env);

        // Create intent with 5-minute deadline
        let deadline = env.ledger().timestamp() + 300;

        let intent = LiquidationIntent {
            id: intent_id.clone(),
            position_id: position_id.clone(),
            collateral_to_sell,
            min_output,
            deadline,
            status: IntentStatus::Pending,
        };

        // Store intent
        env.storage()
            .persistent()
            .set(&DataKey::Intent(intent_id.clone()), &intent);

        // Add to position intents
        let mut position_intents: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::PositionIntents(position_id.clone()))
            .unwrap_or(Vec::new(&env));
        position_intents.push_back(intent_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::PositionIntents(position_id), &position_intents);

        Ok(intent_id)
    }

    /// Execute liquidation intent
    pub fn execute_intent(
        env: Env,
        intent_id: String,
        amount_received: i128,
    ) -> Result<(), String> {
        let mut intent: LiquidationIntent = env
            .storage()
            .persistent()
            .get(&DataKey::Intent(intent_id.clone()))
            .ok_or(String::from_str(&env, "Intent not found"))?;

        // Check deadline
        if env.ledger().timestamp() > intent.deadline {
            intent.status = IntentStatus::Expired;
            env.storage()
                .persistent()
                .set(&DataKey::Intent(intent_id), &intent);
            return Err(String::from_str(&env, "Intent expired"));
        }

        // Check min output
        if amount_received < intent.min_output {
            return Err(String::from_str(&env, "Output below minimum"));
        }

        // Mark as executed
        intent.status = IntentStatus::Executed;
        env.storage()
            .persistent()
            .set(&DataKey::Intent(intent_id), &intent);

        // Mark position as liquidated in Loans contract
        let loans_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::LoansContract)
            .ok_or(String::from_str(&env, "Loans contract not set"))?;

        // In production: loans_contract.mark_liquidated(intent.position_id)

        Ok(())
    }

    /// Get liquidation intent
    pub fn get_intent(env: Env, intent_id: String) -> Result<LiquidationIntent, String> {
        env.storage()
            .persistent()
            .get(&DataKey::Intent(intent_id))
            .ok_or(String::from_str(&env, "Intent not found"))
    }

    /// Get all intents for a position
    pub fn get_position_intents(env: Env, position_id: String) -> Vec<String> {
        env.storage()
            .persistent()
            .get(&DataKey::PositionIntents(position_id))
            .unwrap_or(Vec::new(&env))
    }

    // Helper functions

    fn generate_intent_id(env: &Env) -> String {
        let next_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextIntentId)
            .unwrap_or(1);

        env.storage()
            .instance()
            .set(&DataKey::NextIntentId, &(next_id + 1));

        String::from_str(env, &format!("LIQ-{}", next_id))
    }

    fn get_position_ltv(env: &Env, _position_id: &String) -> Result<u32, String> {
        // In production, calculate from position data and current prices
        // For now, return a mock value
        Ok(7800) // 78% LTV
    }

    fn get_liquidation_threshold(env: &Env) -> Result<u32, String> {
        // In production, fetch from PolicyRegistry
        Ok(7500) // 75% threshold
    }
}
