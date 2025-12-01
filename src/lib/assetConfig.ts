// Centralized asset configuration for easy future swaps
import btcLogo from "@/assets/btc-logo.webp"
import ethLogo from "@/assets/eth-logo.png"
import usdcLogo from "@/assets/usdc-logo.png"
import eurcLogo from "@/assets/eurc-logo.png"

export type CollateralAsset = "BTC" | "ETH" | "USDC"
export type BorrowAsset = "USDC" | "EURC"

export interface AssetInfo {
  symbol: string
  name: string
  logo: string
  coingeckoId: string
  decimals: number
}

export const COLLATERAL_ASSETS: Record<CollateralAsset, AssetInfo> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    logo: btcLogo,
    coingeckoId: "bitcoin",
    decimals: 8,
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    logo: ethLogo,
    coingeckoId: "ethereum",
    decimals: 18,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    logo: usdcLogo,
    coingeckoId: "usd-coin",
    decimals: 6,
  },
}

export const BORROW_ASSETS: Record<BorrowAsset, AssetInfo> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    logo: usdcLogo,
    coingeckoId: "usd-coin",
    decimals: 6,
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    logo: eurcLogo,
    coingeckoId: "eurc",
    decimals: 6,
  },
}

// Primary collateral asset (the one replacing SOL)
export const PRIMARY_COLLATERAL: CollateralAsset = "BTC"

// Helper to get asset logo by symbol
export function getAssetLogo(symbol: string): string {
  const collateral = COLLATERAL_ASSETS[symbol as CollateralAsset]
  if (collateral) return collateral.logo

  const borrow = BORROW_ASSETS[symbol as BorrowAsset]
  if (borrow) return borrow.logo

  // Fallback for legacy data
  if (symbol === "SOL") return btcLogo // Map old SOL to BTC

  return usdcLogo
}

// Helper to get coingecko ID by symbol
export function getCoingeckoId(symbol: string): string {
  const collateral = COLLATERAL_ASSETS[symbol as CollateralAsset]
  if (collateral) return collateral.coingeckoId

  const borrow = BORROW_ASSETS[symbol as BorrowAsset]
  if (borrow) return borrow.coingeckoId

  return "bitcoin"
}
