#!/bin/bash
# Contract deployment script for Stellar Soroban

set -e

echo "🚀 Deploying Legasi Soroban Contracts to Stellar Testnet"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found. Please install it first:"
    echo "cargo install --locked stellar-cli --features opt"
    exit 1
fi

# Network configuration
NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"

# Build contracts
echo "📦 Building contracts..."
cd contracts

echo "Building PolicyRegistry..."
cd policy_registry && stellar contract build && cd ..

echo "Building PriceAdapter..."
cd price_adapter && stellar contract build && cd ..

echo "Building LiquidationManager..."
cd liquidation_manager && stellar contract build && cd ..

echo "Building Loans..."
cd loans && stellar contract build && cd ..

cd ..

echo "✅ Contracts built successfully"

# Deploy contracts
echo "🌐 Deploying contracts to $NETWORK..."

echo "Deploying PolicyRegistry..."
POLICY_ID=$(stellar contract deploy \
  --wasm contracts/policy_registry/target/wasm32-unknown-unknown/release/policy_registry.wasm \
  --source-account default \
  --network $NETWORK \
  --rpc-url $RPC_URL)
echo "PolicyRegistry deployed: $POLICY_ID"

echo "Deploying PriceAdapter..."
ORACLE_ID=$(stellar contract deploy \
  --wasm contracts/price_adapter/target/wasm32-unknown-unknown/release/price_adapter.wasm \
  --source-account default \
  --network $NETWORK \
  --rpc-url $RPC_URL)
echo "PriceAdapter deployed: $ORACLE_ID"

echo "Deploying LiquidationManager..."
LIQUIDATION_ID=$(stellar contract deploy \
  --wasm contracts/liquidation_manager/target/wasm32-unknown-unknown/release/liquidation_manager.wasm \
  --source-account default \
  --network $NETWORK \
  --rpc-url $RPC_URL)
echo "LiquidationManager deployed: $LIQUIDATION_ID"

echo "Deploying Loans..."
LOANS_ID=$(stellar contract deploy \
  --wasm contracts/loans/target/wasm32-unknown-unknown/release/loans.wasm \
  --source-account default \
  --network $NETWORK \
  --rpc-url $RPC_URL)
echo "Loans deployed: $LOANS_ID"

# Save contract IDs
echo "💾 Saving contract IDs..."
cat > .env.contracts << EOF
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=$POLICY_ID
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=$ORACLE_ID
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=$LIQUIDATION_ID
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=$LOANS_ID
EOF

echo "✅ Contract IDs saved to .env.contracts"
echo ""
echo "📋 Add these to your Vercel environment variables:"
echo "NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=$POLICY_ID"
echo "NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=$ORACLE_ID"
echo "NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=$LIQUIDATION_ID"
echo "NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=$LOANS_ID"
echo ""
echo "🎉 Deployment complete!"
