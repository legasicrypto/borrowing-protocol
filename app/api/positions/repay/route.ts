import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { loansContract } from "@/lib/soroban/contract-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { position_id, repayer_address, amount } = body

    console.log("[v0] Repaying loan:", body)

    if (!position_id || !repayer_address || !amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const repayAmount = Number(amount)
    if (repayAmount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid repayment amount" }, { status: 400 })
    }

    let txHash = body.tx_hash

    // If no tx_hash provided, this is an off-chain repayment (for testing)
    // For production, you might want to require tx_hash
    if (!txHash) {
      txHash = `repay_${Date.now()}_${Math.random().toString(36).substring(7)}`
    }

    const supabase = await createServerClient()

    const { data: position, error: fetchError } = await supabase
      .from("positions")
      .select("*")
      .eq("position_id", position_id)
      .single()

    if (fetchError || !position) {
      return NextResponse.json({ success: false, error: "Position not found" }, { status: 404 })
    }

    const currentPrincipal = Number(position.principal)
    const currentInterest = Number(position.accrued_interest)
    const totalDebt = currentPrincipal + currentInterest

    if (repayAmount > totalDebt) {
      return NextResponse.json(
        { success: false, error: `Repayment amount exceeds total debt of $${totalDebt.toFixed(2)}` },
        { status: 400 },
      )
    }

    let remainingPayment = repayAmount
    let newInterest = currentInterest
    let newPrincipal = currentPrincipal

    if (remainingPayment >= currentInterest) {
      remainingPayment -= currentInterest
      newInterest = 0
      newPrincipal -= remainingPayment
    } else {
      newInterest -= remainingPayment
    }

    const newStatus = newPrincipal <= 0 ? "closed" : "active"

    const { data: updated, error: updateError } = await supabase
      .from("positions")
      .update({
        principal: Math.max(0, newPrincipal),
        accrued_interest: Math.max(0, newInterest),
        status: newStatus,
        closed_at: newStatus === "closed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("position_id", position_id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update position: ${updateError.message}`)
    }

    await supabase.from("audit_logs").insert({
      event_type: "loan_repayment",
      entity_type: "position",
      entity_id: position_id,
      user_address: repayer_address,
      details: {
        amount: repayAmount,
        tx_hash: txHash,
        new_principal: newPrincipal,
        new_interest: newInterest,
        status: newStatus,
      },
    })

    console.log("[v0] Repayment successful:", { position_id, amount: repayAmount, new_status: newStatus })

    return NextResponse.json({
      success: true,
      position: updated,
      tx_hash: txHash,
      message: `Successfully repaid $${repayAmount.toFixed(2)}`,
    })
  } catch (error: any) {
    console.error("[v0] Repay error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to repay" }, { status: 500 })
  }
}
