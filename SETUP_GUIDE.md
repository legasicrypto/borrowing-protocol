# Legasi Platform Setup Guide

Complete guide to deploy and run the Legasi institutional credit platform on Stellar Soroban.

## Prerequisites

- Node.js 18+ and npm/yarn/bun
- Rust and Cargo (for contract development)
- Soroban CLI (`cargo install soroban-cli`)
- Stellar account with testnet XLM
- Supabase account
- Vercel account (for deployment)

## 1. Environment Setup

Create `.env.local` file with the following variables:

\`\`\`bash
# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Soroban Contracts (will be set after deployment)
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=
NEXT_PUBLIC_SOROBAN_KYC_CONTRACT=

# Server-side secrets
DEPLOYER_SECRET_KEY=S...  # Your Stellar secret key for deploying/signing

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional: Fireblocks for institutional custody
FIREBLOCKS_API_KEY=
FIREBLOCKS_API_SECRET=
\`\`\`

## 2. Deploy Soroban Smart Contracts

### Configure Soroban CLI

\`\`\`bash
# Add testnet network
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Create deployer identity
soroban keys generate deployer --network testnet

# Fund deployer account (get XLM from friendbot)
curl "https://friendbot.stellar.org?addr=$(soroban keys address deployer)"
\`\`\`

### Build and Deploy Contracts

\`\`\`bash
# Make deployment script executable
chmod +x scripts/deploy-soroban.sh

# Deploy all contracts
./scripts/deploy-soroban.sh
\`\`\`

This will:
1. Build all 4 contracts (PolicyRegistry, PriceAdapter, LiquidationManager, Loans)
2. Deploy them to Stellar testnet
3. Initialize each contract with proper admin and dependencies
4. Output contract IDs to add to your `.env` file

**Add the contract IDs to your `.env.local` file!**

## 3. Setup Supabase Database

Run the SQL migration script in Supabase SQL editor:

\`\`\`bash
# Copy content from scripts/01-create-schema.sql
# Paste and run in Supabase SQL Editor
\`\`\`

This creates tables for:
- `users` - KYC status and user profiles
- `positions` - Loan positions (mirrors on-chain state)
- `prices` - Oracle price feeds (mirrors on-chain state)
- `policies` - Lending policies (mirrors on-chain state)
- `liquidations` - Liquidation intents and history

## 4. Initialize On-Chain Data

### Set Initial Prices

\`\`\`bash
# Update BTC price
soroban contract invoke \
  --id $ORACLE_CONTRACT \
  --source deployer \
  --network testnet \
  -- update_price \
  --asset BTC \
  --price 4500000000000 \
  --round_id 1 \
  --timestamp $(date +%s)

# Update XLM price
soroban contract invoke \
  --id $ORACLE_CONTRACT \
  --source deployer \
  --network testnet \
  -- update_price \
  --asset XLM \
  --price 42000000 \
  --round_id 1 \
  --timestamp $(date +%s)
\`\`\`

### Set Lending Policies

\`\`\`bash
# Set BTC policy
soroban contract invoke \
  --id $POLICY_CONTRACT \
  --source deployer \
  --network testnet \
  -- set_policy \
  --asset BTC \
  --max_ltv 70 \
  --liquidation_threshold 80 \
  --interest_rate 650
\`\`\`

## 5. Run Application Locally

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

Visit `http://localhost:3000`

## 6. Deploy to Vercel

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# - All NEXT_PUBLIC_* variables
# - DEPLOYER_SECRET_KEY (server-side only)
# - Supabase credentials
\`\`\`

## 7. Testing the Flow

### Create a Test User

1. Connect wallet (Freighter, Rabet, xBull, or Albedo)
2. Manually verify KYC in Supabase:

\`\`\`sql
INSERT INTO users (stellar_address, kyc_status, email)
VALUES ('G...YOUR_ADDRESS', 'verified', 'test@example.com');
\`\`\`

### Create a Loan

1. Go to Dashboard → Borrow
2. Select collateral asset (BTC, XLM, USDC)
3. Enter collateral amount
4. Adjust LTV ratio
5. Click "Borrow Now"

This will:
- Check KYC status
- Validate LTV against policy
- Call `Loans.open_position()` on-chain
- Call `Loans.draw()` to disburse funds
- Store position in Supabase

### View Position

- Go to Dashboard → My Positions
- See your active loan with real-time LTV

### Repay Loan

1. Go to Dashboard → Repay
2. Select position
3. Enter repayment amount
4. Click "Repay On-Chain"

This calls `Loans.repay()` and updates the position.

## 8. Admin Functions

### Update Prices (Management Dashboard)

1. Go to Dashboard → Management → Prices
2. Select asset
3. Enter new price
4. Click "Update Price On-Chain"

### Monitor Liquidations

1. Go to Dashboard → Liquidations
2. View positions at risk
3. Execute soft liquidations

## Troubleshooting

### "Contract not found" error

- Verify contract IDs in `.env` match deployed contracts
- Check network is set to `testnet`

### "Bad signature" error

- Ensure `DEPLOYER_SECRET_KEY` is set correctly
- Account must be funded with XLM

### "KYC required" error

- Add your wallet address to `users` table in Supabase
- Set `kyc_status = 'verified'`

### Price data missing

- Initialize prices using the Soroban CLI commands above
- Or use the Management dashboard to update prices

## Architecture Overview

\`\`\`
Frontend (Next.js)
    ↓
API Routes (Server Actions)
    ↓
Soroban Transaction Builder
    ↓
Stellar Network (Testnet)
    ↓
Smart Contracts:
  - Loans (core lending logic)
  - PolicyRegistry (LTV limits, rates)
  - PriceAdapter (oracle integration)
  - LiquidationManager (soft liquidations)
    ↓
Supabase (off-chain mirror for UX)
\`\`\`

## Next Steps

1. **Mainnet Deployment**: Change network to `mainnet` and redeploy contracts
2. **Real Oracle Integration**: Connect to Stellar price oracles
3. **Fireblocks Integration**: Add institutional custody support
4. **Enhanced KYC**: Integrate with KYC providers
5. **Governance**: Add DAO controls for policies

## Support

For issues or questions:
- Check contract logs: `soroban contract inspect --id <CONTRACT_ID>`
- View transaction details: `soroban tx view --hash <TX_HASH>`
- Debug RPC calls: Check browser console for `[v0]` logs
