-- Enable realtime for user_bank_accounts table only (transactions already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bank_accounts;