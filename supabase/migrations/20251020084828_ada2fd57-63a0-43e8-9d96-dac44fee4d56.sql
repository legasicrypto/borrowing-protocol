-- Drop the existing check constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add the new constraint with swap and transfer types
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('borrow', 'repay', 'add_collateral', 'withdraw_collateral', 'liquidation', 'swap', 'transfer'));