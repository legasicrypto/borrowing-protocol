#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

// Price Oracle Adapter for Legasi protocol
// Self-contained oracle that accepts price updates from authorized backend

#[contracttype]
#[derive(Clone, Debug)]
pub struct PriceData {
    pub asset_pair: String, // "BTC/USD", "USDC/USD"
    pub price: i128,        // Price in 8 decimal places (e.g., 100000000000 = $1000.00)
    pub confidence: u32,    // Confidence level (9500 = 95%)
    pub timestamp: u64,
    pub source: String, // "aggregated", "bybit", etc.
}

#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    Price(String),           // asset_pair -> PriceData
    PriceHistory(String),    // asset_pair -> Vec<PriceData>
    AuthorizedPublisher(Address),
    StalenessLimit,
}

#[contract]
pub struct PriceOracleContract;

#[contractimpl]
impl PriceOracleContract {
    /// Initialize the contract
    pub fn initialize(
        env: Env,
        admin: Address,
        staleness_limit: u64, // seconds
    ) -> Result<(), String> {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::StalenessLimit) {
            return Err(String::from_str(&env, "Already initialized"));
        }

        env.storage()
            .instance()
            .set(&DataKey::AuthorizedPublisher(admin.clone()), &true);
        env.storage()
            .instance()
            .set(&DataKey::StalenessLimit, &staleness_limit);

        Ok(())
    }

    /// Add authorized price publisher
    pub fn add_publisher(env: Env, admin: Address, publisher: Address) -> Result<(), String> {
        admin.require_auth();

        // Verify admin is authorized
        if !env
            .storage()
            .instance()
            .has(&DataKey::AuthorizedPublisher(admin))
        {
            return Err(String::from_str(&env, "Not authorized"));
        }

        env.storage()
            .instance()
            .set(&DataKey::AuthorizedPublisher(publisher), &true);

        Ok(())
    }

    /// Publish price update
    pub fn publish_price(
        env: Env,
        publisher: Address,
        asset_pair: String,
        price: i128,
        confidence: u32,
        source: String,
    ) -> Result<(), String> {
        publisher.require_auth();

        // Verify publisher is authorized
        if !env
            .storage()
            .instance()
            .has(&DataKey::AuthorizedPublisher(publisher))
        {
            return Err(String::from_str(&env, "Not authorized"));
        }

        // Validate price
        if price <= 0 {
            return Err(String::from_str(&env, "Invalid price"));
        }

        // Validate confidence
        if confidence > 10000 {
            return Err(String::from_str(&env, "Invalid confidence"));
        }

        // Create price data
        let price_data = PriceData {
            asset_pair: asset_pair.clone(),
            price,
            confidence,
            timestamp: env.ledger().timestamp(),
            source,
        };

        // Store current price
        env.storage()
            .persistent()
            .set(&DataKey::Price(asset_pair.clone()), &price_data);

        // Add to price history (keep last 100 prices)
        let mut history: Vec<PriceData> = env
            .storage()
            .persistent()
            .get(&DataKey::PriceHistory(asset_pair.clone()))
            .unwrap_or(Vec::new(&env));

        history.push_back(price_data);

        // Keep only last 100 entries
        while history.len() > 100 {
            history.remove(0);
        }

        env.storage()
            .persistent()
            .set(&DataKey::PriceHistory(asset_pair), &history);

        Ok(())
    }

    /// Get current price
    pub fn get_price(env: Env, asset_pair: String) -> Result<PriceData, String> {
        let price_data: PriceData = env
            .storage()
            .persistent()
            .get(&DataKey::Price(asset_pair.clone()))
            .ok_or(String::from_str(&env, "Price not found"))?;

        // Check staleness
        let staleness_limit: u64 = env
            .storage()
            .instance()
            .get(&DataKey::StalenessLimit)
            .unwrap_or(60); // default 60 seconds

        let age = env.ledger().timestamp() - price_data.timestamp;
        if age > staleness_limit {
            return Err(String::from_str(&env, "Price stale"));
        }

        Ok(price_data)
    }

    /// Get price history
    pub fn get_price_history(env: Env, asset_pair: String) -> Vec<PriceData> {
        env.storage()
            .persistent()
            .get(&DataKey::PriceHistory(asset_pair))
            .unwrap_or(Vec::new(&env))
    }

    /// Calculate TWAP (Time-Weighted Average Price)
    pub fn get_twap(env: Env, asset_pair: String, duration: u64) -> Result<i128, String> {
        let history: Vec<PriceData> = Self::get_price_history(env.clone(), asset_pair);

        if history.is_empty() {
            return Err(String::from_str(&env, "No price history"));
        }

        let cutoff_time = env.ledger().timestamp() - duration;
        let mut total_price: i128 = 0;
        let mut count: u32 = 0;

        for i in 0..history.len() {
            let price_data = history.get(i).unwrap();
            if price_data.timestamp >= cutoff_time {
                total_price += price_data.price;
                count += 1;
            }
        }

        if count == 0 {
            return Err(String::from_str(&env, "No recent prices"));
        }

        Ok(total_price / count as i128)
    }
}
