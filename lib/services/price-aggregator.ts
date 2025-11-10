// Self-contained price aggregator service
// Fetches prices from multiple exchanges and pushes to Soroban

interface ExchangePrice {
  exchange: string
  price: number
  timestamp: number
}

interface AggregatedPrice {
  asset_pair: string
  price: number
  confidence: number
  sources: ExchangePrice[]
  timestamp: number
}

export class PriceAggregator {
  private exchanges = ["bybit", "coinbase", "kraken", "binance"]

  async fetchPrice(assetPair: string): Promise<AggregatedPrice> {
    // Simulate fetching from multiple exchanges
    // In production: use actual exchange APIs
    const sources: ExchangePrice[] = await Promise.all(
      this.exchanges.map(async (exchange) => ({
        exchange,
        price: this.simulateExchangePrice(assetPair),
        timestamp: Date.now(),
      })),
    )

    // Calculate weighted average
    const avgPrice = sources.reduce((sum, s) => sum + s.price, 0) / sources.length

    // Calculate confidence based on price spread
    const prices = sources.map((s) => s.price)
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const spread = ((maxPrice - minPrice) / avgPrice) * 100

    // Higher spread = lower confidence
    const confidence = Math.max(0.5, 1 - spread / 10)

    return {
      asset_pair: assetPair,
      price: avgPrice,
      confidence,
      sources,
      timestamp: Date.now(),
    }
  }

  async publishToSupabase(aggregatedPrice: AggregatedPrice): Promise<string> {
    // Store in Supabase price_feeds table
    const response = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset_pair: aggregatedPrice.asset_pair,
        price: aggregatedPrice.price,
        source: "aggregated",
        confidence: aggregatedPrice.confidence,
      }),
    })

    const data = await response.json()
    return data.id
  }

  async pushToSoroban(priceId: string): Promise<string> {
    // Push to Soroban price oracle contract
    const response = await fetch(`/api/prices/${priceId}/push`, {
      method: "POST",
    })

    const data = await response.json()
    return data.tx_hash
  }

  private simulateExchangePrice(assetPair: string): number {
    // Simulate real prices with small variance
    const basePrices: Record<string, number> = {
      "BTC/USD": 95000,
      "USDC/USD": 1.0,
      "EUR/USD": 1.08,
    }

    const basePrice = basePrices[assetPair] || 1000
    const variance = (Math.random() - 0.5) * 0.02 // ±1% variance
    return basePrice * (1 + variance)
  }
}

export const priceAggregator = new PriceAggregator()
