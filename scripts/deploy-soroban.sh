#!/bin/bash

# Deploy Soroban contracts to testnet
# Usage: ./scripts/deploy-soroban.sh

set -e

echo "🚀 Deploying Soroban contracts to Stellar Testnet..."

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI not found. Install from https://soroban.stellar.org/docs/getting-started/setup"
    exit 1
fi

# Set network to testnet
NETWORK="testnet"
NETWORK_URL="https://soroban-testnet.stellar.org"

echo "📦 Building contracts..."
cd contracts

# Build PolicyRegistry
echo "Building PolicyRegistry..."
cd policy_registry
cargo build --target wasm32-unknown-unknown --release
cd ..

# Build PriceAdapter
echo "Building PriceAdapter..."
cd price_adapter
cargo build --target wasm32-unknown-unknown --release
cd ..

# Build LiquidationManager
echo "Building LiquidationManager..."
cd liquidation_manager
cargo build --target wasm32-unknown-unknown --release
cd ..

# Build Loans
echo "Building Loans..."
cd loans
cargo build --target wasm32-unknown-unknown --release
cd ..

cd ..

echo "✅ All contracts built successfully"

# Deploy contracts
echo "🌐 Deploying to $NETWORK..."

# Deploy PolicyRegistry
echo "Deploying PolicyRegistry..."
POLICY_ID=$(soroban contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/policy_registry.wasm \
  --source deployer \
  --network testnet)
echo "PolicyRegistry deployed: $POLICY_ID"

# Deploy PriceAdapter
echo "Deploying PriceAdapter..."
ORACLE_ID=$(soroban contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/price_adapter.wasm \
  --source deployer \
  --network testnet)
echo "PriceAdapter deployed: $ORACLE_ID"

# Deploy LiquidationManager
echo "Deploying LiquidationManager..."
LIQUIDATION_ID=$(soroban contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/liquidation_manager.wasm \
  --source deployer \
  --network testnet)
echo "LiquidationManager deployed: $LIQUIDATION_ID"

# Deploy Loans
echo "Deploying Loans..."
LOANS_ID=$(soroban contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/loans.wasm \
  --source deployer \
  --network testnet)
echo "Loans deployed: $LOANS_ID"

# Initialize contracts
echo "🔧 Initializing contracts..."

# Initialize PolicyRegistry
soroban contract invoke \
  --id $POLICY_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin "$(soroban config identity address deployer)"

# Initialize PriceAdapter
soroban contract invoke \
  --id $ORACLE_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin "$(soroban config identity address deployer)"

# Initialize LiquidationManager with PolicyRegistry and PriceAdapter
soroban contract invoke \
  --id $LIQUIDATION_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin "$(soroban config identity address deployer)" \
  --policy_registry "$POLICY_ID" \
  --price_adapter "$ORACLE_ID"

# Initialize Loans with all dependencies
soroban contract invoke \
  --id $LOANS_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin "$(soroban config identity address deployer)" \
  --policy_registry "$POLICY_ID" \
  --price_adapter "$ORACLE_ID" \
  --liquidation_manager "$LIQUIDATION_ID"

echo "✅ All contracts initialized"

# Output env vars
echo ""
echo "📝 Add these to your .env.local or Vercel environment:"
echo "NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=$POLICY_ID"
echo "NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=$ORACLE_ID"
echo "NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=$LIQUIDATION_ID"
echo "NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=$LOANS_ID"
echo ""
echo "🎉 Deployment complete!"
