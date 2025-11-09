-- Add "swap" as a valid transaction type
-- The transactions table uses a TEXT column for type, so no need to modify enum
-- This migration is mainly for documentation purposes

-- Add a comment to document the swap transaction type
COMMENT ON COLUMN public.transactions.type IS 'Transaction type: borrow, repay, add_collateral, withdraw_collateral, liquidation, swap';