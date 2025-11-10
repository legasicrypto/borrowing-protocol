# Contract Deployment Guide

This guide explains how to deploy the Legasi Soroban smart contracts to Stellar testnet/mainnet.

## Prerequisites

1. Install Stellar CLI:
\`\`\`bash
cargo install --locked stellar-cli --features opt
\`\`\`

2. Configure your Stellar account:
\`\`\`bash
stellar keys generate --global default --network testnet
\`\`\`

3. Fund your testnet account:
Visit https://laboratory.stellar.org/#account-creator and fund your account with test XLM.

## Building Contracts

Build all contracts:
\`\`\`bash
cd contracts
./build-all.sh
\`\`\`

Or build individually:
\`\`\`bash
cd contracts/loans
stellar contract build
\`\`\`

## Deploying Contracts

### Automatic Deployment

Run the deployment script:
\`\`\`bash
chmod +x scripts/deploy-contracts.sh
./scripts/deploy-contracts.sh
\`\`\`

This will:
1. Build all contracts
2. Deploy them to testnet
3. Save contract IDs to `.env.contracts`

### Manual Deployment

Deploy each contract individually:

\`\`\`bash
# Deploy PolicyRegistry
stellar contract deploy \
  --wasm contracts/policy_registry/target/wasm32-unknown-unknown/release/policy_registry.wasm \
  --source-account default \
  --network testnet

# Deploy PriceAdapter
stellar contract deploy \
  --wasm contracts/price_adapter/target/wasm32-unknown-unknown/release/price_adapter.wasm \
  --source-account default \
  --network testnet

# Deploy LiquidationManager
stellar contract deploy \
  --wasm contracts/liquidation_manager/target/wasm32-unknown-unknown/release/liquidation_manager.wasm \
  --source-account default \
  --network testnet

# Deploy Loans
stellar contract deploy \
  --wasm contracts/loans/target/wasm32-unknown-unknown/release/loans.wasm \
  --source-account default \
  --network testnet
\`\`\`

## Initializing Contracts

After deployment, initialize each contract:

\`\`\`bash
# Initialize PolicyRegistry
stellar contract invoke \
  --id <POLICY_CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- initialize \
  --admin <YOUR_PUBLIC_KEY>

# Initialize PriceAdapter
stellar contract invoke \
  --id <ORACLE_CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- initialize \
  --admin <YOUR_PUBLIC_KEY>

# Initialize LiquidationManager  
stellar contract invoke \
  --id <LIQUIDATION_CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- initialize \
  --loans_contract <LOANS_CONTRACT_ID> \
  --policy_registry <POLICY_CONTRACT_ID> \
  --admin <YOUR_PUBLIC_KEY>

# Initialize Loans
stellar contract invoke \
  --id <LOANS_CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- initialize \
  --oracle <ORACLE_CONTRACT_ID> \
  --policy_registry <POLICY_CONTRACT_ID> \
  --liquidation_mgr <LIQUIDATION_CONTRACT_ID> \
  --admin <YOUR_PUBLIC_KEY>
\`\`\`

## Configuration

Add the deployed contract IDs to your environment variables:

### Local Development (.env.local)
\`\`\`env
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=<LOANS_ID>
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=<LIQUIDATION_ID>
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=<POLICY_ID>
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=<ORACLE_ID>
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
\`\`\`

### Vercel Production
Add these as environment variables in your Vercel project settings.

## Testing Contracts

Test contract functions using the Stellar CLI:

\`\`\`bash
# Example: Check if user is KYC verified
stellar contract invoke \
  --id <LOANS_CONTRACT_ID> \
  --source-account default \
  --network testnet \
  -- get_position \
  --position_id "pos_123"
\`\`\`

## Monitoring

Monitor your contracts on Stellar Expert:
- Testnet: https://stellar.expert/explorer/testnet
- Mainnet: https://stellar.expert/explorer/public

## Troubleshooting

### Build Errors
- Ensure Rust is up to date: `rustup update`
- Clean and rebuild: `cargo clean && stellar contract build`

### Deployment Errors
- Check account has sufficient XLM
- Verify network is accessible
- Check contract size (must be < 64KB)

### Transaction Errors
- Verify contract is initialized
- Check account has authorization
- Ensure correct function parameters

## Mainnet Deployment

For mainnet deployment:
1. Change network to `--network mainnet`
2. Use mainnet RPC URL
3. Ensure account has real XLM
4. Test thoroughly on testnet first
5. Update environment variables to use mainnet

## Support

For issues or questions:
- Stellar Developer Discord: https://discord.gg/stellardev
- Documentation: https://developers.stellar.org/docs/smart-contracts
