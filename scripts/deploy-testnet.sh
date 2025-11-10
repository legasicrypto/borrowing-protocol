#!/bin/bash
# Deploy all contracts to Stellar Testnet and generate TypeScript bindings

set -e

NETWORK="testnet"
SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"

# Load deployer secret key from env
if [ -z "$DEPLOYER_SECRET_KEY" ]; then
  echo "❌ Error: DEPLOYER_SECRET_KEY environment variable not set"
  exit 1
fi

echo "🔑 Using deployer account from env..."

# Deploy Loans Contract
echo "📝 Deploying Loans contract..."
LOANS_WASM="contracts/loans/target/wasm32-unknown-unknown/release/loans.wasm"
LOANS_CONTRACT_ID=$(stellar contract deploy \
  --wasm $LOANS_WASM \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL)

echo "✅ Loans deployed: $LOANS_CONTRACT_ID"

# Deploy PolicyRegistry Contract
echo "📝 Deploying PolicyRegistry contract..."
POLICY_WASM="contracts/policy_registry/target/wasm32-unknown-unknown/release/policy_registry.wasm"
POLICY_CONTRACT_ID=$(stellar contract deploy \
  --wasm $POLICY_WASM \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL)

echo "✅ PolicyRegistry deployed: $POLICY_CONTRACT_ID"

# Deploy PriceAdapter Contract
echo "📝 Deploying PriceAdapter contract..."
PRICE_WASM="contracts/price_adapter/target/wasm32-unknown-unknown/release/price_adapter.wasm"
PRICE_CONTRACT_ID=$(stellar contract deploy \
  --wasm $PRICE_WASM \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL)

echo "✅ PriceAdapter deployed: $PRICE_CONTRACT_ID"

# Deploy LiquidationManager Contract
echo "📝 Deploying LiquidationManager contract..."
LIQ_WASM="contracts/liquidation_manager/target/wasm32-unknown-unknown/release/liquidation_manager.wasm"
LIQ_CONTRACT_ID=$(stellar contract deploy \
  --wasm $LIQ_WASM \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL)

echo "✅ LiquidationManager deployed: $LIQ_CONTRACT_ID"

# Generate TypeScript bindings
echo "🔧 Generating TypeScript bindings..."

mkdir -p lib/contracts/bindings

stellar contract bindings typescript \
  --contract-id $LOANS_CONTRACT_ID \
  --output-dir lib/contracts/bindings/loans \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  --overwrite

stellar contract bindings typescript \
  --contract-id $POLICY_CONTRACT_ID \
  --output-dir lib/contracts/bindings/policy \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  --overwrite

stellar contract bindings typescript \
  --contract-id $PRICE_CONTRACT_ID \
  --output-dir lib/contracts/bindings/price \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  --overwrite

stellar contract bindings typescript \
  --contract-id $LIQ_CONTRACT_ID \
  --output-dir lib/contracts/bindings/liquidation \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  --overwrite

echo "✅ TypeScript bindings generated!"

# Save contract IDs to config file
cat > lib/contracts/deployed-contracts.json <<EOF
{
  "network": "$NETWORK",
  "rpcUrl": "$SOROBAN_RPC_URL",
  "contracts": {
    "loans": "$LOANS_CONTRACT_ID",
    "policyRegistry": "$POLICY_CONTRACT_ID",
    "priceAdapter": "$PRICE_CONTRACT_ID",
    "liquidationManager": "$LIQ_CONTRACT_ID"
  },
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Contract IDs saved to lib/contracts/deployed-contracts.json"

# Initialize contracts
echo "🎬 Initializing contracts..."

ADMIN_PUBLIC_KEY=$(stellar keys address deployer)

# Initialize PolicyRegistry
stellar contract invoke \
  --id $POLICY_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- initialize \
  --admin $ADMIN_PUBLIC_KEY

echo "✅ PolicyRegistry initialized"

# Initialize PriceAdapter with 50% max price jump
stellar contract invoke \
  --id $PRICE_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- initialize \
  --admin $ADMIN_PUBLIC_KEY \
  --max_jump_bps 5000

echo "✅ PriceAdapter initialized"

# Initialize LiquidationManager
stellar contract invoke \
  --id $LIQ_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- initialize \
  --admin $ADMIN_PUBLIC_KEY \
  --policy_registry $POLICY_CONTRACT_ID

echo "✅ LiquidationManager initialized"

# Initialize Loans contract with all dependencies
stellar contract invoke \
  --id $LOANS_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- initialize \
  --admin $ADMIN_PUBLIC_KEY \
  --kyc_registry $ADMIN_PUBLIC_KEY \
  --policy_registry $POLICY_CONTRACT_ID \
  --price_adapter $PRICE_CONTRACT_ID \
  --liquidation_manager $LIQ_CONTRACT_ID

echo "✅ Loans contract initialized"

# Set up default policies for BTC, XLM, USDC
echo "📋 Setting up default policies..."

# BTC Policy: 70% max LTV
stellar contract invoke \
  --id $POLICY_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- set_policy \
  --asset BTC \
  --max_ltv_bps 7000 \
  --bands '[6000,7000,8000]' \
  --slice_pct_bps 500 \
  --cooldown_seconds 86400 \
  --max_slippage_bps 500 \
  --staleness_seconds 3600 \
  --interest_base_bps 520 \
  --spread_bps 200 \
  --allowed true

echo "✅ BTC policy set"

# XLM Policy: 50% max LTV
stellar contract invoke \
  --id $POLICY_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- set_policy \
  --asset XLM \
  --max_ltv_bps 5000 \
  --bands '[4000,5000,6000]' \
  --slice_pct_bps 500 \
  --cooldown_seconds 86400 \
  --max_slippage_bps 500 \
  --staleness_seconds 3600 \
  --interest_base_bps 650 \
  --spread_bps 250 \
  --allowed true

echo "✅ XLM policy set"

# USDC Policy: 80% max LTV
stellar contract invoke \
  --id $POLICY_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- set_policy \
  --asset USDC \
  --max_ltv_bps 8000 \
  --bands '[7000,8000,9000]' \
  --slice_pct_bps 500 \
  --cooldown_seconds 86400 \
  --max_slippage_bps 500 \
  --staleness_seconds 3600 \
  --interest_base_bps 320 \
  --spread_bps 150 \
  --allowed true

echo "✅ USDC policy set"

# Set initial prices
echo "💰 Setting initial prices..."

# BTC: $95,000
stellar contract invoke \
  --id $PRICE_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- update_price \
  --asset BTC \
  --price 950000000000 \
  --round_id 1 \
  --source ADMIN

echo "✅ BTC price set"

# XLM: $0.42
stellar contract invoke \
  --id $PRICE_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- update_price \
  --asset XLM \
  --price 4200000 \
  --round_id 1 \
  --source ADMIN

echo "✅ XLM price set"

# USDC: $1.00
stellar contract invoke \
  --id $PRICE_CONTRACT_ID \
  --source $DEPLOYER_SECRET_KEY \
  --network $NETWORK \
  --rpc-url $SOROBAN_RPC_URL \
  -- update_price \
  --asset USDC \
  --price 10000000 \
  --round_id 1 \
  --source ADMIN

echo "✅ USDC price set"

echo ""
echo "🎉 All contracts deployed and configured!"
echo "📋 Contract IDs saved to lib/contracts/deployed-contracts.json"
echo "🔧 TypeScript bindings available in lib/contracts/bindings/"
echo ""
echo "Next steps:"
echo "1. Update your .env with these contract IDs"
echo "2. Run 'npm run dev' to start the frontend"
echo "3. Connect your wallet and test borrowing"
