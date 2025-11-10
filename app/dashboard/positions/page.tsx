"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Position {
  id: string
  position_id: string
  collateral_asset: string
  collateral_amount: number
  borrowed_asset: string
  principal: number
  accrued_interest: number
  ltv: number
  status: string
  created_at: string
  opened_at: string
}

export default function PositionsPage() {
  const { connected, publicKey } = useWallet()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (connected && publicKey) {
      fetchPositions()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  const fetchPositions = async () => {
    try {
      console.log("[v0] Fetching positions for wallet:", publicKey)
      const response = await fetch(`/api/positions?wallet=${publicKey}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Positions received:", data)

      const activePositions = (data.positions || []).filter(
        (p: Position) => p.status === "active" || p.status === "open",
      )

      setPositions(activePositions)
    } catch (error) {
      console.error("[v0] Failed to fetch positions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="glass-strong p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground">View and manage your loan positions</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">My Positions</h1>
          <p className="text-muted-foreground mt-2">Track and manage your active loans</p>
        </div>
        <Link href="/dashboard/borrow">
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">New Loan</Button>
        </Link>
      </div>

      {positions.length === 0 ? (
        <Card className="glass-strong p-12 text-center">
          <TrendingUp className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-bold mb-3">No Active Positions</h3>
          <p className="text-muted-foreground mb-6">Start borrowing to see your positions here</p>
          <Link href="/dashboard/borrow">
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">Create Your First Loan</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6">
          {positions.map((position, index) => (
            <motion.div
              key={position.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-strong p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{position.position_id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(position.opened_at || position.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      position.status === "active" || position.status === "open"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {position.status === "active" || position.status === "open" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium capitalize">{position.status}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="glass rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Collateral</p>
                    <p className="text-lg font-bold">
                      {Number(position.collateral_amount).toFixed(4)} {position.collateral_asset}
                    </p>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Borrowed</p>
                    <p className="text-lg font-bold">
                      ${Number(position.principal).toFixed(2)} {position.borrowed_asset}
                    </p>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Debt</p>
                    <p className="text-lg font-bold">
                      ${(Number(position.principal) + Number(position.accrued_interest)).toFixed(2)}
                    </p>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">LTV Ratio</p>
                    <p className={`text-lg font-bold ${Number(position.ltv) > 70 ? "text-red-500" : "text-green-500"}`}>
                      {Number(position.ltv).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-4 gap-2">
                  <Link href={`/dashboard/repay?position=${position.position_id}`}>
                    <Button variant="outline">Repay</Button>
                  </Link>
                  <Button variant="outline">Details</Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
