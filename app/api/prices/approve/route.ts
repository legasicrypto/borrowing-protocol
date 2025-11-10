import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { invokeSorobanContract, contracts } from "@/lib/soroban/client"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { price_id, approved_by } = body

  if (!price_id) {
    return NextResponse.json({ error: "Missing price_id" }, { status: 400 })
  }

  // Get the price feed
  const { data: priceFeed, error: fetchError } = await supabase
    .from("price_feeds")
    .select("*")
    .eq("id", price_id)
    .single()

  if (fetchError || !priceFeed) {
    return NextResponse.json({ error: "Price feed not found" }, { status: 404 })
  }

  // Update to approved
  const { error: updateError } = await supabase
    .from("price_feeds")
    .update({
      approved: true,
      approved_by,
      approved_at: new Date().toISOString(),
    })
    .eq("id", price_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Push price to Soroban PriceOracleAdapter contract
  try {
    await invokeSorobanContract(contracts.priceOracle, "update_price", [
      priceFeed.asset,
      priceFeed.price,
      priceFeed.timestamp,
    ])
  } catch (error) {
    console.error("[v0] Failed to push price to Soroban:", error)
  }

  // Log audit event
  await supabase.from("audit_logs").insert({
    event_type: "price_approved",
    entity_type: "price_feed",
    entity_id: price_id,
    user_address: approved_by,
    details: { asset: priceFeed.asset, price: priceFeed.price },
  })

  return NextResponse.json({ success: true })
}
