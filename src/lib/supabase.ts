import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Helper types for database tables
export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  wallet_address: string | null;
  wallet_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type KycSubmission = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  id_document_url: string | null;
  proof_address_url: string | null;
  selfie_url: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type LoanPosition = {
  id: string;
  user_id: string;
  collateral_type: "SOL" | "USDC";
  collateral_amount: number;
  borrowed_usdc: number;
  ltv_ratio: number;
  interest_rate: number;
  health_factor: number | null;
  liquidation_price: number | null;
  status: "active" | "closed" | "liquidated";
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  loan_id: string | null;
  type: "borrow" | "repay" | "add_collateral" | "withdraw_collateral" | "liquidation" | "swap";
  amount: number;
  currency: string;
  tx_hash: string | null;
  status: "pending" | "success" | "failed";
  created_at: string;
};
