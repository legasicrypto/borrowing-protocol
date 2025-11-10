#!/bin/bash


echo "Building Soroban contracts..."

# Build all contracts
cd contracts

for dir in loans policy_registry price_adapter liquidation_manager; do
  echo "Building $dir..."
  cd $dir
  stellar contract build
  cd ..
done

echo "All contracts built successfully!"
echo ""
echo "Deploying to testnet..."

# Deploy contracts
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/loans.wasm \
  --source-account $DEPLOYER_SECRET_KEY \
  --network testnet

echo ""
echo "Update environment variables with deployed contract addresses!"
