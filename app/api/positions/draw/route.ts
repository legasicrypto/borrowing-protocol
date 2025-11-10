import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { loansContract, priceOracleContract, policyRegistryContract } from "@/lib/soroban/contracts"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { positionId, borrower, amount } = body

    if (!positionId || !borrower || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: position, error: posError } = await supabase
      .from("positions")
      .select("*")
      .eq("id", positionId)
      .single()

    if (posError || !position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    const priceData = await priceOracleContract.getPrice(position.asset)
    const collateralVal = (Number(position.collateral_amount) * Number(priceData.price)) / 10000000

    const newPrincipal = Number(position.principal) + Number(amount)
    const newLtv = newPrincipal / collateralVal

    const policy = await policyRegistryContract.getPolicy(position.asset)
    if (newLtv > policy.maxLtv / 100) {
      return NextResponse.json({ error: "LTV exceeds maximum allowed" }, { status: 400 })
    }

    await loansContract.draw(positionId, borrower, BigInt(amount))

    const { error: updateError } = await supabase
      .from("positions")
      .update({
        principal: newPrincipal.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", positionId)

    if (updateError) throw updateError

    await supabase.from("events").insert({
      event_type: "draw",
      position_id: positionId,
      data: { amount, newLtv: newLtv.toFixed(4) },
    })

    return NextResponse.json({ success: true, newLtv: newLtv.toFixed(4) })
  } catch (error) {
    console.error("[v0] Error drawing from position:", error)
    return NextResponse.json({ error: "Failed to draw from position" }, { status: 500 })
  }
}
