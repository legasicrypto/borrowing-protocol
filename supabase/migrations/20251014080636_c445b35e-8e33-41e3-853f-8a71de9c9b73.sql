-- Function to handle new Web3 users (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_web3_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create profile if it doesn't exist and user has wallet metadata
  IF NEW.raw_user_meta_data->>'wallet_address' IS NOT NULL THEN
    INSERT INTO public.profiles (
      id, 
      wallet_address, 
      wallet_verified
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'wallet_address',
      (NEW.raw_user_meta_data->>'wallet_verified')::boolean
    )
    ON CONFLICT (id) DO UPDATE SET
      wallet_address = EXCLUDED.wallet_address,
      wallet_verified = EXCLUDED.wallet_verified;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger when a new user signs up (including Web3)
DROP TRIGGER IF EXISTS on_auth_user_created_web3 ON auth.users;
CREATE TRIGGER on_auth_user_created_web3
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_web3_user();