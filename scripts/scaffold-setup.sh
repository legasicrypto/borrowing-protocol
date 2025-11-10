#!/bin/bash
# Scaffold Stellar Setup Script for Legasi POC

echo "🚀 Setting up Scaffold Stellar POC for Legasi..."

# Build all contracts
echo "📦 Building Soroban contracts..."
cd contracts

cd loans && stellar contract build && cd ..
cd policy_registry && stellar contract build && cd ..
cd price_adapter && stellar contract build && cd ..
cd liquidation_manager && stellar contract build && cd ..

cd ..

echo "✅ Contracts built successfully!"

# Deploy to testnet
echo "🌐 Deploying to Stellar Testnet..."
chmod +x scripts/deploy-testnet.sh
./scripts/deploy-testnet.sh

echo "✨ Scaffold Stellar POC setup complete!"
