import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DEMO_PRICES } from "@/lib/demo/data"

export async function GET() {
  const supabase = await createClient()

  const { data: prices, error } = await supabase
    .from("price_feeds")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to expected format
  const transformed =
    prices?.map((p: any) => ({
      asset: p.asset,
      price: Number(p.price),
      round_id: p.oracle_round_id,
      timestamp: p.timestamp,
    })) || []

  return NextResponse.json({ prices: transformed.length > 0 ? transformed : DEMO_PRICES })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { asset_pair, price, source, confidence } = body

  if (!asset_pair || !price || !source) {
    return NextResponse.json({ error: "Missing required fields: asset_pair, price, source" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("price_feeds")
    .insert({
      asset_pair,
      price,
      source,
      confidence: confidence || 0.95,
      published_at: new Date().toISOString(),
      pushed_to_chain: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from("audit_logs").insert({
    entity_type: "price",
    entity_id: data.id,
    action: "created",
    metadata: { asset_pair, price, source },
  })

  return NextResponse.json({ data })
}
