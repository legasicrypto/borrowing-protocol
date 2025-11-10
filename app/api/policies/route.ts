import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: policies, error } = await supabase
      .from("policy_parameters")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ policies: policies || [] })
  } catch (error: any) {
    console.error("[v0] Policies fetch error:", error)
    return NextResponse.json(
      {
        error: error.message,
        policies: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      asset,
      max_ltv_on_draw,
      liquidation_band_1,
      liquidation_band_2,
      liquidation_band_3,
      base_interest_rate,
      spread,
    } = body

    if (!asset || !max_ltv_on_draw) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const policyHash = `policy_${asset}_${Date.now()}`

    const { data: policy, error } = await supabase
      .from("policy_parameters")
      .insert({
        asset,
        policy_hash: policyHash,
        max_ltv_on_draw: max_ltv_on_draw,
        liquidation_band_1: liquidation_band_1 || 75,
        liquidation_band_2: liquidation_band_2 || 85,
        liquidation_band_3: liquidation_band_3 || 95,
        base_interest_rate: base_interest_rate || 5.0,
        spread: spread || 2.0,
        policy_version: 1,
        circuit_breaker: false,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, policy })
  } catch (error: any) {
    console.error("[v0] Policy create error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
