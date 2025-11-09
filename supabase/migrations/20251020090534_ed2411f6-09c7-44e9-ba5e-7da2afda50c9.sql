-- 1. Supprimer les dépendances d'abord
DELETE FROM liquidations;
DELETE FROM transactions;
DELETE FROM wire_transfers;
DELETE FROM notifications;

-- 2. Supprimer tous les loans (actifs et fermés)
DELETE FROM loan_positions;

-- 3. Réinitialiser tous les soldes bancaires
UPDATE user_bank_accounts 
SET eur_balance = 0, 
    usd_balance = 0,
    updated_at = NOW();