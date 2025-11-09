-- Ensure REPLICA IDENTITY FULL for realtime functionality
ALTER TABLE user_bank_accounts REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE wire_transfers REPLICA IDENTITY FULL;

-- Add transactions to realtime publication (user_bank_accounts already exists)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, ignore
END $$;

-- Add wire_transfers to realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wire_transfers;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, ignore
END $$;