import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface AdminStats {
  totalUsers: number;
  activeLoans: number;
  pendingKYC: number;
  totalVolume: number;
  totalSolCollateral: number;
  totalUsdcCollateral: number;
  collateralValueUsd: number;
  totalBorrowedUsdc: number;
  averageLtv: number;
  loansAtRisk: number;
}

export const useRealtimeAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeLoans: 0,
    pendingKYC: 0,
    totalVolume: 0,
    totalSolCollateral: 0,
    totalUsdcCollateral: 0,
    collateralValueUsd: 0,
    totalBorrowedUsdc: 0,
    averageLtv: 0,
    loansAtRisk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({
    SOL: 0,
    USDC: 1,
  });

  const calculateStats = async (
    loansData: any[],
    usersCount: number,
    kycCount: number,
    prices: Record<string, number>
  ) => {
    const activeLoans = loansData.filter((loan) => loan.status === "active");

    const totalSolCollateral = activeLoans
      .filter((loan) => loan.collateral_type === "SOL")
      .reduce((sum, loan) => sum + loan.collateral_amount, 0);

    const totalUsdcCollateral = activeLoans
      .filter((loan) => loan.collateral_type === "USDC")
      .reduce((sum, loan) => sum + loan.collateral_amount, 0);

    const collateralValueUsd =
      totalSolCollateral * prices.SOL + totalUsdcCollateral * prices.USDC;

    const totalBorrowedUsdc = activeLoans.reduce(
      (sum, loan) => sum + loan.borrowed_usdc,
      0
    );

    const totalVolume = loansData.reduce(
      (sum, loan) => sum + loan.borrowed_usdc,
      0
    );

    const averageLtv =
      activeLoans.length > 0
        ? activeLoans.reduce((sum, loan) => sum + loan.ltv_ratio, 0) /
          activeLoans.length
        : 0;

    const loansAtRisk = activeLoans.filter(
      (loan) => loan.health_factor && loan.health_factor < 1.5
    ).length;

    setStats({
      totalUsers: usersCount,
      activeLoans: activeLoans.length,
      pendingKYC: kycCount,
      totalVolume,
      totalSolCollateral,
      totalUsdcCollateral,
      collateralValueUsd,
      totalBorrowedUsdc,
      averageLtv,
      loansAtRisk,
    });
  };

  useEffect(() => {
    let loansChannel: RealtimeChannel;
    let pricesChannel: RealtimeChannel;
    let loansCache: any[] = [];
    let usersCountCache = 0;
    let kycCountCache = 0;

    const setupRealtime = async () => {
      // Fetch initial crypto prices - récupérer plus de lignes pour déduplication
      const { data: pricesData } = await supabase
        .from("crypto_prices")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(20);

      if (pricesData) {
        const priceMap: Record<string, number> = { USDC: 1 };
        const seenSymbols = new Set<string>();
        
        // Dédupliquer : garder uniquement le prix le plus récent de chaque symbole
        pricesData.forEach((price) => {
          if (!seenSymbols.has(price.symbol)) {
            priceMap[price.symbol] = price.price_usd;
            seenSymbols.add(price.symbol);
          }
        });
        setCryptoPrices(priceMap);

        // Fetch initial data
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id");

        const { data: loansData } = await supabase
          .from("loan_positions")
          .select("*");

        const { data: kycData } = await supabase
          .from("kyc_submissions")
          .select("id, status")
          .eq("status", "pending");

        loansCache = loansData || [];
        usersCountCache = profilesData?.length || 0;
        kycCountCache = kycData?.length || 0;

        await calculateStats(
          loansCache,
          usersCountCache,
          kycCountCache,
          priceMap
        );
        setLoading(false);

        // Subscribe to loan_positions changes
        loansChannel = supabase
          .channel("admin-loans-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "loan_positions",
            },
            async (payload) => {
              if (payload.eventType === "INSERT") {
                loansCache = [...loansCache, payload.new];
              } else if (payload.eventType === "UPDATE") {
                loansCache = loansCache.map((loan) =>
                  loan.id === payload.new.id ? payload.new : loan
                );
              } else if (payload.eventType === "DELETE") {
                loansCache = loansCache.filter(
                  (loan) => loan.id !== payload.old.id
                );
              }
              await calculateStats(
                loansCache,
                usersCountCache,
                kycCountCache,
                cryptoPrices
              );
            }
          )
          .subscribe();

        // Subscribe to crypto_prices changes
        pricesChannel = supabase
          .channel("admin-prices-changes")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "crypto_prices",
            },
            async (payload) => {
              const newPrice = payload.new as any;
              const updatedPrices = {
                ...cryptoPrices,
                [newPrice.symbol]: newPrice.price_usd,
              };
              setCryptoPrices(updatedPrices);
              await calculateStats(
                loansCache,
                usersCountCache,
                kycCountCache,
                updatedPrices
              );
            }
          )
          .subscribe();
      }
    };

    setupRealtime();

    return () => {
      if (loansChannel) {
        supabase.removeChannel(loansChannel);
      }
      if (pricesChannel) {
        supabase.removeChannel(pricesChannel);
      }
    };
  }, []);

  return { stats, loading };
};
