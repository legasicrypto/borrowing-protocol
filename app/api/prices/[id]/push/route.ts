import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { contracts, invokeSorobanContract } from "@/lib/soroban/client"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get price feed
  const { data: priceFeed, error } = await supabase.from("price_feeds").select("*").eq("id", id).single()

  if (error || !priceFeed) {
    return NextResponse.json({ error: "Price feed not found" }, { status: 404 })
  }

  if (priceFeed.pushed_to_chain) {
    return NextResponse.json({ error: "Already pushed to chain" }, { status: 400 })
  }

  try {
    // Push to Soroban price oracle contract
    const result = await invokeSorobanContract(contracts.priceOracle, "publish_price", [
      priceFeed.asset_pair,
      Math.floor(priceFeed.price * 100000000), // Convert to 8 decimals
      Math.floor((priceFeed.confidence || 0.95) * 10000), // Convert to basis points
      priceFeed.source,
    ])

    // Update price feed with tx hash
    const txHash = `TX${Date.now()}` // Simulated tx hash
    await supabase
      .from("price_feeds")
      .update({
        pushed_to_chain: true,
        tx_hash: txHash,
      })
      .eq("id", id)

    // Log audit event
    await supabase.from("audit_logs").insert({
      entity_type: "price",
      entity_id: id,
      action: "pushed_to_chain",
      metadata: { tx_hash: txHash },
    })

    return NextResponse.json({ success: true, tx_hash: txHash })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
