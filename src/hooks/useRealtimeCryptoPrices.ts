import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CryptoPrice {
  id: string;
  symbol: string;
  price_usd: number;
  price_eur: number;
  change_24h: number;
  recorded_at: string;
}

export type { CryptoPrice };

export const useRealtimeCryptoPrices = () => {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      // Fetch initial prices
      const { data, error } = await supabase
        .from("crypto_prices")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        const priceMap: Record<string, CryptoPrice> = {};
        data.forEach((price) => {
          priceMap[price.symbol] = price;
        });
        setPrices(priceMap);
      }
      setLoading(false);

      // Subscribe to realtime updates
      channel = supabase
        .channel("crypto-prices-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "crypto_prices",
          },
          (payload) => {
            const newPrice = payload.new as CryptoPrice;
            setPrices((prev) => ({
              ...prev,
              [newPrice.symbol]: newPrice,
            }));
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
  }, []);

  return { prices, loading };
};
