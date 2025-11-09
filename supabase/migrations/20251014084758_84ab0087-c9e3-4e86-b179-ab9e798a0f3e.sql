-- Ajouter liquidation_threshold dans system_config
INSERT INTO system_config (config_key, config_value)
VALUES ('liquidation_threshold', '0.80')
ON CONFLICT (config_key) DO NOTHING;

-- Recalculer les health factors pour les prêts actifs existants avec des valeurs NULL ou 0
-- Utiliser les prix actuels des cryptos

-- Pour SOL (prix actuel: ~196 EUR)
UPDATE loan_positions
SET health_factor = (collateral_amount * 196.23 * 0.80) / borrowed_eur
WHERE status = 'active' 
  AND collateral_type = 'SOL'
  AND (health_factor IS NULL OR health_factor = 0)
  AND borrowed_eur > 0;

-- Pour USDC (prix: 1 EUR)
UPDATE loan_positions
SET health_factor = (collateral_amount * 1.00 * 0.80) / borrowed_eur
WHERE status = 'active' 
  AND collateral_type = 'USDC'
  AND (health_factor IS NULL OR health_factor = 0)
  AND borrowed_eur > 0;

-- Pour BTC (prix actuel: ~112138 EUR)
UPDATE loan_positions
SET health_factor = (collateral_amount * 112138.00 * 0.80) / borrowed_eur
WHERE status = 'active' 
  AND collateral_type = 'BTC'
  AND (health_factor IS NULL OR health_factor = 0)
  AND borrowed_eur > 0;

-- Pour ETH (prix actuel: ~4008 EUR)
UPDATE loan_positions
SET health_factor = (collateral_amount * 4008.06 * 0.80) / borrowed_eur
WHERE status = 'active' 
  AND collateral_type = 'ETH'
  AND (health_factor IS NULL OR health_factor = 0)
  AND borrowed_eur > 0;