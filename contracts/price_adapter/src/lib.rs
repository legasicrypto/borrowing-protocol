#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Address, Symbol, Map};

#[contracttype]
#[derive(Clone)]
pub struct PriceRound {
    pub price: i128,      // scaled integer (e.g., price * 1e7)
    pub timestamp: u64,   // ledger timestamp
    pub round_id: i128,
    pub source: Symbol,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Prices,
    MaxJumpBps,
}

#[contract]
pub struct PriceAdapter;

#[contractimpl]
impl PriceAdapter {
    pub fn initialize(env: Env, admin: Address, max_jump_bps: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::MaxJumpBps, &max_jump_bps);
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("admin not set");
        admin.require_auth();
    }

    pub fn update_price(
        env: Env,
        asset: Symbol,
        price: i128,
        round_id: i128,
        source: Symbol
    ) {
        Self::require_admin(&env);

        let timestamp = env.ledger().timestamp();
        
        // Optional jump check against previous price
        let mut prices: Map<Symbol, PriceRound> = env.storage()
            .instance()
            .get(&DataKey::Prices)
            .unwrap_or(Map::new(&env));
        
        if let Some(prev) = prices.get(asset.clone()) {
            if prev.price > 0 {
                let max_jump: i128 = env.storage()
                    .instance()
                    .get(&DataKey::MaxJumpBps)
                    .unwrap_or(10000i128);
                
                let diff = if price > prev.price {
                    price - prev.price
                } else {
                    prev.price - price
                };
                
                let bps = (diff * 10000i128) / prev.price;
                if bps > max_jump {
                    panic!("price jump too large");
                }
            }
        }

        let round = PriceRound {
            price,
            timestamp,
            round_id,
            source,
        };
        
        prices.set(asset.clone(), round);
        env.storage().instance().set(&DataKey::Prices, &prices);

        env.events().publish(
            (Symbol::new(&env, "OracleUpdated"), asset),
            (price, timestamp, round_id)
        );
    }

    pub fn get_price(env: Env, asset: Symbol) -> Option<PriceRound> {
        let prices: Map<Symbol, PriceRound> = env.storage()
            .instance()
            .get(&DataKey::Prices)
            .unwrap_or(Map::new(&env));
        prices.get(asset)
    }

    pub fn is_fresh(env: Env, asset: Symbol, max_age_seconds: u64) -> bool {
        if let Some(round) = Self::get_price(env.clone(), asset) {
            let now = env.ledger().timestamp();
            return now - round.timestamp <= max_age_seconds;
        }
        false
    }

    pub fn get_price_if_fresh(env: Env, asset: Symbol, max_age_seconds: u64) -> Option<PriceRound> {
        if Self::is_fresh(env.clone(), asset.clone(), max_age_seconds) {
            Self::get_price(env, asset)
        } else {
            None
        }
    }
}
