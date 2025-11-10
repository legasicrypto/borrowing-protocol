import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    const query = supabase.from("liquidation_intents").select("*").order("created_at", { ascending: false }).limit(20)

    const { data: intents, error } = await query

    if (error) {
      console.error("[v0] Liquidations fetch error:", error)
      return NextResponse.json({ error: error.message, intents: [] }, { status: 500 })
    }

    // Transform to expected format
    const transformed =
      intents?.map((intent) => ({
        id: intent.id,
        position_id: intent.position_id,
        borrower: intent.position_id.split("_")[1] || "unknown",
        collateral_asset: "BTC", // Default, should come from position
        amount_to_liquidate: Number(intent.notional_to_raise) || 0,
        min_out: Number(intent.min_out) || 0,
        deadline: intent.deadline,
        status: intent.status || "pending",
        created_at: intent.created_at,
      })) || []

    return NextResponse.json({ intents: transformed })
  } catch (error: any) {
    console.error("[v0] Liquidations error:", error)
    return NextResponse.json({ error: error.message, intents: [] }, { status: 500 })
  }
}
