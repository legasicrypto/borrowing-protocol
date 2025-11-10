#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Map};

// Policy Registry for Legasi protocol
// Stores all risk parameters and configuration

#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    Admin,
    Parameter(String),
    AllParameters,
}

#[contract]
pub struct PolicyRegistryContract;

#[contractimpl]
impl PolicyRegistryContract {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) -> Result<(), String> {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            return Err(String::from_str(&env, "Already initialized"));
        }

        env.storage().instance().set(&DataKey::Admin, &admin);

        // Set default parameters
        Self::set_default_parameters(&env);

        Ok(())
    }

    /// Set a policy parameter
    pub fn set_parameter(
        env: Env,
        admin: Address,
        name: String,
        value: i128,
    ) -> Result<(), String> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(String::from_str(&env, "Not initialized"))?;

        if admin != stored_admin {
            return Err(String::from_str(&env, "Not authorized"));
        }

        env.storage()
            .persistent()
            .set(&DataKey::Parameter(name.clone()), &value);

        // Add to all parameters list
        let mut all_params: Map<String, i128> = env
            .storage()
            .persistent()
            .get(&DataKey::AllParameters)
            .unwrap_or(Map::new(&env));

        all_params.set(name, value);
        env.storage()
            .persistent()
            .set(&DataKey::AllParameters, &all_params);

        Ok(())
    }

    /// Get a policy parameter
    pub fn get_parameter(env: Env, name: String) -> Result<i128, String> {
        env.storage()
            .persistent()
            .get(&DataKey::Parameter(name))
            .ok_or(String::from_str(&env, "Parameter not found"))
    }

    /// Get all parameters
    pub fn get_all_parameters(env: Env) -> Map<String, i128> {
        env.storage()
            .persistent()
            .get(&DataKey::AllParameters)
            .unwrap_or(Map::new(&env))
    }

    // Helper function to set defaults
    fn set_default_parameters(env: &Env) {
        let mut all_params = Map::new(env);

        // LTV thresholds (in basis points)
        env.storage()
            .persistent()
            .set(&DataKey::Parameter(String::from_str(env, "btc_ltv_threshold")), &7500i128); // 75%
        all_params.set(String::from_str(env, "btc_ltv_threshold"), 7500);

        env.storage()
            .persistent()
            .set(&DataKey::Parameter(String::from_str(env, "usdc_ltv_threshold")), &9000i128); // 90%
        all_params.set(String::from_str(env, "usdc_ltv_threshold"), 9000);

        // Interest rates
        env.storage()
            .persistent()
            .set(&DataKey::Parameter(String::from_str(env, "base_interest_rate")), &550i128); // 5.5%
        all_params.set(String::from_str(env, "base_interest_rate"), 550);

        // Liquidation parameters
        env.storage()
            .persistent()
            .set(&DataKey::Parameter(String::from_str(env, "liquidation_penalty")), &500i128); // 5%
        all_params.set(String::from_str(env, "liquidation_penalty"), 500);

        env.storage()
            .persistent()
            .set(&DataKey::Parameter(String::from_str(env, "soft_liquidation_step")), &1000i128); // 10%
        all_params.set(String::from_str(env, "soft_liquidation_step"), 1000);

        // Oracle parameters
        env.storage()
            .persistent()
            .set(&DataKey::Parameter(String::from_str(env, "price_staleness_limit")), &60i128); // 60 seconds
        all_params.set(String::from_str(env, "price_staleness_limit"), 60);

        env.storage()
            .persistent()
            .set(&DataKey::AllParameters, &all_params);
    }
}
