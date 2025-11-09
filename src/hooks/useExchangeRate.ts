import { useMemo } from "react";
import type { CryptoPrice } from "./useRealtimeCryptoPrices";

export const useExchangeRate = (
  cryptoPrices: Record<string, CryptoPrice>
): number => {
  return useMemo(() => {
    // Use USDC as reference for EUR/USD rate
    const usdcData = cryptoPrices["USDC"];
    if (usdcData?.price_usd && usdcData?.price_eur) {
      return usdcData.price_usd / usdcData.price_eur;
    }
    
    // Fallback: calculate from SOL if USDC unavailable
    const solData = cryptoPrices["SOL"];
    if (solData?.price_usd && solData?.price_eur) {
      return solData.price_usd / solData.price_eur;
    }
    
    // Static fallback rate
    return 1.16;
  }, [cryptoPrices]);
};
