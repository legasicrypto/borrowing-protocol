import { NextResponse } from "next/server"
import { createClient, createServerClient } from "@/lib/supabase/server"
import { DEMO_POSITIONS } from "@/lib/demo/data"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const status = searchParams.get("status")

    console.log("[v0] Fetching positions for wallet:", walletAddress)

    let query = supabase.from("positions").select("*").order("created_at", { ascending: false })

    if (walletAddress) {
      query = query.eq("borrower_address", walletAddress)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: positions, error } = await query

    if (error) {
      console.error("[v0] Error fetching positions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

  console.log("[v0] Found positions:", positions?.length || 0)

  const fallback = DEMO_POSITIONS

  return NextResponse.json({ positions: positions && positions.length > 0 ? positions : fallback })
  } catch (error: any) {
    console.error("[v0] Error in positions API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const {
    user_id,
    vault_id,
    position_id,
    collateral_asset,
    collateral_amount,
    borrowed_asset,
    borrowed_amount,
    interest_rate,
    ltv_ratio,
    liquidation_threshold,
  } = body

  if (!user_id || !vault_id || !position_id || !collateral_amount || !borrowed_amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("positions")
    .insert({
      user_id,
      vault_id,
      position_id,
      collateral_asset,
      collateral_amount,
      borrowed_asset,
      borrowed_amount,
      interest_rate: interest_rate || 5.5,
      ltv_ratio: ltv_ratio || 0,
      liquidation_threshold: liquidation_threshold || 75,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from("audit_logs").insert({
    entity_type: "position",
    entity_id: data.id,
    action: "created",
    user_id,
    metadata: { position_id, collateral_amount, borrowed_amount },
  })

  return NextResponse.json({ data })
}
