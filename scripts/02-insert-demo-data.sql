-- Demo Data for Legasi Platform - Comprehensive Showcase
-- Run this script in Supabase SQL Editor to populate all sections with realistic data

-- Clear existing demo data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE audit_logs, lp_deposits, liquidation_receipts, liquidation_intents, positions, fireblocks_vaults, kyc_registry, policy_parameters, price_feeds CASCADE;

-- =====================
-- 1. PRICE FEEDS
-- =====================
INSERT INTO price_feeds (asset, price, oracle_round_id, source, timestamp, approved, approved_by, approved_at, created_at) VALUES
  -- Updated all prices to current market values
  ('BTC', 95000.00, 'round_1001', 'chainlink', NOW() - INTERVAL '5 minutes', true, 'GADMIN123STELLAR', NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '5 minutes'),
  ('ETH', 3200.00, 'round_1002', 'chainlink', NOW() - INTERVAL '5 minutes', true, 'GADMIN123STELLAR', NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '5 minutes'),
  ('XLM', 0.42, 'round_1003', 'stellar_dex', NOW() - INTERVAL '5 minutes', true, 'GADMIN123STELLAR', NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '5 minutes'),
  ('USDC', 1.00, 'round_1004', 'fixed', NOW() - INTERVAL '5 minutes', true, 'GADMIN123STELLAR', NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '5 minutes'),
  ('USDT', 1.00, 'round_1005', 'fixed', NOW() - INTERVAL '5 minutes', true, 'GADMIN123STELLAR', NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '5 minutes'),
  -- Historical prices for charts
  ('BTC', 93500.00, 'round_1000', 'chainlink', NOW() - INTERVAL '1 day', true, 'GADMIN123STELLAR', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('ETH', 3150.00, 'round_1001', 'chainlink', NOW() - INTERVAL '1 day', true, 'GADMIN123STELLAR', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('XLM', 0.41, 'round_1002', 'stellar_dex', NOW() - INTERVAL '1 day', true, 'GADMIN123STELLAR', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- =====================
-- 2. POLICY PARAMETERS
-- =====================
INSERT INTO policy_parameters (
  asset, policy_hash, policy_version, max_ltv_on_draw, base_interest_rate, spread,
  liquidation_band_1, liquidation_band_2, liquidation_band_3, slice_percentage,
  max_slippage, cooldown_seconds, circuit_breaker, created_at, updated_at
) VALUES
  ('BTC', 'policy_btc_v1', 1, 65.00, 5.50, 2.00, 70.00, 75.00, 80.00, 10.00, 5.00, 3600, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
  ('ETH', 'policy_eth_v1', 1, 60.00, 6.00, 2.50, 65.00, 70.00, 75.00, 10.00, 5.00, 3600, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
  ('XLM', 'policy_xlm_v1', 1, 50.00, 7.00, 3.00, 55.00, 60.00, 65.00, 10.00, 5.00, 3600, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
  ('SOL', 'policy_sol_v1', 1, 55.00, 6.50, 2.75, 60.00, 65.00, 70.00, 10.00, 5.00, 3600, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day');

-- =====================
-- 3. KYC REGISTRY
-- =====================
INSERT INTO kyc_registry (stellar_address, kyc_status, kyc_provider, kyc_hash, user_type, verified_at, created_at, updated_at) VALUES
  ('GBORROWER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'verified', 'sumsub', 'kyc_hash_001', 'institutional', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
  ('GBORROWER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'verified', 'sumsub', 'kyc_hash_002', 'institutional', NOW() - INTERVAL '10 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days'),
  ('GBORROWER3CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'verified', 'onfido', 'kyc_hash_003', 'retail', NOW() - INTERVAL '7 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
  ('GBORROWER4DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'pending', 'sumsub', 'kyc_hash_004', 'institutional', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  ('GBORROWER5EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 'verified', 'onfido', 'kyc_hash_005', 'retail', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days');

-- =====================
-- 4. FIREBLOCKS VAULTS
-- =====================
INSERT INTO fireblocks_vaults (vault_id, stellar_address, asset_type, balance, status, last_synced_at, created_at, updated_at) VALUES
  ('vault_btc_001', 'GVAULTBTC1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'BTC', 12.5000, 'active', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 minutes'),
  ('vault_eth_001', 'GVAULTETH1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'ETH', 450.2500, 'active', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 minutes'),
  ('vault_xlm_001', 'GVAULTXLM1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'XLM', 2500000.0000, 'active', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 minutes'),
  ('vault_usdc_001', 'GVAULTUSDC1DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'USDC', 5000000.0000, 'active', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 minutes'),
  ('vault_usdt_001', 'GVAULTUSDT1EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 'USDT', 2000000.0000, 'active', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 minutes');

-- =====================
-- 5. POSITIONS (Active & Historical)
-- =====================
INSERT INTO positions (
  position_id, borrower_address, vault_id, collateral_asset, borrowed_asset,
  collateral_amount, principal, accrued_interest, ltv, status,
  opened_at, last_interest_accrual, created_at, updated_at
) VALUES
  -- Active BTC loan #1
  ('pos_btc_001', 'GBORROWER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'vault_btc_001', 'BTC', 'USDC',
   2.5000, 120000.00, 450.00, 50.47, 'active',
   NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 hour'),
  
  -- Active ETH loan #1
  ('pos_eth_001', 'GBORROWER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'vault_eth_001', 'ETH', 'USDC',
   50.0000, 90000.00, 320.00, 56.25, 'active',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 hours'),
  
  -- Active XLM loan #1
  ('pos_xlm_001', 'GBORROWER3CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'vault_xlm_001', 'XLM', 'USDC',
   500000.0000, 90000.00, 180.00, 42.86, 'active',
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '7 days', NOW() - INTERVAL '30 minutes'),
  
  -- Active BTC loan #2 (higher LTV - at risk)
  ('pos_btc_002', 'GBORROWER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'vault_btc_001', 'BTC', 'USDC',
   1.0000, 58000.00, 120.00, 61.05, 'active',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 hour'),
  
  -- Active ETH loan #2
  ('pos_eth_003', 'GBORROWER5EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 'vault_eth_001', 'ETH', 'USDC',
   30.0000, 50000.00, 95.00, 52.08, 'active',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '3 days', NOW() - INTERVAL '45 minutes'),
  
  -- Closed/Repaid loan #1
  ('pos_eth_002', 'GBORROWER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'vault_eth_001', 'ETH', 'USDC',
   20.0000, 0.00, 0.00, 0.00, 'closed',
   NOW() - INTERVAL '30 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '3 days'),
  
  -- Closed/Repaid loan #2
  ('pos_btc_003', 'GBORROWER3CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'vault_btc_001', 'BTC', 'USDC',
   1.5000, 0.00, 0.00, 0.00, 'closed',
   NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days'),
  
  -- Liquidated loan
  ('pos_xlm_002', 'GBORROWER4DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'vault_xlm_001', 'XLM', 'USDC',
   300000.0000, 0.00, 0.00, 0.00, 'liquidated',
   NOW() - INTERVAL '20 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '8 days');

-- Update closed_at for closed/liquidated positions
UPDATE positions SET closed_at = NOW() - INTERVAL '3 days' WHERE position_id = 'pos_eth_002';
UPDATE positions SET closed_at = NOW() - INTERVAL '10 days' WHERE position_id = 'pos_btc_003';
UPDATE positions SET closed_at = NOW() - INTERVAL '8 days' WHERE position_id = 'pos_xlm_002';

-- =====================
-- 6. LIQUIDATION INTENTS
-- =====================
INSERT INTO liquidation_intents (
  position_id, intent_nonce, policy_hash, oracle_round_id, notional_to_raise,
  min_out, slippage_max, deadline, status, created_at, updated_at
) VALUES
  -- Pending liquidation for pos_btc_002
  ('pos_btc_002', 'intent_001', 'policy_btc_v1', 'round_1001', 10000.00, 9500.00, 5.00,
   NOW() + INTERVAL '2 hours', 'pending', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
  
  -- Completed liquidation for pos_xlm_002
  ('pos_xlm_002', 'intent_002', 'policy_xlm_v1', 'round_1003', 65000.00, 61750.00, 5.00,
   NOW() - INTERVAL '8 days' + INTERVAL '1 hour', 'executed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');

-- =====================
-- 7. LIQUIDATION RECEIPTS
-- =====================
INSERT INTO liquidation_receipts (
  position_id, intent_nonce, venue_id, actual_proceeds, average_price, fees, executed_at, executor_signature, created_at
) VALUES
  ('pos_xlm_002', 'intent_002', 'stellar_dex', 63500.00, 0.4233, 125.00, NOW() - INTERVAL '8 days',
   'sig_executor_001', NOW() - INTERVAL '8 days');

-- =====================
-- 8. LP DEPOSITS
-- =====================
INSERT INTO lp_deposits (lp_address, asset, amount, lp_shares, deposited_at, created_at) VALUES
  ('GLP1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'USDC', 1000000.00, 1000000.00, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
  ('GLP2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'USDC', 500000.00, 500000.00, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
  ('GLP3CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'USDT', 750000.00, 750000.00, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('GLP4DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'USDC', 300000.00, 300000.00, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('GLP5EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 'USDT', 200000.00, 200000.00, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');

-- =====================
-- 9. AUDIT LOGS
-- =====================
INSERT INTO audit_logs (user_address, event_type, entity_type, entity_id, details, created_at) VALUES
  -- Loan opens
  ('GBORROWER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'position_opened', 'position', 'pos_btc_001', '{"collateral": "2.5 BTC", "borrowed": "120000 USDC", "ltv": "50.47%"}', NOW() - INTERVAL '15 days'),
  ('GBORROWER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'position_opened', 'position', 'pos_eth_001', '{"collateral": "50 ETH", "borrowed": "90000 USDC", "ltv": "56.25%"}', NOW() - INTERVAL '10 days'),
  ('GBORROWER3CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'position_opened', 'position', 'pos_xlm_001', '{"collateral": "500000 XLM", "borrowed": "90000 USDC", "ltv": "42.86%"}', NOW() - INTERVAL '7 days'),
  ('GBORROWER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'position_opened', 'position', 'pos_btc_002', '{"collateral": "1 BTC", "borrowed": "58000 USDC", "ltv": "61.05%"}', NOW() - INTERVAL '5 days'),
  ('GBORROWER5EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 'position_opened', 'position', 'pos_eth_003', '{"collateral": "30 ETH", "borrowed": "50000 USDC", "ltv": "52.08%"}', NOW() - INTERVAL '3 days'),
  
  -- Loan closes
  ('GBORROWER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'position_closed', 'position', 'pos_eth_002', '{"repaid": "38500 USDC", "interest": "480 USDC", "total": "38980 USDC"}', NOW() - INTERVAL '3 days'),
  ('GBORROWER3CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'position_closed', 'position', 'pos_btc_003', '{"repaid": "68000 USDC", "interest": "1250 USDC", "total": "69250 USDC"}', NOW() - INTERVAL '10 days'),
  
  -- Price updates
  ('GADMIN123STELLAR', 'price_approved', 'price_feed', 'round_1001', '{"asset": "BTC", "price": 95000, "source": "chainlink"}', NOW() - INTERVAL '4 minutes'),
  ('GADMIN123STELLAR', 'price_approved', 'price_feed', 'round_1002', '{"asset": "ETH", "price": 3200, "source": "chainlink"}', NOW() - INTERVAL '4 minutes'),
  ('GADMIN123STELLAR', 'price_approved', 'price_feed', 'round_1003', '{"asset": "XLM", "price": 0.42, "source": "stellar_dex"}', NOW() - INTERVAL '4 minutes'),
  
  -- Policy updates
  ('GADMIN123STELLAR', 'policy_updated', 'policy', 'policy_btc_v1', '{"asset": "BTC", "max_ltv": 65, "interest_rate": 5.5}', NOW() - INTERVAL '1 day'),
  
  -- Liquidations
  ('GSYSTEM_LIQUIDATOR', 'liquidation_initiated', 'position', 'pos_xlm_002', '{"reason": "LTV exceeded 65%", "collateral_value": "126000 USDC"}', NOW() - INTERVAL '8 days'),
  ('GSYSTEM_LIQUIDATOR', 'liquidation_completed', 'position', 'pos_xlm_002', '{"proceeds": "63500 USDC", "fees": "125 USDC"}', NOW() - INTERVAL '8 days'),
  
  -- KYC verifications
  ('GADMIN123STELLAR', 'kyc_verified', 'user', 'GBORROWER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', '{"provider": "sumsub", "type": "institutional"}', NOW() - INTERVAL '15 days'),
  ('GADMIN123STELLAR', 'kyc_verified', 'user', 'GBORROWER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', '{"provider": "sumsub", "type": "institutional"}', NOW() - INTERVAL '10 days');

-- =====================
-- SUMMARY
-- =====================
-- This demo data includes:
-- - 8 Price Feeds (5 current + 3 historical)
-- - 4 Policy Parameters (BTC, ETH, XLM, SOL)
-- - 5 KYC Users (4 verified, 1 pending)
-- - 5 Fireblocks Vaults (BTC, ETH, XLM, USDC, USDT)
-- - 8 Positions (5 active, 2 closed, 1 liquidated)
-- - 2 Liquidation Intents (1 pending, 1 executed)
-- - 1 Liquidation Receipt
-- - 5 LP Deposits ($2.75M total liquidity)
-- - 15 Audit Log entries

-- To view the data:
SELECT 'Active Loans' as section, COUNT(*) as count FROM positions WHERE status = 'active'
UNION ALL
SELECT 'Total Collateral Value', SUM(collateral_amount * (SELECT price FROM price_feeds WHERE asset = collateral_asset AND approved = true ORDER BY created_at DESC LIMIT 1))::integer FROM positions WHERE status = 'active'
UNION ALL
SELECT 'Total Borrowed', SUM(principal + accrued_interest)::integer FROM positions WHERE status = 'active'
UNION ALL
SELECT 'LP Liquidity', SUM(amount)::integer FROM lp_deposits
UNION ALL
SELECT 'Pending Liquidations', COUNT(*) FROM liquidation_intents WHERE status = 'pending';
