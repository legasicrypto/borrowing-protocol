import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { calculateLTV, calculateHealthFactor } from "@/lib/calculations";

interface Loan {
  id: string;
  collateralType: string;
  collateralAmount: number;
  borrowedEur: number;
  borrowCurrency: "USDC" | "EURC";
  ltvRatio: number;
  healthFactor: number;
  interestRate: number;
  createdAt: string;
  autoTopUpEnabled: boolean;
}

export const useRealtimeLoans = (
  userId: string | undefined,
  cryptoPrices: Record<string, { price_usd: number; price_eur: number }>,
  liquidationThreshold: number
) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      // Fetch initial loans (only active ones)
      const { data, error } = await supabase
        .from("loan_positions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false});

      if (!error && data) {
        const formattedLoans: Loan[] = data.map((loan) => {
          const borrowCurrency = (loan.borrowed_currency as "USDC" | "EURC") || "USDC";
          const currentPrice = borrowCurrency === "EURC"
            ? cryptoPrices[loan.collateral_type]?.price_eur || 0
            : cryptoPrices[loan.collateral_type]?.price_usd || 0;
          const collateralValue = Number(loan.collateral_amount) * currentPrice;
          const borrowedUsdc = Number(loan.borrowed_usdc);
          
          return {
            id: loan.id,
            collateralType: loan.collateral_type,
            collateralAmount: Number(loan.collateral_amount),
            borrowedEur: borrowedUsdc,
            borrowCurrency: (loan.borrowed_currency as "USDC" | "EURC") || "USDC",
            ltvRatio: calculateLTV(borrowedUsdc, collateralValue),
            healthFactor: calculateHealthFactor(collateralValue, borrowedUsdc, liquidationThreshold),
            interestRate: Number(loan.interest_rate),
            createdAt: loan.created_at,
            autoTopUpEnabled: loan.auto_top_up ?? false,
          };
        });
        setLoans(formattedLoans);
      }
      setLoading(false);

      // Subscribe to realtime updates
      channel = supabase
        .channel(`loans-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "loan_positions",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newLoan = payload.new;
            const borrowCurrency = (newLoan.borrowed_currency as "USDC" | "EURC") || "USDC";
            const currentPrice = borrowCurrency === "EURC"
              ? cryptoPrices[newLoan.collateral_type]?.price_eur || 0
              : cryptoPrices[newLoan.collateral_type]?.price_usd || 0;
            const collateralValue = Number(newLoan.collateral_amount) * currentPrice;
            const borrowedUsdc = Number(newLoan.borrowed_usdc);
            
            setLoans((prev) => [
              {
                id: newLoan.id,
                collateralType: newLoan.collateral_type,
                collateralAmount: Number(newLoan.collateral_amount),
                borrowedEur: borrowedUsdc,
                borrowCurrency: (newLoan.borrowed_currency as "USDC" | "EURC") || "USDC",
                ltvRatio: calculateLTV(borrowedUsdc, collateralValue),
                healthFactor: calculateHealthFactor(collateralValue, borrowedUsdc, liquidationThreshold),
                interestRate: Number(newLoan.interest_rate),
                createdAt: newLoan.created_at,
                autoTopUpEnabled: newLoan.auto_top_up ?? false,
              },
              ...prev,
            ]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "loan_positions",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedLoan = payload.new;
            // If loan is closed, remove it from the list
            if (updatedLoan.status === "closed") {
              setLoans((prev) => prev.filter((loan) => loan.id !== updatedLoan.id));
            } else {
              // Otherwise update it
              const borrowCurrency = (updatedLoan.borrowed_currency as "USDC" | "EURC") || "USDC";
              const currentPrice = borrowCurrency === "EURC"
                ? cryptoPrices[updatedLoan.collateral_type]?.price_eur || 0
                : cryptoPrices[updatedLoan.collateral_type]?.price_usd || 0;
              const collateralValue = Number(updatedLoan.collateral_amount) * currentPrice;
              const borrowedUsdc = Number(updatedLoan.borrowed_usdc);
              
              setLoans((prev) =>
                prev.map((loan) =>
                  loan.id === updatedLoan.id
                    ? {
                        id: updatedLoan.id,
                        collateralType: updatedLoan.collateral_type,
                        collateralAmount: Number(updatedLoan.collateral_amount),
                        borrowedEur: borrowedUsdc,
                        borrowCurrency: (updatedLoan.borrowed_currency as "USDC" | "EURC") || "USDC",
                        ltvRatio: calculateLTV(borrowedUsdc, collateralValue),
                        healthFactor: calculateHealthFactor(collateralValue, borrowedUsdc, liquidationThreshold),
                        interestRate: Number(updatedLoan.interest_rate),
                        createdAt: updatedLoan.created_at,
                        autoTopUpEnabled: updatedLoan.auto_top_up ?? false,
                      }
                    : loan
                )
              );
            }
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
  }, [userId, cryptoPrices, liquidationThreshold]);

  return { loans, loading };
};
