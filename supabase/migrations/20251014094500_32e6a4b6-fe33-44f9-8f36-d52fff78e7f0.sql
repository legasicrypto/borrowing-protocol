-- Supprimer l'ancienne config générique
DELETE FROM system_config WHERE config_key = 'max_ltv_ratio';

-- Ajouter les configs par asset
INSERT INTO system_config (config_key, config_value) VALUES
  ('max_ltv_sol', '50'),      -- SOL plus volatile → LTV plus bas
  ('max_ltv_usdc', '75')      -- USDC stable → LTV plus haut
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;