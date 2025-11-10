-- Legasi x Stellar Database Schema
-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS liquidation_intents CASCADE;
DROP TABLE IF EXISTS liquidation_receipts CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS price_feeds CASCADE;
DROP TABLE IF EXISTS kyc_registry CASCADE;
DROP TABLE IF EXISTS fireblocks_vaults CASCADE;
DROP TABLE IF EXISTS policy_parameters CASCADE;
DROP TABLE IF EXISTS lp_deposits CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Price Feeds Table
CREATE TABLE price_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset VARCHAR(10) NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  source VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE,
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  oracle_round_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_feeds_asset ON price_feeds(asset);
CREATE INDEX idx_price_feeds_timestamp ON price_feeds(timestamp DESC);
CREATE INDEX idx_price_feeds_approved ON price_feeds(approved);

-- KYC Registry
CREATE TABLE kyc_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stellar_address VARCHAR(56) NOT NULL UNIQUE,
  kyc_status VARCHAR(20) NOT NULL CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
  kyc_provider VARCHAR(100),
  kyc_hash VARCHAR(255),
  verified_at TIMESTAMPTZ,
  user_type VARCHAR(20) CHECK (user_type IN ('borrower', 'lp', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kyc_stellar_address ON kyc_registry(stellar_address);
CREATE INDEX idx_kyc_status ON kyc_registry(kyc_status);

-- Fireblocks Vaults
CREATE TABLE fireblocks_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id VARCHAR(100) NOT NULL UNIQUE,
  stellar_address VARCHAR(56) NOT NULL,
  asset_type VARCHAR(10) NOT NULL CHECK (asset_type IN ('BTC', 'USDC', 'EURC')),
  balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vaults_stellar_address ON fireblocks_vaults(stellar_address);
CREATE INDEX idx_vaults_vault_id ON fireblocks_vaults(vault_id);

-- Positions (Loans)
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id VARCHAR(100) NOT NULL UNIQUE,
  borrower_address VARCHAR(56) NOT NULL,
  vault_id VARCHAR(100) NOT NULL REFERENCES fireblocks_vaults(vault_id),
  collateral_asset VARCHAR(10) NOT NULL,
  collateral_amount DECIMAL(18, 8) NOT NULL,
  borrowed_asset VARCHAR(10) NOT NULL,
  principal DECIMAL(18, 8) NOT NULL DEFAULT 0,
  accrued_interest DECIMAL(18, 8) NOT NULL DEFAULT 0,
  ltv DECIMAL(5, 2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_liquidation', 'closable', 'closed')),
  last_interest_accrual TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_positions_borrower ON positions(borrower_address);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_ltv ON positions(ltv);

-- Liquidation Intents
CREATE TABLE liquidation_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_nonce VARCHAR(100) NOT NULL UNIQUE,
  position_id VARCHAR(100) NOT NULL REFERENCES positions(position_id),
  notional_to_raise DECIMAL(18, 8) NOT NULL,
  min_out DECIMAL(18, 8) NOT NULL,
  slippage_max DECIMAL(5, 2) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  policy_hash VARCHAR(255),
  oracle_round_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_liquidation_intents_position ON liquidation_intents(position_id);
CREATE INDEX idx_liquidation_intents_status ON liquidation_intents(status);

-- Liquidation Receipts
CREATE TABLE liquidation_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_nonce VARCHAR(100) NOT NULL REFERENCES liquidation_intents(intent_nonce),
  position_id VARCHAR(100) NOT NULL,
  actual_proceeds DECIMAL(18, 8) NOT NULL,
  average_price DECIMAL(18, 8) NOT NULL,
  fees DECIMAL(18, 8) NOT NULL,
  venue_id VARCHAR(100) NOT NULL,
  executor_signature TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_liquidation_receipts_intent ON liquidation_receipts(intent_nonce);
CREATE INDEX idx_liquidation_receipts_position ON liquidation_receipts(position_id);

-- Policy Parameters
CREATE TABLE policy_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset VARCHAR(10) NOT NULL,
  max_ltv_on_draw DECIMAL(5, 2) NOT NULL,
  liquidation_band_1 DECIMAL(5, 2) NOT NULL,
  liquidation_band_2 DECIMAL(5, 2) NOT NULL,
  liquidation_band_3 DECIMAL(5, 2) NOT NULL,
  slice_percentage DECIMAL(5, 2) NOT NULL,
  cooldown_seconds INTEGER NOT NULL,
  max_slippage DECIMAL(5, 2) NOT NULL,
  base_interest_rate DECIMAL(5, 4) NOT NULL,
  spread DECIMAL(5, 4) NOT NULL,
  policy_version INTEGER NOT NULL DEFAULT 1,
  policy_hash VARCHAR(255),
  circuit_breaker BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_asset ON policy_parameters(asset);
CREATE INDEX idx_policy_version ON policy_parameters(policy_version);

-- LP Deposits
CREATE TABLE lp_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lp_address VARCHAR(56) NOT NULL,
  asset VARCHAR(10) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  lp_shares DECIMAL(18, 8) NOT NULL,
  deposited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lp_deposits_address ON lp_deposits(lp_address);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  user_address VARCHAR(56),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Insert default policy parameters
INSERT INTO policy_parameters (
  asset, max_ltv_on_draw, liquidation_band_1, liquidation_band_2, 
  liquidation_band_3, slice_percentage, cooldown_seconds, 
  max_slippage, base_interest_rate, spread, policy_hash
) VALUES 
  ('BTC', 65.00, 70.00, 80.00, 90.00, 25.00, 3600, 2.00, 0.0500, 0.0200, 'policy_v1_btc'),
  ('USDC', 85.00, 90.00, 95.00, 98.00, 20.00, 1800, 1.00, 0.0300, 0.0100, 'policy_v1_usdc');

-- Enable Row Level Security (optional for future)
ALTER TABLE price_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
