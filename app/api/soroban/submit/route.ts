import { type NextRequest, NextResponse } from "next/server"
import { getRpcServer } from "@/lib/soroban/contract-client"
import { Transaction, Networks, SorobanRpc } from "@stellar/stellar-sdk"

export async function POST(request: NextRequest) {
  try {
    const { xdr } = await request.json()

    if (!xdr) {
      return NextResponse.json({ error: "Missing XDR" }, { status: 400 })
    }

    console.log("[v0] Submitting transaction to Stellar network")

    const server = getRpcServer()
    const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

    // Parse the signed transaction - use Transaction.fromXDR for Soroban transactions
    const transaction = new Transaction(xdr, networkPassphrase)

    // Submit to network
    const response = await server.sendTransaction(transaction)

    console.log("[v0] Transaction submitted:", response)

    if (response.status === "PENDING" || response.status === "SUCCESS") {
      // Poll for result
      let attempts = 0
      const maxAttempts = 20

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const txResult = await server.getTransaction(response.hash)

        if (txResult.status === "SUCCESS") {
          console.log("[v0] Transaction confirmed:", response.hash)
          return NextResponse.json({
            success: true,
            hash: response.hash,
            status: "SUCCESS",
          })
        } else if (txResult.status === "FAILED") {
          console.error("[v0] Transaction failed:", txResult)
          return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 })
        }

        attempts++
      }

      // Still pending after max attempts
      return NextResponse.json({
        success: true,
        hash: response.hash,
        status: "PENDING",
      })
    } else if (response.status === "ERROR") {
      console.error("[v0] Transaction error:", response)
      return NextResponse.json({ error: response.errorResult || "Transaction error" }, { status: 400 })
    }

    return NextResponse.json({ error: "Unknown transaction status" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error submitting transaction:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit transaction" },
      { status: 500 },
    )
  }
}
