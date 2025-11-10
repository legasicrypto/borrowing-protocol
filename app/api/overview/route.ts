import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const [{ count: totalPositions }, { count: activeLiquidations }, { count: pendingPrices }, { data: prices }] =
      await Promise.all([
        supabase.from("positions").select("*", { count: "exact", head: true }),
        supabase.from("liquidation_intents").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("prices").select("*", { count: "exact", head: true }).eq("approved", false),
        supabase.from("positions").select("principal, collateral_amount, asset"),
      ])

    // Calculate total liquidity
    const totalLiquidity =
      prices?.reduce((sum, pos) => {
        return sum + (Number(pos.collateral_amount) || 0)
      }, 0) || 0

    // Calculate avg LTV
    const avgLtv = prices?.length
      ? prices.reduce((sum, pos) => {
          const ltv = Number(pos.principal) / Number(pos.collateral_amount || 1)
          return sum + ltv
        }, 0) / prices.length
      : 0

    return NextResponse.json({
      metrics: {
        totalLiquidity: totalLiquidity.toFixed(2),
        activeLoans: totalPositions || 0,
        avgLtv: (avgLtv * 100).toFixed(1),
        openLiquidations: activeLiquidations || 0,
        pendingPrices: pendingPrices || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching overview:", error)
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 })
  }
}
