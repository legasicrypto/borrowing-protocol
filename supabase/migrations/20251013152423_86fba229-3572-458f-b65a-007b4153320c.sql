-- Phase 1: Création des nouvelles tables et modifications

-- 1. Créer table user_bank_accounts (IBAN Legasi + Personnel + Balances)
CREATE TABLE IF NOT EXISTS public.user_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iban_legasi TEXT UNIQUE NOT NULL,
  iban_personal TEXT,
  eur_balance NUMERIC NOT NULL DEFAULT 0,
  usd_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Créer table system_config (paramètres admin)
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer table wire_transfers (historique virements EUR)
CREATE TABLE IF NOT EXISTS public.wire_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_iban TEXT NOT NULL,
  to_iban TEXT NOT NULL,
  amount_eur NUMERIC NOT NULL,
  fees_eur NUMERIC NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Modifier loan_positions: renommer borrowed_usdc en borrowed_eur
ALTER TABLE public.loan_positions 
  RENAME COLUMN borrowed_usdc TO borrowed_eur;

-- 5. Modifier loan_positions: contrainte sur collateral_type (SOL ou USDC uniquement)
ALTER TABLE public.loan_positions 
  DROP CONSTRAINT IF EXISTS loan_positions_collateral_type_check;

ALTER TABLE public.loan_positions 
  ADD CONSTRAINT loan_positions_collateral_type_check 
  CHECK (collateral_type IN ('SOL', 'USDC'));

-- 6. Ajouter kyc_status dans profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected'));

-- 7. Ajouter iban_generated dans kyc_submissions
ALTER TABLE public.kyc_submissions 
  ADD COLUMN IF NOT EXISTS iban_generated BOOLEAN DEFAULT FALSE;

-- 8. Fonction de génération IBAN (format Banking Circle)
CREATE OR REPLACE FUNCTION public.generate_iban()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  random_suffix TEXT;
  new_iban TEXT;
BEGIN
  -- Générer un suffixe aléatoire de 16 chiffres
  random_suffix := LPAD(FLOOR(RANDOM() * 10000000000000000)::TEXT, 16, '0');
  
  -- Format IBAN Banking Circle: DE89 3704 0044 + 16 chiffres
  new_iban := 'DE89370400440' || random_suffix;
  
  RETURN new_iban;
END;
$$;

-- 9. Trigger après validation KYC: génère IBAN automatiquement
CREATE OR REPLACE FUNCTION public.handle_kyc_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_iban TEXT;
BEGIN
  -- Si le statut passe à 'approved' et IBAN pas encore généré
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NOT NEW.iban_generated THEN
    -- Générer l'IBAN
    generated_iban := generate_iban();
    
    -- Insérer dans user_bank_accounts
    INSERT INTO public.user_bank_accounts (user_id, iban_legasi, eur_balance, usd_balance)
    VALUES (NEW.user_id, generated_iban, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Mettre à jour le profil
    UPDATE public.profiles 
    SET kyc_status = 'approved' 
    WHERE id = NEW.user_id;
    
    -- Marquer l'IBAN comme généré
    NEW.iban_generated := TRUE;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_kyc_approval ON public.kyc_submissions;
CREATE TRIGGER on_kyc_approval
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_kyc_approval();

-- 10. Fonction pour vérifier KYC avant création de prêt
CREATE OR REPLACE FUNCTION public.check_kyc_before_loan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_kyc_status TEXT;
BEGIN
  -- Récupérer le statut KYC de l'utilisateur
  SELECT kyc_status INTO user_kyc_status
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Bloquer si KYC non approuvé
  IF user_kyc_status IS NULL OR user_kyc_status != 'approved' THEN
    RAISE EXCEPTION 'KYC must be approved before creating a loan';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_kyc_before_loan ON public.loan_positions;
CREATE TRIGGER enforce_kyc_before_loan
  BEFORE INSERT ON public.loan_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_kyc_before_loan();

-- 11. Initialiser system_config avec max_ltv_ratio
INSERT INTO public.system_config (config_key, config_value)
VALUES ('max_ltv_ratio', '75')
ON CONFLICT (config_key) DO NOTHING;

-- 12. Trigger pour update updated_at sur user_bank_accounts
DROP TRIGGER IF EXISTS update_user_bank_accounts_updated_at ON public.user_bank_accounts;
CREATE TRIGGER update_user_bank_accounts_updated_at
  BEFORE UPDATE ON public.user_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Enable RLS sur les nouvelles tables
ALTER TABLE public.user_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wire_transfers ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies pour user_bank_accounts
CREATE POLICY "Users can view their own bank account"
  ON public.user_bank_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank account"
  ON public.user_bank_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert bank accounts"
  ON public.user_bank_accounts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all bank accounts"
  ON public.user_bank_accounts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 15. RLS Policies pour system_config
CREATE POLICY "Everyone can view system config"
  ON public.system_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update system config"
  ON public.system_config
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert system config"
  ON public.system_config
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 16. RLS Policies pour wire_transfers
CREATE POLICY "Users can view their own transfers"
  ON public.wire_transfers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transfers"
  ON public.wire_transfers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update transfers"
  ON public.wire_transfers
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view all transfers"
  ON public.wire_transfers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));