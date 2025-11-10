#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Symbol, Address, Bytes, Map, BytesN};

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum IntentStatus {
    Open,
    Accepted,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct LiquidationIntent {
    pub position_id: BytesN<32>,
    pub notional_to_raise: i128,
    pub min_out: i128,
    pub slippage_bps: i128,
    pub deadline: u64,
    pub nonce: i128,
    pub policy_version: i128,
    pub oracle_round: i128,
    pub status: IntentStatus,
    pub venue_hash: Bytes,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    PolicyRegistry,
    PriceAdapter,
    LoansContract,
    Intents,
    Cooldowns,
}

#[contract]
pub struct LiquidationManager;

#[contractimpl]
impl LiquidationManager {
    pub fn initialize(
        env: Env,
        admin: Address,
        policy_registry: Address,
        price_adapter: Address,
        loans_contract: Address
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PolicyRegistry, &policy_registry);
        env.storage().instance().set(&DataKey::PriceAdapter, &price_adapter);
        env.storage().instance().set(&DataKey::LoansContract, &loans_contract);
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("admin not set");
        admin.require_auth();
    }

    pub fn emit_intent(
        env: Env,
        intent_id: BytesN<32>,
        position_id: BytesN<32>,
        notional_to_raise: i128,
        min_out: i128,
        slippage_bps: i128,
        deadline: u64,
        nonce: i128,
        policy_version: i128,
        oracle_round: i128,
        venue_hash: Bytes
    ) {
        Self::require_admin(&env);

        let intent = LiquidationIntent {
            position_id: position_id.clone(),
            notional_to_raise,
            min_out,
            slippage_bps,
            deadline,
            nonce,
            policy_version,
            oracle_round,
            status: IntentStatus::Open,
            venue_hash,
        };

        let mut intents: Map<BytesN<32>, LiquidationIntent> = env.storage()
            .instance()
            .get(&DataKey::Intents)
            .unwrap_or(Map::new(&env));
        
        intents.set(intent_id.clone(), intent);
        env.storage().instance().set(&DataKey::Intents, &intents);

        env.events().publish(
            (Symbol::new(&env, "LiquidationIntent"),),
            (intent_id, position_id, notional_to_raise, min_out)
        );
    }

    pub fn accept_receipt(
        env: Env,
        intent_id: BytesN<32>,
        proceeds: i128,
        executed_oracle_round: i128
    ) {
        Self::require_admin(&env);

        let mut intents: Map<BytesN<32>, LiquidationIntent> = env.storage()
            .instance()
            .get(&DataKey::Intents)
            .unwrap_or(Map::new(&env));
        
        let mut intent = intents.get(intent_id.clone()).expect("intent not found");

        if intent.status != IntentStatus::Open {
            panic!("intent not open");
        }

        let now = env.ledger().timestamp();
        if now > intent.deadline {
            panic!("intent expired");
        }

        if proceeds < intent.min_out {
            panic!("proceeds below min_out");
        }

        intent.status = IntentStatus::Accepted;
        intents.set(intent_id.clone(), intent.clone());
        env.storage().instance().set(&DataKey::Intents, &intents);

        // Set cooldown for position
        let mut cooldowns: Map<BytesN<32>, u64> = env.storage()
            .instance()
            .get(&DataKey::Cooldowns)
            .unwrap_or(Map::new(&env));
        
        cooldowns.set(intent.position_id.clone(), now);
        env.storage().instance().set(&DataKey::Cooldowns, &cooldowns);

        env.events().publish(
            (Symbol::new(&env, "ReceiptAccepted"),),
            (intent_id, proceeds, executed_oracle_round)
        );
        
        env.events().publish(
            (Symbol::new(&env, "CooldownStarted"),),
            (intent.position_id, now)
        );
    }

    pub fn cancel_intent(env: Env, intent_id: BytesN<32>) {
        Self::require_admin(&env);

        let mut intents: Map<BytesN<32>, LiquidationIntent> = env.storage()
            .instance()
            .get(&DataKey::Intents)
            .unwrap_or(Map::new(&env));
        
        let mut intent = intents.get(intent_id.clone()).expect("intent not found");
        intent.status = IntentStatus::Cancelled;
        intents.set(intent_id.clone(), intent);
        env.storage().instance().set(&DataKey::Intents, &intents);

        env.events().publish((Symbol::new(&env, "IntentCancelled"),), intent_id);
    }

    pub fn get_intent(env: Env, intent_id: BytesN<32>) -> Option<LiquidationIntent> {
        let intents: Map<BytesN<32>, LiquidationIntent> = env.storage()
            .instance()
            .get(&DataKey::Intents)
            .unwrap_or(Map::new(&env));
        intents.get(intent_id)
    }

    pub fn get_cooldown(env: Env, position_id: BytesN<32>) -> Option<u64> {
        let cooldowns: Map<BytesN<32>, u64> = env.storage()
            .instance()
            .get(&DataKey::Cooldowns)
            .unwrap_or(Map::new(&env));
        cooldowns.get(position_id)
    }

    pub fn is_in_cooldown(env: Env, position_id: BytesN<32>, cooldown_seconds: u64) -> bool {
        if let Some(cooldown_start) = Self::get_cooldown(env.clone(), position_id) {
            let now = env.ledger().timestamp();
            return now < cooldown_start + cooldown_seconds;
        }
        false
    }
}
