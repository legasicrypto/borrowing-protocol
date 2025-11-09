-- Reset all data for testing purposes

-- 1. Delete dependencies first (to avoid foreign key issues)
DELETE FROM liquidations;
DELETE FROM transactions;
DELETE FROM wire_transfers;
DELETE FROM notifications;

-- 2. Delete all loan positions
DELETE FROM loan_positions;

-- 3. Reset all bank account balances to zero
UPDATE user_bank_accounts 
SET eur_balance = 0, 
    usd_balance = 0,
    updated_at = NOW();