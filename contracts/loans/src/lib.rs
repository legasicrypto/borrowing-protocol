#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Map, BytesN};

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum PositionStatus {
    Open,
    InLiquidationCooldown,
    Closable,
    Closed,
}

#[contracttype]
#[derive(Clone)]
pub struct Position {
    pub owner: Address,
    pub principal: i128,
    pub accrued_interest: i128,
    pub collateral_ref: BytesN<32>,  // Reference to off-chain vault/collateral
    pub asset: Symbol,
    pub ltv_bps: i128,
    pub status: PositionStatus,
    pub last_oracle_round: i128,
    pub nonce: i128,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Positions,
    KycRegistry,
    PolicyRegistry,
    PriceAdapter,
    LiquidationManager,
}

#[contract]
pub struct Loans;

#[contractimpl]
impl Loans {
    pub fn initialize(
        env: Env,
        admin: Address,
        policy_registry: Address,
        price_adapter: Address,
        liquidation_manager: Address
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PolicyRegistry, &policy_registry);
        env.storage().instance().set(&DataKey::PriceAdapter, &price_adapter);
        env.storage().instance().set(&DataKey::LiquidationManager, &liquidation_manager);
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("admin not set");
        admin.require_auth();
    }

    fn require_liquidation_manager(env: &Env) {
        let liquidation_manager: Address = env.storage()
            .instance()
            .get(&DataKey::LiquidationManager)
            .expect("liquidation manager not set");
        liquidation_manager.require_auth();
    }

    /// Open a new position
    pub fn open_position(
        env: Env,
        position_id: BytesN<32>,
        owner: Address,
        collateral_ref: BytesN<32>,
        asset: Symbol
    ) {
        owner.require_auth();

        let position = Position {
            owner: owner.clone(),
            principal: 0,
            accrued_interest: 0,
            collateral_ref,
            asset: asset.clone(),
            ltv_bps: 0,
            status: PositionStatus::Open,
            last_oracle_round: 0,
            nonce: 0,
            created_at: env.ledger().timestamp(),
        };

        let mut positions: Map<BytesN<32>, Position> = env.storage()
            .instance()
            .get(&DataKey::Positions)
            .unwrap_or(Map::new(&env));
        
        positions.set(position_id.clone(), position);
        env.storage().instance().set(&DataKey::Positions, &positions);

        env.events().publish(
            (Symbol::new(&env, "PositionOpened"),),
            (position_id, owner, asset)
        );
    }

    /// Draw (borrow) from a position
    pub fn draw(
        env: Env,
        position_id: BytesN<32>,
        amount: i128,
        oracle_round: i128,
        new_ltv_bps: i128
    ) {
        if amount <= 0 {
            panic!("invalid amount");
        }

        let mut positions: Map<BytesN<32>, Position> = env.storage()
            .instance()
            .get(&DataKey::Positions)
            .unwrap_or(Map::new(&env));
        
        let mut position = positions.get(position_id.clone()).expect("position not found");
        
        // Require position owner authorization
        position.owner.require_auth();

        if position.status != PositionStatus::Open {
            panic!("position not open");
        }

        // Update position
        position.principal += amount;
        position.ltv_bps = new_ltv_bps;
        position.last_oracle_round = oracle_round;

        positions.set(position_id.clone(), position.clone());
        env.storage().instance().set(&DataKey::Positions, &positions);

        env.events().publish(
            (Symbol::new(&env, "Borrowed"),),
            (position_id, position.owner, amount, oracle_round)
        );
    }

    /// Repay debt on a position
    pub fn repay(
        env: Env,
        position_id: BytesN<32>,
        payer: Address,
        amount: i128
    ) {
        if amount <= 0 {
            panic!("invalid amount");
        }

        payer.require_auth();

        let mut positions: Map<BytesN<32>, Position> = env.storage()
            .instance()
            .get(&DataKey::Positions)
            .unwrap_or(Map::new(&env));
        
        let mut position = positions.get(position_id.clone()).expect("position not found");

        // Apply to accrued interest first, then principal
        let mut remaining = amount;
        
        if position.accrued_interest > 0 {
            if remaining >= position.accrued_interest {
                remaining -= position.accrued_interest;
                position.accrued_interest = 0;
            } else {
                position.accrued_interest -= remaining;
                remaining = 0;
            }
        }

        if remaining > 0 {
            if remaining >= position.principal {
                position.principal = 0;
            } else {
                position.principal -= remaining;
            }
        }

        // Check if position can be closed
        if position.principal == 0 && position.accrued_interest == 0 {
            position.status = PositionStatus::Closable;
        }

        positions.set(position_id.clone(), position);
        env.storage().instance().set(&DataKey::Positions, &positions);

        env.events().publish(
            (Symbol::new(&env, "Repaid"),),
            (position_id, payer, amount)
        );
    }

    /// Accrue interest on a position
    pub fn accrue_interest(
        env: Env,
        position_id: BytesN<32>,
        interest_amount: i128
    ) {
        Self::require_admin(&env);

        let mut positions: Map<BytesN<32>, Position> = env.storage()
            .instance()
            .get(&DataKey::Positions)
            .unwrap_or(Map::new(&env));
        
        let mut position = positions.get(position_id.clone()).expect("position not found");

        position.accrued_interest += interest_amount;

        positions.set(position_id.clone(), position);
        env.storage().instance().set(&DataKey::Positions, &positions);

        env.events().publish(
            (Symbol::new(&env, "InterestAccrued"),),
            (position_id, interest_amount)
        );
    }

    /// Apply liquidation (privileged - only LiquidationManager)
    pub fn apply_liquidation(
        env: Env,
        position_id: BytesN<32>,
        proceeds: i128,
        oracle_round: i128,
        receipt_nonce: i128
    ) {
        Self::require_liquidation_manager(&env);

        let mut positions: Map<BytesN<32>, Position> = env.storage()
            .instance()
            .get(&DataKey::Positions)
            .unwrap_or(Map::new(&env));
        
        let mut position = positions.get(position_id.clone()).expect("position not found");

        // Reduce debt (apply to interest first, then principal)
        let mut remaining = proceeds;

        if position.accrued_interest > 0 {
            if remaining >= position.accrued_interest {
                remaining -= position.accrued_interest;
                position.accrued_interest = 0;
            } else {
                position.accrued_interest -= remaining;
                remaining = 0;
            }
        }

        if remaining > 0 {
            if remaining >= position.principal {
                position.principal = 0;
            } else {
                position.principal -= remaining;
            }
        }

        position.last_oracle_round = oracle_round;
        position.nonce += receipt_nonce;

        // Update status
        if position.principal == 0 && position.accrued_interest == 0 {
            position.status = PositionStatus::Closed;
            
            env.events().publish(
                (Symbol::new(&env, "PositionClosed"),),
                position_id.clone()
            );
        } else {
            position.status = PositionStatus::InLiquidationCooldown;
        }

        positions.set(position_id.clone(), position);
        env.storage().instance().set(&DataKey::Positions, &positions);

        env.events().publish(
            (Symbol::new(&env, "DebtReduced"),),
            (position_id, proceeds)
        );
    }

    /// Close a position (must be fully repaid)
    pub fn close_position(env: Env, position_id: BytesN<32>) {
        let mut positions: Map<BytesN<32>, Position> = env.storage()
            .instance()
            .get(&DataKey::Positions)
            .unwrap_or(Map::new(&env));
        
        let mut position = positions.get(position_id.clone()).expect("position not found");
        
        position.owner.require_auth();

        if position.status != PositionStatus::Closable {
            panic!("position not closable");
        }

        if position.principal != 0 || position.accrued_interest != 0 {
            panic!("position has outstanding debt");
        }

        position.status = PositionStatus::Closed;
        positions.set(position_id.clone(), position);
        env.storage().instance().set(&DataKey::Positions, &positions);

        env.events().publish(
            (Symbol::new(&env, "PositionClosed"),),
            position_id
        );
    }

    /// Get position details (view function)
    pub fn get_position(env: Env, position_id: BytesN<32>) -> Option<Position> {
        let positions: Map<BytesN<32>, Position> = env.storage()
            .instance()
            .get(&DataKey::Positions)
            .unwrap_or(Map::new(&env));
        positions.get(position_id)
    }

    /// Get total debt for a position (principal + accrued interest)
    pub fn get_total_debt(env: Env, position_id: BytesN<32>) -> i128 {
        if let Some(position) = Self::get_position(env, position_id) {
            position.principal + position.accrued_interest
        } else {
            0
        }
    }

    /// Update position LTV (admin only, after price changes)
    pub fn update_ltv(
        env: Env,
        position_id: BytesN<32>,
        new_ltv_bps: i128,
        oracle_round: i128
    ) {
        Self::require_admin(&env);

        let mut positions: Map<BytesN<32>, Position> = env.storage()
            .instance()
            .get(&DataKey::Positions)
            .unwrap_or(Map::new(&env));
        
        let mut position = positions.get(position_id.clone()).expect("position not found");

        position.ltv_bps = new_ltv_bps;
        position.last_oracle_round = oracle_round;

        positions.set(position_id.clone(), position);
        env.storage().instance().set(&DataKey::Positions, &positions);
    }
}
