-- Add borrowed_currency column to loan_positions
ALTER TABLE loan_positions 
ADD COLUMN borrowed_currency TEXT NOT NULL DEFAULT 'USDC';

-- Add eurc_balance column to user_bank_accounts
ALTER TABLE user_bank_accounts 
ADD COLUMN eurc_balance NUMERIC NOT NULL DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN user_bank_accounts.usd_balance IS 'USDC balance (stablecoin)';
COMMENT ON COLUMN user_bank_accounts.eurc_balance IS 'EURC balance (stablecoin)';
COMMENT ON COLUMN user_bank_accounts.eur_balance IS 'EUR balance (fiat)';