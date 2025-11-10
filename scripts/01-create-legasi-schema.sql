-- Legasi x Stellar Complete Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (KYC Registry)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stellar_address TEXT UNIQUE NOT NULL,
  email TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  kyc_provider TEXT, -- sep12, synaps, etc
  kyc_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fireblocks Vaults
CREATE TABLE vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vault_id TEXT UNIQUE NOT NULL, -- Fireblocks vault ID
  asset_type TEXT NOT NULL, -- BTC, USDC
  balance NUMERIC(20, 8) DEFAULT 0,
  locked_balance NUMERIC(20, 8) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, locked, liquidating
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Loan Positions
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  position_id TEXT UNIQUE NOT NULL, -- Soroban contract position ID
  collateral_asset TEXT NOT NULL, -- BTC, USDC
  collateral_amount NUMERIC(20, 8) NOT NULL,
  borrowed_asset TEXT NOT NULL, -- USDC, EURC
  borrowed_amount NUMERIC(20, 8) NOT NULL,
  interest_rate NUMERIC(8, 4) NOT NULL, -- Annual rate in %
  ltv_ratio NUMERIC(8, 4) NOT NULL, -- Current LTV in %
  liquidation_threshold NUMERIC(8, 4) NOT NULL, -- LTV threshold for liquidation
  status TEXT NOT NULL DEFAULT 'active', -- active, repaid, liquidated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Price Feeds (Self-contained oracle)
CREATE TABLE price_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_pair TEXT NOT NULL, -- BTC/USD, USDC/USD, EUR/USD
  price NUMERIC(20, 8) NOT NULL,
  source TEXT NOT NULL, -- bybit, coinbase, kraken, aggregated
  confidence NUMERIC(5, 4), -- 0.95 = 95% confidence
  published_at TIMESTAMPTZ NOT NULL,
  pushed_to_chain BOOLEAN DEFAULT FALSE,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_feeds_pair_time ON price_feeds(asset_pair, published_at DESC);

-- 5. Liquidation Intents
CREATE TABLE liquidation_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  intent_id TEXT UNIQUE NOT NULL, -- From Soroban contract
  collateral_to_sell NUMERIC(20, 8) NOT NULL,
  min_output NUMERIC(20, 8) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, executed, cancelled, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- 6. Liquidation Receipts
CREATE TABLE liquidation_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intent_id UUID REFERENCES liquidation_intents(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL, -- bybit, deribit
  amount_sold NUMERIC(20, 8) NOT NULL,
  amount_received NUMERIC(20, 8) NOT NULL,
  execution_price NUMERIC(20, 8) NOT NULL,
  slippage NUMERIC(8, 4),
  tx_hash TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LP Deposits (Liquidity Pool)
CREATE TABLE lp_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL, -- USDC, EURC
  amount NUMERIC(20, 8) NOT NULL,
  lp_tokens NUMERIC(20, 8) NOT NULL, -- LP shares minted
  apy NUMERIC(8, 4), -- Current APY
  status TEXT NOT NULL DEFAULT 'active', -- active, withdrawn
  deposited_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);

-- 8. Policy Parameters (From PolicyRegistry contract)
CREATE TABLE policy_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parameter_name TEXT UNIQUE NOT NULL,
  parameter_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default policy parameters
INSERT INTO policy_parameters (parameter_name, parameter_value, description) VALUES
  ('btc_ltv_threshold', '75', 'BTC LTV liquidation threshold (%)'),
  ('usdc_ltv_threshold', '90', 'USDC LTV liquidation threshold (%)'),
  ('base_interest_rate', '5.5', 'Base annual interest rate (%)'),
  ('liquidation_penalty', '5', 'Liquidation penalty (%)'),
  ('price_staleness_limit', '60', 'Max price age in seconds'),
  ('soft_liquidation_step', '10', 'Partial liquidation % per step');

-- 9. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- position, liquidation, price, user
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- created, updated, liquidated, etc
  user_id UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_time ON audit_logs(created_at DESC);

-- 10. System Metrics (Dashboard analytics)
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(20, 8) NOT NULL,
  metric_type TEXT NOT NULL, -- tvl, volume, count, ratio
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at DESC);

-- Row Level Security (RLS) Policies

-- Users: users can only read their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);

-- Vaults: users can only see their own vaults
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own vaults" ON vaults FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text)
);

-- Positions: users can only see their own positions
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own positions" ON positions FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text)
);

-- Price feeds: public read access
ALTER TABLE price_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public price feeds read" ON price_feeds FOR SELECT TO authenticated, anon USING (true);

-- LP deposits: users can only see their own deposits
ALTER TABLE lp_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deposits" ON lp_deposits FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE auth.uid()::text = id::text)
);

-- Policy parameters: public read
ALTER TABLE policy_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public policy read" ON policy_parameters FOR SELECT TO authenticated, anon USING (true);

-- System metrics: public read
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public metrics read" ON system_metrics FOR SELECT TO authenticated, anon USING (true);

-- Functions for automated updates

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaults_updated_at BEFORE UPDATE ON vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate TVL
CREATE OR REPLACE FUNCTION calculate_tvl()
RETURNS NUMERIC AS $$
DECLARE
  total_tvl NUMERIC;
BEGIN
  SELECT SUM(collateral_amount * (
    SELECT price FROM price_feeds 
    WHERE asset_pair = positions.collateral_asset || '/USD'
    ORDER BY published_at DESC 
    LIMIT 1
  ))
  INTO total_tvl
  FROM positions
  WHERE status = 'active';
  
  RETURN COALESCE(total_tvl, 0);
END;
$$ LANGUAGE plpgsql;

-- Schema complete! Ready for Legasi protocol deployment.
