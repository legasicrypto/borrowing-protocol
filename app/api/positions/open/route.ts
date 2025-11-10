import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { loansContract, kycRegistryContract } from "@/lib/soroban/contract-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { borrowerAddress, collateralAsset, collateralAmount, borrowedAsset, principal, vaultId } = body

    console.log("[v0] Creating position with data:", body)

    if (!borrowerAddress) {
      return NextResponse.json({ success: false, error: "Borrower address is required" }, { status: 400 })
    }
    if (!collateralAsset) {
      return NextResponse.json({ success: false, error: "Collateral asset is required" }, { status: 400 })
    }
    if (!collateralAmount || Number.parseFloat(collateralAmount) <= 0) {
      return NextResponse.json({ success: false, error: "Valid collateral amount is required" }, { status: 400 })
    }
    if (!borrowedAsset) {
      return NextResponse.json({ success: false, error: "Borrowed asset is required" }, { status: 400 })
    }
    if (!principal || Number.parseFloat(principal) <= 0) {
      return NextResponse.json({ success: false, error: "Valid principal amount is required" }, { status: 400 })
    }

    try {
      const isKycVerified = await kycRegistryContract.isVerified(borrowerAddress)
      console.log("[v0] KYC status:", isKycVerified)

      if (!isKycVerified) {
        return NextResponse.json(
          { success: false, error: "KYC verification required. Please complete KYC first." },
          { status: 403 },
        )
      }
    } catch (kycError) {
      console.log("[v0] KYC check failed, continuing in test mode:", kycError)
    }

    const positionId = `pos_${Date.now()}_${borrowerAddress.slice(0, 8)}`
    const collateralRef = vaultId || `vault_${Date.now()}`

    let transactionXDR: string | null = null
    try {
      const { xdr } = await loansContract.openPosition(borrowerAddress, collateralRef, collateralAsset, borrowerAddress)
      transactionXDR = xdr
      console.log("[v0] Transaction XDR generated:", xdr.substring(0, 50) + "...")
    } catch (contractError) {
      console.error("[v0] Contract call failed:", contractError)
      return NextResponse.json({ success: false, error: "Failed to build contract transaction" }, { status: 500 })
    }

    const supabase = await createServerClient()
    const collateralAmountNum = Number.parseFloat(collateralAmount)
    const principalNum = Number.parseFloat(principal)
    const collateralValue =
      collateralAmountNum * (collateralAsset === "BTC" ? 45000 : collateralAsset === "XLM" ? 0.42 : 1)
    const ltv = (principalNum / collateralValue) * 100

    const { data, error } = await supabase
      .from("positions")
      .insert({
        position_id: positionId,
        borrower_address: borrowerAddress,
        vault_id: collateralRef,
        collateral_asset: collateralAsset,
        collateral_amount: collateralAmountNum,
        borrowed_asset: borrowedAsset,
        principal: principalNum,
        accrued_interest: 0,
        ltv: ltv,
        status: "pending", // Start as pending until transaction is signed and confirmed
        last_interest_accrual: new Date().toISOString(),
        opened_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
          details: error,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Position created successfully:", data)

    return NextResponse.json({
      success: true,
      position: data,
      transactionXDR, // Client will sign this
      requiresSignature: true,
    })
  } catch (error) {
    console.error("[v0] Error opening position:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to open position",
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    )
  }
}
