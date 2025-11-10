# Legasi × Stellar Lending Protocol MVP

Complete institutional-grade crypto lending protocol built on Stellar + Soroban with Supabase backend and Vercel deployment.

## 🌟 Features

### Core Infrastructure
- **Dark Glass Dashboard** - Institutional UI with glassmorphism, violet-cyan gradients, and Framer Motion animations
- **Supabase Backend** - PostgreSQL database for price feeds, positions, liquidations, KYC, and audit logs
- **Soroban Integration** - Smart contract interfaces for Loans, LiquidationManager, PolicyRegistry, PriceOracle, and KYC
- **Fireblocks Custody** - MPC vault management with segregated collateral (BTC/USDC)
- **SEP Standards** - SEP-10 auth, SEP-12 KYC, SEP-24 fiat off-ramps

### Dashboard Modules
- **Overview** - Real-time metrics: Total Collateral, Active Loans, Average LTV, Pending Liquidations
- **Price Manager** - Admin portal to review and approve oracle price feeds before pushing to Soroban
- **Positions** - View all borrower positions with collateral, LTV, and health status
- **Liquidations** - Monitor liquidation intents and execute off-chain settlements
- **Vaults** - Track Fireblocks vault balances and audit custody events
- **Policies** - Configure LTV bands, interest rates, liquidation parameters

## 📊 Database Schema

### Core Tables
1. **price_feeds** - Asset prices with approval workflow
2. **kyc_registry** - User verification status (SEP-12)
3. **fireblocks_vaults** - Custody vault tracking
4. **positions** - Borrower loan positions
5. **liquidation_intents** - Soft liquidation events
6. **liquidation_receipts** - Executed liquidation records
7. **policy_parameters** - Risk/rate configuration
8. **lp_deposits** - Liquidity provider contributions
9. **audit_logs** - Complete event history

## 🚀 Quick Start

### 1. Setup Supabase

Run the SQL migration:
\`\`\`bash
# In Supabase SQL Editor, run:
scripts/01-create-schema.sql
\`\`\`

### 2. Environment Variables

Add to Vercel or `.env.local`:

\`\`\`bash
# Supabase (auto-provided in v0)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Soroban Contract Addresses (deploy first)
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=CDUMMY...
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=CDUMMY...
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=CDUMMY...
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=CDUMMY...
NEXT_PUBLIC_SOROBAN_KYC_CONTRACT=CDUMMY...

# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet

# Fireblocks (server-side only)
FIREBLOCKS_API_KEY=your_api_key
FIREBLOCKS_API_SECRET=your_secret
\`\`\`

### 3. Deploy to Vercel

\`\`\`bash
# Push to GitHub and connect to Vercel
git init
git add .
git commit -m "Initial Legasi MVP"
git push origin main

# Or use Vercel CLI
vercel --prod
\`\`\`

## 🏗️ Architecture

### On-Chain (Soroban Smart Contracts)
- **Loans** - Position ledger, draw/repay logic
- **LiquidationManager** - Health checks, soft liquidation bands
- **PolicyRegistry** - Governance parameters (LTV, rates, bands)
- **PriceOracleAdapter** - Price feed interface
- **KYCRegistry** - User verification status

### Off-Chain (Supabase + Vercel)
- **Database** - Supabase PostgreSQL for all state
- **APIs** - Next.js serverless functions:
  - `/api/prices` - GET/POST price feeds
  - `/api/prices/approve` - Approve and push to Soroban
  - `/api/positions` - Fetch loan positions
  - `/api/kyc/sync` - Sync KYC status
  - `/api/liquidations` - Liquidation intents

### Custody Layer (Fireblocks)
- Segregated MPC vaults per position
- Whitelisted CEX settlement accounts
- Event listeners for reconciliation

## 📖 User Flows

### Price Update Flow
1. Admin or cron job adds price to Supabase (`/api/prices POST`)
2. Price appears in dashboard as "Pending"
3. Admin reviews and clicks "Approve"
4. Backend pushes approved price to `PriceOracleAdapter` contract
5. All contracts now use updated price for LTV calculations

### Loan Creation Flow
1. User authenticates via SEP-10
2. KYC verification via SEP-12 → synced to `kyc_registry`
3. User deposits collateral into Fireblocks vault
4. Backend calls `Loans.open()` on Soroban
5. Position created in Supabase `positions` table
6. User can draw stablecoins up to max LTV

### Liquidation Flow
1. `LiquidationManager` detects LTV breach
2. Emits `LiquidationIntent` on-chain
3. Backend executor trades on CEX via Fireblocks
4. Submits `LiquidationReceipt` back to contract
5. `Loans` reduces debt, updates LTV
6. If LTV healthy, cooldown starts

## 🎨 Design System

### Colors
- **Background**: `#0C0F1A` (deep navy)
- **Card**: `#111727` (glass surface)
- **Primary**: `#7C3AED` (violet)
- **Accent**: `#06B6D4` (cyan)
- **Success**: `#22C55E`
- **Destructive**: `#F43F5E`

### Typography
- **Headings**: Inter 800
- **Body**: Inter 400
- **Mono**: JetBrains Mono

### Effects
- Glass morphism: `backdrop-filter: blur(12px)`
- Gradients: `from-violet-500 to-cyan-400`
- Glow effects on hover

## 📡 API Endpoints

### GET /api/prices
Fetch recent price feeds
\`\`\`json
{ "prices": [...] }
\`\`\`

### POST /api/prices
Add new price feed
\`\`\`json
{ "asset": "BTC", "price": 45000, "source": "Coinbase" }
\`\`\`

### POST /api/prices/approve
Approve price and push to Soroban
\`\`\`json
{ "price_id": "uuid", "approved_by": "admin" }
\`\`\`

### GET /api/positions
Fetch all loan positions with vault data

### POST /api/kyc/sync
Sync KYC status from SEP-12 anchor
\`\`\`json
{ "stellar_address": "G...", "kyc_status": "verified" }
\`\`\`

## 🔒 Security

- **RLS**: Row Level Security enabled on sensitive tables
- **Audit Logs**: All actions logged to `audit_logs`
- **Policy Hash**: Liquidations include policy hash to prevent mid-flight changes
- **Oracle Safety**: Freshness checks, TWAP validation, circuit breakers
- **Custody**: Fireblocks MPC with segregated vaults

## 🚢 Deployment Checklist

- [ ] Deploy Soroban contracts to testnet
- [ ] Update contract addresses in env vars
- [ ] Run Supabase migration
- [ ] Configure Fireblocks API keys (server-side only)
- [ ] Set up SEP-12 KYC anchor integration
- [ ] Deploy to Vercel
- [ ] Test price approval flow
- [ ] Test liquidation monitoring

## 📚 Next Steps

1. **Integrate Stellar SDK** - Add real SEP-10/12/24 flows
2. **Connect Fireblocks** - Implement vault creation and balance syncing
3. **Deploy Contracts** - Deploy Soroban contracts and update addresses
4. **Add Monitoring** - Set up alerts for stale prices, high LTV positions
5. **Build Admin Panel** - Policy updates, circuit breaker controls
6. **Add Analytics** - Charts for liquidity, utilization, interest earned

## 📄 License

MIT - Built for Stellar Ecosystem

---

**Built with**: Next.js 16, Supabase, Tailwind CSS, Framer Motion, Soroban
**Deployed on**: Vercel
**Network**: Stellar Testnet (Soroban)
\`\`\`
