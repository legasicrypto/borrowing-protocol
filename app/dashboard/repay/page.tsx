"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { scaffoldClient } from "@/lib/soroban/scaffold-client"

interface Position {
  position_id: string
  collateral_asset: string
  collateral_amount: number
  borrowed_asset: string
  principal: number
  accrued_interest: number
  ltv: number
  status: string
}

export default function RepayPage() {
  const { connected, publicKey, walletType } = useWallet()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const positionId = searchParams.get("position")

  const [position, setPosition] = useState<Position | null>(null)
  const [repayAmount, setRepayAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingPosition, setFetchingPosition] = useState(true)

  useEffect(() => {
    if (connected && publicKey && positionId) {
      fetchPosition()
    } else {
      setFetchingPosition(false)
    }
  }, [connected, publicKey, positionId])

  const fetchPosition = async () => {
    try {
      const response = await fetch(`/api/positions?wallet=${publicKey}`)
      const data = await response.json()
      const pos = data.positions?.find((p: Position) => p.position_id === positionId)
      if (pos) {
        setPosition(pos)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch position:", error)
    } finally {
      setFetchingPosition(false)
    }
  }

  const handleRepay = async () => {
    if (!position || !publicKey || !walletType) return

    const repayAmountNum = Number(repayAmount)
    if (repayAmountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid repayment amount",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Initialize scaffold client
      scaffoldClient.setWallet(walletType, publicKey)

      // Build transaction
      const buildResponse = await fetch("/api/soroban/build-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract: "loans",
          method: "repay",
          args: {
            positionId: position.position_id,
            payer: publicKey,
            amount: (repayAmountNum * 10_000_000).toString(), // Convert to 7 decimals
          },
          sourceAccount: publicKey,
        }),
      })

      if (!buildResponse.ok) {
        const error = await buildResponse.json()
        throw new Error(error.error || "Failed to build transaction")
      }

      const { xdr } = await buildResponse.json()

      // Sign and submit
      const signedXdr = await scaffoldClient.signAndSubmitTransaction(xdr)
      const txHash = await scaffoldClient.submitTransaction(signedXdr)

      // Update database
      const repayResponse = await fetch("/api/positions/repay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position_id: position.position_id,
          repayer_address: publicKey,
          amount: repayAmountNum,
          tx_hash: txHash,
        }),
      })

      const repayData = await repayResponse.json()

      if (!repayResponse.ok || !repayData.success) {
        throw new Error(repayData.error || "Failed to update repayment")
      }

      toast({
        title: "Repayment Successful! 🎉",
        description: `Repaid ${repayAmountNum.toFixed(2)} USDC. TX: ${txHash.substring(0, 8)}...`,
      })

      // Refresh position data
      await fetchPosition()
      setRepayAmount("")
    } catch (error: any) {
      console.error("[v0] Repayment failed:", error)
      toast({
        title: "Repayment Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="glass-strong p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Connect to repay your loans</p>
        </Card>
      </div>
    )
  }

  if (fetchingPosition) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!position) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="glass-strong p-12 max-w-md text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-3">Position Not Found</h2>
          <p className="text-muted-foreground">Unable to load the position details</p>
        </Card>
      </div>
    )
  }

  const totalDebt = position.principal + position.accrued_interest

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold">Repay Loan</h1>
        <p className="text-muted-foreground mt-2">Pay back your borrowed amount to unlock collateral</p>
      </div>

      <Card className="glass-strong p-6">
        <h3 className="text-xl font-bold mb-4">Position Details</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Collateral</p>
            <p className="text-lg font-bold">
              {position.collateral_amount.toFixed(4)} {position.collateral_asset}
            </p>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Principal</p>
            <p className="text-lg font-bold">${position.principal.toFixed(2)}</p>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Debt</p>
            <p className="text-lg font-bold text-primary">${totalDebt.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-strong p-6">
        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">Repayment Amount ({position.borrowed_asset})</Label>
            <Input
              type="number"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder={`Max: ${totalDebt.toFixed(2)}`}
              step="0.01"
            />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setRepayAmount((totalDebt * 0.25).toFixed(2))}>
                25%
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRepayAmount((totalDebt * 0.5).toFixed(2))}>
                50%
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRepayAmount((totalDebt * 0.75).toFixed(2))}>
                75%
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRepayAmount(totalDebt.toFixed(2))}>
                Max
              </Button>
            </div>
          </div>

          <Button
            onClick={handleRepay}
            disabled={loading || !repayAmount || Number(repayAmount) <= 0}
            className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {loading ? "Processing Repayment..." : "Repay On-Chain"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
