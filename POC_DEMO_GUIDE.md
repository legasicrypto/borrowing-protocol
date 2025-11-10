# Legasi POC Demo Guide

## Overview
This is a functional end-to-end proof of concept for Legasi, an institutional credit layer on Stellar. The demo showcases core lending functionality with real Soroban smart contracts deployed on Stellar Testnet.

## What's Working

### ✅ Smart Contracts (Deployed on Testnet)
- **Loans Contract**: Manages positions, borrowing, and repayments
- **PolicyRegistry Contract**: Stores risk parameters and LTV limits
- **PriceAdapter Contract**: Oracle price feed management
- **LiquidationManager Contract**: Handles liquidation logic

### ✅ Frontend Features
- **Borrow Page**: Create loans against BTC, XLM, or USDC collateral
- **My Positions**: View all active loans with real-time data
- **Repay**: Repay loans and reduce debt
- **History**: Transaction history of all activities
- **Management Dashboard**: Admin controls for prices and policies

### ✅ Integration
- Wallet connection (Freighter, Rabet, xBull, Albedo)
- TypeScript bindings auto-generated from contracts
- Real on-chain transactions with confirmation
- Supabase database for off-chain indexing

## Quick Start

### 1. Deploy Contracts
\`\`\`bash
# Make scripts executable
chmod +x scripts/scaffold-setup.sh
chmod +x scripts/deploy-testnet.sh

# Run scaffold setup (builds and deploys all contracts)
./scripts/scaffold-setup.sh
\`\`\`

This will:
- Build all 4 Soroban contracts
- Deploy them to Stellar Testnet
- Generate TypeScript bindings
- Initialize contracts with default policies
- Set initial prices for BTC ($95k), XLM ($0.42), USDC ($1.00)

### 2. Update Environment Variables
After deployment, update your `.env` file with the contract IDs from `lib/contracts/deployed-contracts.json`:

\`\`\`env
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=<loans_contract_id>
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=<policy_contract_id>
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=<price_contract_id>
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=<liquidation_contract_id>

NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Your deployer key (for admin functions)
DEPLOYER_SECRET_KEY=<your_secret_key>
\`\`\`

### 3. Start the App
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Testing the Demo

### Create a Loan
1. Connect your Stellar wallet (must have testnet XLM for fees)
2. Go to "Borrow" page
3. Select collateral asset (BTC, XLM, or USDC)
4. Enter collateral amount
5. Adjust LTV slider
6. Click "Borrow Now"
7. Confirm transaction in wallet
8. View your loan in "My Positions"

### Repay a Loan
1. Go to "My Positions"
2. Click "Repay" on an active loan
3. Enter repayment amount
4. Confirm transaction
5. Position updates immediately

### Admin Functions
1. Go to "Management" → "Prices"
2. Update asset prices (requires admin wallet)
3. View policies and risk parameters

## Architecture

### Smart Contract Layer
\`\`\`
┌─────────────────┐
│  Loans Contract │ ← Main ledger
└────────┬────────┘
         │
    ┌────┴─────┬─────────┬──────────────┐
    │          │         │              │
┌───▼───┐  ┌──▼──┐  ┌───▼────┐  ┌──────▼─────┐
│ Policy│  │Price│  │Liquida-│  │  KYC Reg   │
│  Reg  │  │Adapt│  │ tion   │  │  (future)  │
└───────┘  └─────┘  └────────┘  └────────────┘
\`\`\`

### Frontend Integration
\`\`\`
User Wallet
    ↓
ContractClient (TypeScript)
    ↓
Stellar SDK → Soroban RPC
    ↓
Smart Contracts (Testnet)
    ↓
Events → Supabase (off-chain index)
\`\`\`

## Key Features Demonstrated

### 1. On-Chain Loan Creation
- User signs transaction with their wallet
- Contract validates collateral and LTV
- Position opened on-chain with unique ID
- Events emitted for off-chain indexing

### 2. Real-Time Position Tracking
- Queries contract for current position state
- Calculates health factor and liquidation price
- Shows accrued interest and total debt

### 3. Secure Repayments
- On-chain transaction reduces principal/interest
- Position status updated automatically
- Can close position when fully repaid

### 4. Oracle Price Management
- Admin can update asset prices
- Price jump protection (max 50% change)
- Staleness checks for safety

### 5. Risk Parameters
- Per-asset LTV limits (BTC: 70%, XLM: 50%, USDC: 80%)
- Interest rates based on utilization
- Liquidation bands for gradual liquidation

## Demo Limitations (MVP Scope)

### Not Yet Implemented
- ❌ Full KYC contract integration
- ❌ Actual stablecoin minting (USDC transfers)
- ❌ Fireblocks custody integration
- ❌ Automated liquidation execution
- ❌ Interest accrual automation
- ❌ Multi-signature admin controls

### Simplified for Demo
- ✓ Loans stored in contract state (not external vault references)
- ✓ Manual price updates (not real-time oracle)
- ✓ Simulated collateral deposits (not real transfers)
- ✓ Single admin account (not governance)

## Next Steps for Production

1. **Full Custody Integration**: Connect Fireblocks API for real asset management
2. **Oracle Automation**: Use Stellar Price Feeds or Chainlink
3. **Liquidation Bot**: Automated monitoring and execution
4. **Interest Accrual**: Time-based interest calculation cron
5. **KYC/AML**: Complete compliance framework
6. **Governance**: Multi-sig and DAO controls
7. **Audits**: Security audit all contracts

## Support

For questions or issues:
- Check contract deployment logs in `scripts/deploy-testnet.sh`
- View transaction errors in browser console
- Inspect Supabase tables for off-chain data
- Use Stellar Expert to view on-chain state

## Contract Addresses

After deployment, your contract addresses will be in:
`lib/contracts/deployed-contracts.json`

Example:
\`\`\`json
{
  "network": "testnet",
  "rpcUrl": "https://soroban-testnet.stellar.org",
  "contracts": {
    "loans": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "policyRegistry": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "priceAdapter": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "liquidationManager": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  },
  "deployedAt": "2025-01-08T..."
}
\`\`\`

## Success Metrics

This POC successfully demonstrates:
- ✅ Soroban smart contracts deployed and functional
- ✅ Frontend integrated with contract bindings
- ✅ End-to-end loan creation and repayment flow
- ✅ Real wallet signatures and on-chain transactions
- ✅ Position management and tracking
- ✅ Admin controls for parameters
- ✅ Reviewers can interact with live demo

**Ready for demo presentation and investor review!** 🚀
