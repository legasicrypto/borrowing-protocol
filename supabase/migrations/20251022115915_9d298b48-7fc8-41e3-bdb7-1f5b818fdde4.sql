-- Add usd_fiat_balance column to separate USD fiat from USDC stablecoin
ALTER TABLE user_bank_accounts 
ADD COLUMN usd_fiat_balance NUMERIC NOT NULL DEFAULT 0;

-- Add comments to clarify the difference between balances
COMMENT ON COLUMN user_bank_accounts.usd_balance IS 'USDC balance (stablecoin borrowed)';
COMMENT ON COLUMN user_bank_accounts.usd_fiat_balance IS 'USD balance (fiat currency after swap)';
COMMENT ON COLUMN user_bank_accounts.eurc_balance IS 'EURC balance (stablecoin borrowed)';
COMMENT ON COLUMN user_bank_accounts.eur_balance IS 'EUR balance (fiat currency after swap)';