import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Price aggregator cron job - runs daily at midnight UTC (Hobby plan compatible)
export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch prices from multiple exchanges (simplified example)
    const prices = await fetchPricesFromExchanges()

    // Store in Supabase
    for (const price of prices) {
      await supabase.from("price_feeds").insert({
        asset: price.asset,
        price: price.price,
        source: price.source,
        timestamp: new Date().toISOString(),
        approved: false,
      })
    }

    return NextResponse.json({ success: true, count: prices.length })
  } catch (error) {
    console.error("[v0] Price aggregator error:", error)
    return NextResponse.json({ error: "Failed to update prices" }, { status: 500 })
  }
}

async function fetchPricesFromExchanges() {
  // Mock implementation - replace with real exchange APIs
  return [
    { asset: "BTC", price: 45000 + Math.random() * 100, source: "bybit" },
    { asset: "USDC", price: 1.0, source: "coinbase" },
  ]
}
