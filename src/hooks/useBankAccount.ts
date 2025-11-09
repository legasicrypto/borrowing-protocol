import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BankAccount {
  iban_legasi: string;
  iban_personal: string | null;
  eur_balance: number;
  usdc_balance: number;
  eurc_balance: number;
  usd_fiat_balance: number;
}

export const useBankAccount = (userId: string | undefined) => {
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadBankAccount = async () => {
      const { data, error } = await supabase
        .from("user_bank_accounts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        setBankAccount({
          iban_legasi: data.iban_legasi,
          iban_personal: data.iban_personal,
          eur_balance: Number(data.eur_balance),
          usdc_balance: Number(data.usd_balance),
          eurc_balance: Number(data.eurc_balance || 0),
          usd_fiat_balance: Number(data.usd_fiat_balance || 0),
        });
      }
      setLoading(false);
    };

    loadBankAccount();
  }, [userId]);

  return { bankAccount, loading };
};
