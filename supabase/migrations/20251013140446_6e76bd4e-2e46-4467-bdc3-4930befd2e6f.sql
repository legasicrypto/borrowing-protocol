-- Enable realtime for loan_positions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_positions;

-- Enable realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;