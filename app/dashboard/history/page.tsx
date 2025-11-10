"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useWallet } from "@/lib/context/wallet-context"
import { motion } from "framer-motion"
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react"

interface Position {
  id: string
  position_id: string
  collateral_asset: string
  collateral_amount: number
  borrowed_asset: string
  principal: number
  status: string
  opened_at: string
  closed_at: string | null
}

export default function HistoryPage() {
  const { connected, publicKey } = useWallet()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (connected && publicKey) {
      fetchHistory()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  const fetchHistory = async () => {
    try {
      console.log("[v0] Fetching history for wallet:", publicKey)
      const response = await fetch(`/api/positions?wallet=${publicKey}`)
      const data = await response.json()
      console.log("[v0] History received:", data)
      setPositions(data.positions || [])
    } catch (error) {
      console.error("[v0] Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="glass-strong p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground">View your transaction history</p>
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
      <div>
        <h1 className="text-4xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground mt-2">View all your lending and borrowing activities</p>
      </div>

      {positions.length === 0 ? (
        <Card className="glass-strong p-12 text-center">
          <Clock className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-bold mb-3">No Transaction History</h3>
          <p className="text-muted-foreground">Your borrowing activity will appear here</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {positions.map((position, index) => (
            <motion.div
              key={position.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-strong p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full ${position.status === "closed" ? "bg-green-500/10" : "bg-primary/10"}`}
                    >
                      {position.status === "closed" ? (
                        <ArrowUpRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ArrowDownLeft className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">{position.status === "closed" ? "Loan Closed" : "Loan Opened"}</h3>
                      <p className="text-sm text-muted-foreground">{position.position_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      ${Number(position.principal).toFixed(2)} {position.borrowed_asset}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Collateral: {Number(position.collateral_amount).toFixed(4)} {position.collateral_asset}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{new Date(position.opened_at).toLocaleDateString()}</p>
                    <p
                      className={`text-sm font-medium ${
                        position.status === "active" || position.status === "open"
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {position.status === "active" || position.status === "open" ? "Active" : "Closed"}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
