import { type NextRequest, NextResponse } from "next/server"
import { loansContract, priceOracleContract, CONTRACTS } from "@/lib/soroban/contract-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contract, method, args, sourceAccount } = body

    if (!contract || !method || !sourceAccount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Building transaction:", { contract, method, sourceAccount })

    // Ensure contract IDs are configured for requested contract
    if (contract === "loans" && !CONTRACTS.loans) {
      return NextResponse.json({ error: "Loans contract is not configured. Set NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT." }, { status: 500 })
    }

    if (contract === "priceOracle" && !CONTRACTS.priceOracle) {
      return NextResponse.json({ error: "Price oracle contract is not configured. Set NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT." }, { status: 500 })
    }

    let xdr: string

    switch (contract) {
      case "loans":
        switch (method) {
          case "open_position":
            if (!args.positionId || !args.owner || !args.collateralRef || !args.asset) {
              return NextResponse.json({ error: "Missing required arguments for open_position" }, { status: 400 })
            }
            const openResult = await loansContract.openPosition(
              args.positionId,
              args.owner,
              args.collateralRef,
              args.asset,
              sourceAccount,
            )
            xdr = openResult.xdr
            break

          case "draw":
            if (!args.positionId || args.amount === undefined || args.oracleRound === undefined || args.newLtvBps === undefined) {
              return NextResponse.json({ error: "Missing required arguments for draw" }, { status: 400 })
            }
            const drawResult = await loansContract.draw(
              args.positionId,
              BigInt(args.amount),
              BigInt(args.oracleRound),
              args.newLtvBps,
              sourceAccount,
            )
            xdr = drawResult.xdr
            break

          case "repay":
            if (!args.positionId || !args.payer || args.amount === undefined) {
              return NextResponse.json({ error: "Missing required arguments for repay" }, { status: 400 })
            }
            const repayResult = await loansContract.repay(
              args.positionId,
              args.payer,
              BigInt(args.amount),
              sourceAccount,
            )
            xdr = repayResult.xdr
            break

          default:
            return NextResponse.json({ error: `Unknown method: ${method}` }, { status: 400 })
        }
        break

      case "priceOracle":
        switch (method) {
          case "update_price":
            if (!args.asset || args.price === undefined || args.timestamp === undefined || args.roundId === undefined) {
              return NextResponse.json({ error: "Missing required arguments for update_price" }, { status: 400 })
            }
            const priceResult = await priceOracleContract.updatePrice(
              args.asset,
              BigInt(args.price),
              BigInt(args.timestamp),
              BigInt(args.roundId),
              sourceAccount,
            )
            xdr = priceResult.xdr
            break

          default:
            return NextResponse.json({ error: `Unknown method: ${method}` }, { status: 400 })
        }
        break

      default:
        return NextResponse.json({ error: `Unknown contract: ${contract}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, xdr })
  } catch (error: any) {
    console.error("[v0] Error building transaction:", error)
    return NextResponse.json(
      { error: error.message || "Failed to build transaction" },
      { status: 500 },
    )
  }
}

