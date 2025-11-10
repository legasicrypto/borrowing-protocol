#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec, Map, Bytes};

#[contracttype]
#[derive(Clone)]
pub struct Policy {
    pub max_ltv_bps: i128,
    pub bands: Vec<i128>,
    pub slice_pct_bps: i128,
    pub cooldown_seconds: i128,
    pub max_slippage_bps: i128,
    pub staleness_seconds: i128,
    pub interest_base_bps: i128,
    pub spread_bps: i128,
    pub allowed: bool,
    pub circuit_breaker: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Policies,
    VenueAllowlist,
    Version,
}

#[contract]
pub struct PolicyRegistry;

#[contractimpl]
impl PolicyRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Version, &0i128);
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("admin not set");
        admin.require_auth();
    }

    pub fn set_policy(
        env: Env,
        asset: Symbol,
        max_ltv_bps: i128,
        bands: Vec<i128>,
        slice_pct_bps: i128,
        cooldown_seconds: i128,
        max_slippage_bps: i128,
        staleness_seconds: i128,
        interest_base_bps: i128,
        spread_bps: i128,
        allowed: bool
    ) {
        Self::require_admin(&env);
        
        let policy = Policy {
            max_ltv_bps,
            bands,
            slice_pct_bps,
            cooldown_seconds,
            max_slippage_bps,
            staleness_seconds,
            interest_base_bps,
            spread_bps,
            allowed,
            circuit_breaker: false,
        };
        
        let mut policies: Map<Symbol, Policy> = env.storage()
            .instance()
            .get(&DataKey::Policies)
            .unwrap_or(Map::new(&env));
        
        policies.set(asset.clone(), policy);
        env.storage().instance().set(&DataKey::Policies, &policies);

        // Bump version
        let mut version: i128 = env.storage().instance().get(&DataKey::Version).unwrap_or(0i128);
        version += 1;
        env.storage().instance().set(&DataKey::Version, &version);
        
        env.events().publish((Symbol::new(&env, "PolicyUpdated"), asset), version);
    }

    pub fn get_policy(env: Env, asset: Symbol) -> Option<Policy> {
        let policies: Map<Symbol, Policy> = env.storage()
            .instance()
            .get(&DataKey::Policies)
            .unwrap_or(Map::new(&env));
        policies.get(asset)
    }

    pub fn add_venue(env: Env, venue_hash: Bytes) {
        Self::require_admin(&env);
        
        let mut venues: Vec<Bytes> = env.storage()
            .instance()
            .get(&DataKey::VenueAllowlist)
            .unwrap_or(Vec::new(&env));
        
        venues.push_back(venue_hash);
        env.storage().instance().set(&DataKey::VenueAllowlist, &venues);
    }

    pub fn remove_venue(env: Env, venue_hash: Bytes) {
        Self::require_admin(&env);
        
        let venues: Vec<Bytes> = env.storage()
            .instance()
            .get(&DataKey::VenueAllowlist)
            .unwrap_or(Vec::new(&env));
        
        let mut new_venues = Vec::new(&env);
        for venue in venues.iter() {
            if venue != venue_hash {
                new_venues.push_back(venue);
            }
        }
        env.storage().instance().set(&DataKey::VenueAllowlist, &new_venues);
    }

    pub fn is_venue_allowed(env: Env, venue_hash: Bytes) -> bool {
        let venues: Vec<Bytes> = env.storage()
            .instance()
            .get(&DataKey::VenueAllowlist)
            .unwrap_or(Vec::new(&env));
        
        for venue in venues.iter() {
            if venue == venue_hash {
                return true;
            }
        }
        false
    }

    pub fn toggle_circuit_breaker(env: Env, asset: Symbol, enabled: bool) {
        Self::require_admin(&env);
        
        let mut policies: Map<Symbol, Policy> = env.storage()
            .instance()
            .get(&DataKey::Policies)
            .unwrap_or(Map::new(&env));
        
        if let Some(mut policy) = policies.get(asset.clone()) {
            policy.circuit_breaker = enabled;
            policies.set(asset.clone(), policy);
            env.storage().instance().set(&DataKey::Policies, &policies);
            
            env.events().publish((Symbol::new(&env, "CircuitBreaker"), asset), enabled);
        } else {
            panic!("policy not found");
        }
    }

    pub fn get_version(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Version).unwrap_or(0i128)
    }
}
