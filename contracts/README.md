# Legasi Soroban Smart Contracts

This directory contains the four core smart contracts for the Legasi protocol on Stellar Soroban:

## Contracts

### 1. PolicyRegistry (`policy_registry/`)
Stores governance parameters and policy configuration for all supported assets.

**Key Functions:**
- `initialize(admin)` - Initialize the contract
- `set_policy(asset, params...)` - Set policy parameters for an asset
- `get_policy(asset)` - Get policy for an asset
- `add_venue(venue_hash)` - Add allowed liquidation venue
- `toggle_circuit_breaker(asset, enabled)` - Emergency circuit breaker

### 2. PriceOracleAdapter (`price_adapter/`)
Manages price feeds and freshness checks for collateral assets.

**Key Functions:**
- `initialize(admin, max_jump_bps)` - Initialize with max price jump
- `update_price(asset, price, round_id, source)` - Update price (oracle only)
- `get_price(asset)` - Get current price and metadata
- `is_fresh(asset, max_age_seconds)` - Check if price is fresh

### 3. LiquidationManager (`liquidation_manager/`)
Coordinates soft liquidations through intent-based execution.

**Key Functions:**
- `initialize(admin, policy_registry, price_adapter, loans_contract)` - Setup
- `emit_intent(...)` - Create liquidation intent when position unhealthy
- `accept_receipt(intent_id, proceeds, oracle_round)` - Accept executor receipt
- `get_intent(intent_id)` - View intent details
- `is_in_cooldown(position_id, cooldown_seconds)` - Check cooldown status

### 4. Loans (`loans/`)
Core ledger contract tracking all loan positions and debt.

**Key Functions:**
- `initialize(admin, kyc_registry, policy_registry, price_adapter, liquidation_manager)` - Setup
- `open_position(position_id, owner, collateral_ref, asset)` - Create position
- `draw(position_id, amount, oracle_round, new_ltv_bps)` - Borrow
- `repay(position_id, payer, amount)` - Repay debt
- `accrue_interest(position_id, interest_amount)` - Accrue interest
- `apply_liquidation(position_id, proceeds, oracle_round, receipt_nonce)` - Apply liquidation (privileged)
- `get_position(position_id)` - View position details

## Building

Install Rust and add the wasm32 target:

\`\`\`bash
rustup target add wasm32-unknown-unknown
\`\`\`

Build all contracts:

\`\`\`bash
cd contracts/policy_registry
cargo build --release --target wasm32-unknown-unknown

cd ../price_adapter
cargo build --release --target wasm32-unknown-unknown

cd ../liquidation_manager
cargo build --release --target wasm32-unknown-unknown

cd ../loans
cargo build --release --target wasm32-unknown-unknown
\`\`\`

WASM files will be at `target/wasm32-unknown-unknown/release/<contract_name>.wasm`

## Deployment

Deploy to Stellar Testnet using Soroban CLI:

\`\`\`bash
# Install Soroban CLI
cargo install --locked soroban-cli

# Configure network
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Deploy each contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/policy_registry.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet

# Repeat for each contract...
\`\`\`

## Architecture

\`\`\`
┌─────────────────┐
│  PolicyRegistry │ ◄──── Governance updates policies
└────────┬────────┘
         │
         │ reads policy
         ▼
┌──────────────────────┐      ┌─────────────────┐
│ LiquidationManager   │◄────►│  PriceAdapter   │
└──────────┬───────────┘      └─────────────────┘
           │                   ▲
           │ apply_liquidation │ update_price (oracle)
           ▼                   │
    ┌──────────┐              │
    │  Loans   │──────────────┘
    └──────────┘      reads price
         ▲
         │ draw/repay
         │
    [Borrowers]
\`\`\`

## Security Notes

**Production Requirements:**
- Add formal signature verification for executor receipts
- Implement cross-contract calls for policy/price reads
- Add comprehensive unit and integration tests
- Conduct security audits before mainnet
- Add access control for oracle price updates
- Implement rate limiting and anti-DoS measures

**MVP Limitations:**
- Admin-gated operations (replace with proper auth in production)
- Simplified interest calculations (add compound interest)
- No on-chain KYC verification (add cross-contract calls)
- Basic price jump protection (enhance with TWAP/volatility checks)

## Events

All contracts emit events for off-chain indexing:

**Loans:**
- `PositionOpened`, `Borrowed`, `Repaid`, `InterestAccrued`, `DebtReduced`, `PositionClosed`

**LiquidationManager:**
- `LiquidationIntent`, `ReceiptAccepted`, `CooldownStarted`, `IntentCancelled`

**PolicyRegistry:**
- `PolicyUpdated`, `CircuitBreaker`

**PriceAdapter:**
- `OracleUpdated`

## Testing

Run tests:

\`\`\`bash
cd contracts/loans
cargo test
\`\`\`

## License

Proprietary - Legasi Protocol
