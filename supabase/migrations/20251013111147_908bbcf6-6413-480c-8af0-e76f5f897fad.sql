-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  wallet_address TEXT UNIQUE,
  wallet_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create KYC submissions table
CREATE TABLE public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  id_document_url TEXT,
  proof_address_url TEXT,
  selfie_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create loan positions table
CREATE TABLE public.loan_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collateral_type TEXT NOT NULL CHECK (collateral_type IN ('SOL', 'BTC', 'ETH', 'USDC')),
  collateral_amount DECIMAL(20, 8) NOT NULL,
  borrowed_usdc DECIMAL(20, 2) NOT NULL,
  ltv_ratio DECIMAL(5, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) DEFAULT 5.2,
  health_factor DECIMAL(10, 2),
  liquidation_price DECIMAL(20, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'liquidated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES public.loan_positions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('borrow', 'repay', 'add_collateral', 'withdraw_collateral', 'liquidation')),
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crypto prices table (for historical tracking)
CREATE TABLE public.crypto_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price_usd DECIMAL(20, 2) NOT NULL,
  change_24h DECIMAL(10, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create liquidations table
CREATE TABLE public.liquidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loan_positions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collateral_liquidated DECIMAL(20, 8) NOT NULL,
  debt_repaid DECIMAL(20, 2) NOT NULL,
  liquidation_price DECIMAL(20, 2) NOT NULL,
  liquidated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- KYC submissions policies
CREATE POLICY "Users can view their own KYC"
  ON public.kyc_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KYC"
  ON public.kyc_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC submissions"
  ON public.kyc_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update KYC submissions"
  ON public.kyc_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Loan positions policies
CREATE POLICY "Users can view their own loans"
  ON public.loan_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans"
  ON public.loan_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
  ON public.loan_positions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loans"
  ON public.loan_positions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all loans"
  ON public.loan_positions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Crypto prices policies (public read)
CREATE POLICY "Anyone can view crypto prices"
  ON public.crypto_prices FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage crypto prices"
  ON public.crypto_prices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Liquidations policies
CREATE POLICY "Users can view their own liquidations"
  ON public.liquidations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all liquidations"
  ON public.liquidations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create liquidations"
  ON public.liquidations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_positions_updated_at
  BEFORE UPDATE ON public.loan_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT DO NOTHING;

-- Storage policies for KYC documents
CREATE POLICY "Users can upload their own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents' AND
    public.has_role(auth.uid(), 'admin')
  );