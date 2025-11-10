# Legasi × Stellar - Complete Deployment Guide

This guide covers the full end-to-end deployment of the Legasi lending protocol MVP.

## Phase 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key
3. Add them to Vercel environment variables (already done in v0)

### 1.2 Run Database Migration
1. Go to Supabase SQL Editor
2. Copy contents of `scripts/01-create-schema.sql`
3. Execute the script
4. Verify tables are created:
   - price_feeds
   - kyc_registry
   - fireblocks_vaults
   - positions
   - liquidation_intents
   - liquidation_receipts
   - policy_parameters
   - lp_deposits
   - audit_logs

### 1.3 Enable Row Level Security (Optional)
For production, enable RLS policies on sensitive tables:

\`\`\`sql
-- Example RLS policy for positions
CREATE POLICY "Users can view their own positions"
ON positions
FOR SELECT
USING (borrower_address = current_user_stellar_address());
\`\`\`

## Phase 2: Soroban Smart Contract Deployment

### 2.1 Setup Soroban CLI
\`\`\`bash
# Install Soroban CLI
cargo install --locked soroban-cli

# Configure network
soroban network add testnet \\
  --rpc-url https://soroban-testnet.stellar.org:443 \\
  --network-passphrase "Test SDF Network ; September 2015"

# Create identity
soroban keys generate admin --network testnet
\`\`\`

### 2.2 Deploy Contracts
You'll need to deploy 5 core contracts. Here's the structure:

\`\`\`
contracts/
├── loans/
│   └── src/lib.rs
├── liquidation_manager/
│   └── src/lib.rs
├── policy_registry/
│   └── src/lib.rs
├── price_oracle/
│   └── src/lib.rs
└── kyc_registry/
    └── src/lib.rs
\`\`\`

Deploy each contract:

\`\`\`bash
# Example: Deploy Loans contract
cd contracts/loans
soroban contract build
soroban contract deploy \\
  --wasm target/wasm32-unknown-unknown/release/loans.wasm \\
  --source admin \\
  --network testnet

# Note the contract ID: CDUMMY_LOANS_CONTRACT_ID
\`\`\`

Repeat for all 5 contracts and note their IDs.

### 2.3 Initialize Contracts
\`\`\`bash
# Initialize PolicyRegistry with default parameters
soroban contract invoke \\
  --id CPOLICY_CONTRACT_ID \\
  --source admin \\
  --network testnet \\
  -- initialize \\
  --admin GADMIN_ADDRESS

# Link contracts together
soroban contract invoke \\
  --id CLOANS_CONTRACT_ID \\
  --source admin \\
  --network testnet \\
  -- set_policy_registry \\
  --registry CPOLICY_CONTRACT_ID

# ... repeat for other contract linkages
\`\`\`

## Phase 3: Fireblocks Integration

### 3.1 Create Fireblocks Account
1. Sign up at [fireblocks.com](https://www.fireblocks.com)
2. Create sandbox workspace for testing
3. Generate API credentials

### 3.2 Configure Vaults
\`\`\`javascript
// Example Fireblocks vault creation (backend code)
const fireblocks = new Fireblocks({
  apiKey: process.env.FIREBLOCKS_API_KEY,
  secretKey: process.env.FIREBLOCKS_API_SECRET
})

// Create BTC vault
const vault = await fireblocks.createVault({
  name: 'Legasi-BTC-Vault-001',
  assetId: 'BTC',
  autoFuel: false
})
\`\`\`

### 3.3 Whitelist Exchange Accounts
Configure Fireblocks policies to only allow trades with:
- Bybit settlement account
- Deribit settlement account

## Phase 4: Vercel Deployment

### 4.1 Connect GitHub Repository
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository

### 4.2 Configure Environment Variables
Add all required variables in Vercel dashboard:

**Supabase** (auto-configured in v0)
\`\`\`
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhb...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
\`\`\`

**Soroban Contracts**
\`\`\`
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=CDUMMY_LOANS_...
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=CDUMMY_LIQ_...
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=CDUMMY_POLICY_...
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=CDUMMY_ORACLE_...
NEXT_PUBLIC_SOROBAN_KYC_CONTRACT=CDUMMY_KYC_...
NEXT_PUBLIC_STELLAR_NETWORK=testnet
\`\`\`

**Fireblocks** (server-side only)
\`\`\`
FIREBLOCKS_API_KEY=xxx
FIREBLOCKS_API_SECRET=xxx
\`\`\`

### 4.3 Deploy
\`\`\`bash
# Using Vercel CLI
vercel --prod

# Or push to main branch for auto-deploy
git push origin main
\`\`\`

## Phase 5: SEP Integration

### 5.1 Setup SEP-10 (Authentication)
\`\`\`typescript
// Example SEP-10 integration
import { Networks, TransactionBuilder } from '@stellar/stellar-sdk'

async function authenticateUser(publicKey: string) {
  // 1. Request challenge from WebAuth server
  const challenge = await fetch(
    'https://sep10.example.com/auth?account=' + publicKey
  )
  
  // 2. User signs with wallet
  // 3. Submit signed transaction back to server
  // 4. Receive JWT token
}
\`\`\`

### 5.2 Setup SEP-12 (KYC)
Partner with a Stellar anchor (e.g., MoneyGram, AnchorUSD) for KYC:

\`\`\`typescript
// Sync KYC status from anchor
async function syncKYC(stellarAddress: string) {
  const kycData = await fetch(
    'https://sep12.anchor.example.com/customer/' + stellarAddress,
    {
      headers: { 'Authorization': 'Bearer ' + jwt }
    }
  )
  
  // Update Supabase
  await supabase.from('kyc_registry').upsert({
    stellar_address: stellarAddress,
    kyc_status: kycData.status
  })
}
\`\`\`

### 5.3 Setup SEP-24 (Fiat Off-Ramp)
\`\`\`typescript
// Initiate fiat withdrawal
async function offRamp(amount: number, asset: string) {
  const response = await fetch(
    'https://sep24.anchor.example.com/transactions/withdraw/interactive',
    {
      method: 'POST',
      body: JSON.stringify({ asset_code: asset, amount })
    }
  )
  
  // Open popup for user to complete withdrawal
  window.open(response.url, '_blank')
}
\`\`\`

## Phase 6: Monitoring & Analytics

### 6.1 Setup Logging
\`\`\`typescript
// Add Sentry for error tracking
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})
\`\`\`

### 6.2 Setup Alerts
Configure alerts for:
- Stale price feeds (>60s old)
- High LTV positions (>80%)
- Failed liquidation executions
- Fireblocks vault balance mismatches

### 6.3 Dashboard Analytics
Add Vercel Analytics:
\`\`\`typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
\`\`\`

## Phase 7: Testing

### 7.1 Price Feed Flow
1. Add test price: POST /api/prices
2. Verify appears in dashboard
3. Approve price
4. Verify pushed to Soroban contract

### 7.2 Loan Creation Flow
1. Create test Fireblocks vault
2. Fund with test BTC
3. Call Loans.open() via Soroban
4. Verify position appears in dashboard

### 7.3 Liquidation Flow
1. Artificially lower collateral price
2. Verify LiquidationIntent emitted
3. Execute off-chain trade
4. Submit receipt
5. Verify debt reduced

## Production Checklist

- [ ] Soroban contracts deployed to mainnet
- [ ] Supabase production database configured
- [ ] RLS policies enabled
- [ ] Fireblocks production workspace setup
- [ ] Exchange accounts whitelisted
- [ ] SEP-10/12/24 anchor integrated
- [ ] Environment variables configured
- [ ] Monitoring and alerts active
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Documentation updated
- [ ] Team trained on operations

## Troubleshooting

### Price feeds not updating
- Check Supabase connection
- Verify API route is accessible
- Check Soroban RPC connection

### Liquidations not executing
- Verify Fireblocks API credentials
- Check exchange whitelist
- Review LiquidationManager logs

### KYC sync failing
- Verify anchor SEP-12 endpoint
- Check JWT token validity
- Review anchor documentation

## Support

For issues:
1. Check [Stellar Discord](https://discord.gg/stellar)
2. Review [Soroban Docs](https://soroban.stellar.org)
3. Contact Fireblocks support

---

**Deployment Time Estimate**: 2-3 days for testnet, 1-2 weeks for production
\`\`\`
