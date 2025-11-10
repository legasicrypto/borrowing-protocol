import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { asset, price, admin_address } = body

    console.log("[v0] Updating price:", body)

    if (!asset || !price) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const roundId = `round_${Date.now()}`
    const { data: priceData, error } = await supabase
      .from("price_feeds")
      .insert({
        asset,
        price: Number(price),
        oracle_round_id: roundId,
        source: "admin_dashboard",
        timestamp: new Date().toISOString(),
        approved: true,
        approved_by: admin_address || "system",
        approved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    console.log("[v0] Price updated successfully:", priceData)

    return NextResponse.json({
      success: true,
      price: priceData,
      message: `${asset} price updated to $${price}`,
    })
  } catch (error: any) {
    console.error("[v0] Price update error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update price",
      },
      { status: 500 },
    )
  }
}
