import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { loansContract } from "@/lib/soroban/contract-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_stellar, collateral_asset, collateral_amount, borrow_asset, borrow_amount } = body

    console.log("[v0] Creating loan position with smart contract:", body)

    // Validation
    if (!owner_stellar || !collateral_asset || !collateral_amount || !borrow_asset || !borrow_amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (Number(collateral_amount) <= 0 || Number(borrow_amount) <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amounts" }, { status: 400 })
    }

    // Validate Stellar address format
    if (!/^G[A-Z0-9]{55}$/.test(owner_stellar)) {
      return NextResponse.json({ success: false, error: "Invalid Stellar address format" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get price data
    const { data: priceData } = await supabase
      .from("price_feeds")
      .select("*")
      .eq("asset", collateral_asset)
      .eq("approved", true)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single()

    const defaultPrices: Record<string, number> = {
      XLM: 0.42,
      BTC: 95000,
      USDC: 1.0,
      ETH: 3000,
    }

    const collateralPrice = priceData ? Number(priceData.price) : defaultPrices[collateral_asset] || 1.0
    const collateralValue = Number(collateral_amount) * collateralPrice
    const borrowAmountNum = Number(borrow_amount)
    const ltv = (borrowAmountNum / collateralValue) * 100

    // Check policy
    const { data: policy } = await supabase.from("policy_parameters").select("*").eq("asset", collateral_asset).single()
    const maxLtv = policy ? Number(policy.max_ltv_on_draw) * 100 : 80
    if (ltv > maxLtv) {
      return NextResponse.json(
        { success: false, error: `LTV ${ltv.toFixed(2)}% exceeds maximum ${maxLtv}%` },
        { status: 400 },
      )
    }

    // Generate position ID and collateral reference
    const timestamp = Date.now()
    const positionId = `pos_${owner_stellar.substring(0, 8)}_${timestamp}`
    const collateralRef = `vault_${collateral_asset}_${timestamp}`

    console.log("[v0] Building smart contract transaction...")

    // Build smart contract transaction
    let transactionXDR: string
    try {
      const { xdr } = await loansContract.openPosition(
        positionId,
        owner_stellar, // owner (public key)
        collateralRef,
        collateral_asset,
        owner_stellar, // signerPublicKey (same as owner)
      )
      transactionXDR = xdr
      console.log("[v0] Transaction XDR built successfully")
    } catch (contractError: any) {
      console.error("[v0] Contract transaction build failed:", contractError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to build contract transaction: ${contractError.message}` 
        },
        { status: 500 },
      )
    }

    // Save to database with pending status
    const { data: newPosition, error: insertError } = await supabase
      .from("positions")
      .insert({
        position_id: positionId,
        borrower_address: owner_stellar,
        vault_id: collateralRef,
        collateral_asset: collateral_asset,
        collateral_amount: Number(collateral_amount),
        borrowed_asset: borrow_asset,
        principal: borrowAmountNum,
        accrued_interest: 0,
        ltv: ltv / 100,
        status: "pending", // Will be updated after transaction confirmation
        opened_at: new Date().toISOString(),
        last_interest_accrual: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Database insert error:", insertError)
      return NextResponse.json(
        { success: false, error: `Failed to save position: ${insertError.message}` },
        { status: 500 },
      )
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      event_type: "loan_created",
      entity_type: "position",
      entity_id: positionId,
      user_address: owner_stellar,
      details: {
        collateral_asset,
        collateral_amount: Number(collateral_amount),
        borrow_amount: borrowAmountNum,
        ltv: ltv,
        status: "pending",
      },
    })

    console.log("[v0] Position created, returning transaction XDR for signing")

    return NextResponse.json({
      success: true,
      position: newPosition,
      transactionXDR, // Client needs to sign this
      requiresSignature: true,
      message: "Position created. Please sign the transaction.",
    })
  } catch (error: any) {
    console.error("[v0] Error creating position:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create loan",
      },
      { status: 500 },
    )
  }
}
