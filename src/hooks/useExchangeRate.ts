"use client"

import { useMemo } from "react"
import type { CryptoPrice } from "./useRealtimeCryptoPrices"

export const useExchangeRate = (cryptoPrices: Record<string, CryptoPrice>): number => {
  return useMemo(() => {
    const usdcData = cryptoPrices["USDC"]
    if (usdcData?.price_usd && usdcData?.price_eur) {
      return usdcData.price_usd / usdcData.price_eur
    }

    // Fallback: calculate from BTC if USDC unavailable
    const btcData = cryptoPrices["BTC"]
    if (btcData?.price_usd && btcData?.price_eur) {
      return btcData.price_usd / btcData.price_eur
    }

    // Static fallback rate
    return 1.16
  }, [cryptoPrices])
}
