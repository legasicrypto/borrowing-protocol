-- Initialize interest_rate in system_config if not exists
INSERT INTO system_config (config_key, config_value, updated_at)
VALUES ('interest_rate', '5.2', NOW())
ON CONFLICT (config_key) DO NOTHING;