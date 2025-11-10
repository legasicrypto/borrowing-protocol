import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { position_id, tx_hash } = body

    if (!position_id || !tx_hash) {
      return NextResponse.json({ success: false, error: "Missing position_id or tx_hash" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Update position status to active after transaction confirmation
    const { data: updatedPosition, error: updateError } = await supabase
      .from("positions")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("position_id", position_id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating position:", updateError)
      return NextResponse.json(
        { success: false, error: `Failed to update position: ${updateError.message}` },
        { status: 500 },
      )
    }

    // Log transaction hash
    await supabase.from("audit_logs").insert({
      event_type: "transaction_confirmed",
      entity_type: "position",
      entity_id: position_id,
      details: {
        tx_hash,
        status: "active",
      },
    })

    return NextResponse.json({
      success: true,
      position: updatedPosition,
      tx_hash,
      message: "Transaction confirmed and position activated",
    })
  } catch (error: any) {
    console.error("[v0] Error confirming transaction:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm transaction" },
      { status: 500 },
    )
  }
}
