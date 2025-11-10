# Legasi Platform - Demo Data Guide

## Quick Start

To populate your Legasi platform with comprehensive demo data for showcase purposes, follow these steps:

### 1. Load Demo Data into Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `scripts/02-insert-demo-data.sql`
4. Paste and click **Run**
5. Wait for confirmation (should take ~2 seconds)

### 2. Verify Data Loaded Successfully

Run this query in the SQL Editor to see a summary:

\`\`\`sql
SELECT 'Active Loans' as metric, COUNT(*)::text as value FROM positions WHERE status = 'active'
UNION ALL
SELECT 'Total Borrowed (USDC)', '$' || TO_CHAR(SUM(principal + accrued_interest), '999,999,999') FROM positions WHERE status = 'active'
UNION ALL
SELECT 'LP Liquidity (USDC)', '$' || TO_CHAR(SUM(amount), '999,999,999') FROM lp_deposits
UNION ALL
SELECT 'Verified Users', COUNT(*)::text FROM kyc_registry WHERE kyc_status = 'verified'
UNION ALL
SELECT 'Active Vaults', COUNT(*)::text FROM fireblocks_vaults WHERE status = 'active';
\`\`\`

### 3. Explore the Dashboard

Now visit your dashboard and explore all sections:

#### 📊 **Overview** (`/dashboard`)
- **Total Collateral**: $1,293,000 across BTC, ETH, and XLM
- **Active Loans**: 5 positions
- **Total Borrowed**: $408,690 USDC
- **Average LTV**: 52.54%
- **LP Liquidity**: $2,750,000

#### 💰 **Borrow** (`/dashboard/borrow`)
- Try creating a new loan with any collateral asset
- See real-time LTV and health factor calculations
- Test liquidation price calculations

#### 📋 **My Positions** (`/dashboard/positions`)
- View 5 active loan positions
- See collateral amounts, borrowed values, LTV percentages
- Check health factors (Safe, At Risk, Critical)
- Monitor accrued interest in real-time

#### 💳 **Repay** (`/dashboard/repay`)
- Select any active position
- Simulate partial or full repayment
- See interest calculations

#### 📜 **History** (`/dashboard/history`)
- 8 total transactions (5 opens, 2 closes, 1 liquidation)
- Filter by status and asset type
- View complete transaction details

#### ⚙️ **Management**

##### 💵 **Prices** (`/dashboard/management/prices`)
- 5 approved price feeds
- BTC: $95,000
- ETH: $3,200
- XLM: $0.42
- USDC/USDT: $1.00

##### 📋 **Policies** (`/dashboard/policies`)
- BTC: Max LTV 65%, Interest 5.5%
- ETH: Max LTV 60%, Interest 6.0%
- XLM: Max LTV 50%, Interest 7.0%
- SOL: Max LTV 55%, Interest 6.5%

##### 🏦 **Vaults** (`/dashboard/vaults`)
- 5 Fireblocks custody vaults
- Total value: ~$6.7M
- Assets: BTC, ETH, XLM, USDC, USDT

##### ⚠️ **Liquidations** (`/dashboard/liquidations`)
- 1 pending liquidation (pos_btc_002)
- 1 completed liquidation (pos_xlm_002)
- View liquidation details and proceeds

## Demo Data Details

### Active Positions Summary

| Position | Borrower | Collateral | Amount | Borrowed | LTV | Status |
|----------|----------|------------|--------|----------|-----|--------|
| pos_btc_001 | User 1 | BTC | 2.5 | $120,450 | 50.47% | Active ✅ |
| pos_eth_001 | User 2 | ETH | 50 | $90,320 | 56.25% | Active ✅ |
| pos_xlm_001 | User 3 | XLM | 500,000 | $90,180 | 42.86% | Active ✅ |
| pos_btc_002 | User 1 | BTC | 1.0 | $58,120 | 61.05% | At Risk ⚠️ |
| pos_eth_003 | User 5 | ETH | 30 | $50,095 | 52.08% | Active ✅ |

### Historical Positions

| Position | Borrower | Collateral | Status | Date |
|----------|----------|------------|--------|------|
| pos_eth_002 | User 2 | 20 ETH | Closed | 3 days ago |
| pos_btc_003 | User 3 | 1.5 BTC | Closed | 10 days ago |
| pos_xlm_002 | User 4 | 300k XLM | Liquidated | 8 days ago |

### KYC Users

- **User 1** (GBORROWER1...): Institutional, Verified 15 days ago
- **User 2** (GBORROWER2...): Institutional, Verified 10 days ago
- **User 3** (GBORROWER3...): Retail, Verified 7 days ago
- **User 4** (GBORROWER4...): Institutional, Pending verification
- **User 5** (GBORROWER5...): Retail, Verified 5 days ago

### Liquidation Events

#### Pending
- **pos_btc_002**: LTV 61.05%, needs to raise $10,000 USDC

#### Completed
- **pos_xlm_002**: Liquidated 8 days ago, proceeds $63,500 USDC

## Customizing Demo Data

To modify the demo data:

1. Edit `scripts/02-insert-demo-data.sql`
2. Change values (amounts, dates, addresses)
3. Rerun the script in Supabase SQL Editor

To clear and reload:

\`\`\`sql
TRUNCATE TABLE audit_logs, lp_deposits, liquidation_receipts, liquidation_intents, 
                positions, fireblocks_vaults, kyc_registry, policy_parameters, 
                price_feeds CASCADE;
\`\`\`

Then run the insert script again.

## Demo Walkthrough Script

Use this script when presenting the platform:

1. **Start at Overview**: "We have $408K in active loans backed by $1.3M in collateral"
2. **Show Positions**: "5 active positions with health factors from Safe to At Risk"
3. **Demonstrate Borrow**: "Let's create a new loan with 1 BTC as collateral"
4. **Check Prices**: "Real-time price feeds from Chainlink and Stellar DEX"
5. **Review Policies**: "Risk parameters set per asset with multi-band liquidations"
6. **Examine Vaults**: "Secure custody via Fireblocks with $6.7M in assets"
7. **Show Liquidations**: "Automated liquidation system protecting the protocol"
8. **View History**: "Complete audit trail of all transactions"

## Troubleshooting

**No data showing?**
- Check Supabase connection in environment variables
- Verify the SQL script ran without errors
- Check browser console for API errors

**Incorrect calculations?**
- Ensure price feeds are marked as `approved = true`
- Verify policy parameters exist for each asset
- Check that `ltv` and `accrued_interest` are properly set

**Missing sections?**
- Some pages may require admin permissions
- Ensure wallet is connected for borrower-specific views
- Check that all API routes are deployed

## Support

For issues or questions:
- Check the main [README.md](../README.md)
- Review [SETUP_GUIDE.md](../SETUP_GUIDE.md) for deployment steps
- Open an issue on GitHub
</markdown>
