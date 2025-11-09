import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface BankAccount {
  iban_legasi: string;
  iban_personal: string | null;
  eur_balance: number;
  usdc_balance: number;
  eurc_balance: number;
  usd_fiat_balance: number;
}

export const useRealtimeBankAccount = (userId: string | undefined) => {
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fonction de fetch réutilisable
  const fetchBankAccount = async () => {
    if (!userId) return;
    
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

  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      // ✅ Fetch initial avec la fonction réutilisable
      await fetchBankAccount();

      // Subscribe to realtime updates
      channel = supabase
        .channel(`bank-account-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_bank_accounts",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updated = payload.new;
            setBankAccount({
              iban_legasi: updated.iban_legasi,
              iban_personal: updated.iban_personal,
              eur_balance: Number(updated.eur_balance),
              usdc_balance: Number(updated.usd_balance),
              eurc_balance: Number(updated.eurc_balance || 0),
              usd_fiat_balance: Number(updated.usd_fiat_balance || 0),
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_bank_accounts",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newAccount = payload.new;
            setBankAccount({
              iban_legasi: newAccount.iban_legasi,
              iban_personal: newAccount.iban_personal,
              eur_balance: Number(newAccount.eur_balance),
              usdc_balance: Number(newAccount.usd_balance),
              eurc_balance: Number(newAccount.eurc_balance || 0),
              usd_fiat_balance: Number(newAccount.usd_fiat_balance || 0),
            });
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  // ✅ Exposer la fonction de refresh
  return { bankAccount, loading, refreshBankAccount: fetchBankAccount };
};
