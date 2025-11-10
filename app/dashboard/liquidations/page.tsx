"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, XCircle, Clock, Shield } from "lucide-react"
import { motion } from "framer-motion"

interface LiquidationIntent {
  id: string
  position_id: string
  borrower: string
  collateral_asset: string
  amount_to_liquidate: number
  min_out: number
  deadline: string
  status: "pending" | "executed" | "failed"
  created_at: string
}

export default function LiquidationsPage() {
  const { connected, publicKey } = useWallet()
  const [intents, setIntents] = useState<LiquidationIntent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (connected && publicKey) {
      fetchLiquidations()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  const fetchLiquidations = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/liquidations?wallet=${publicKey}`)
      const data = await res.json()
      setIntents(data.intents || [])
    } catch (error) {
      console.error("Failed to fetch liquidations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl p-12 max-w-md text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your Stellar wallet to view liquidation intents for your positions.
          </p>
        </motion.div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "executed":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "executed":
        return "bg-success/10 text-success"
      case "failed":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-yellow-500/10 text-yellow-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Liquidation Manager</h1>
          <p className="text-muted-foreground mt-2">Monitor soft-liquidation intents and execution status.</p>
        </div>
        <Button onClick={fetchLiquidations} variant="outline" className="gap-2 bg-transparent">
          <AlertTriangle className="h-4 w-4" />
          Check Health
        </Button>
      </div>

      {/* Alert Banner */}
      {intents.filter((i) => i.status === "pending").length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-4 border-2 border-yellow-500/30"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium">Pending Liquidations</p>
              <p className="text-sm text-muted-foreground">
                {intents.filter((i) => i.status === "pending").length} position(s) require liquidation execution
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Liquidation Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left text-sm font-medium">Position ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Borrower</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Asset</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Min Out</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Deadline</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    Loading liquidations...
                  </td>
                </tr>
              ) : intents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No liquidation intents. All positions are healthy.
                  </td>
                </tr>
              ) : (
                intents.map((intent, index) => (
                  <motion.tr
                    key={intent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{intent.position_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{intent.borrower.slice(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{intent.collateral_asset}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono">{intent.amount_to_liquidate.toFixed(4)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-muted-foreground">${intent.min_out.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(intent.deadline).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(intent.status)}`}
                      >
                        {getStatusIcon(intent.status)}
                        {intent.status.charAt(0).toUpperCase() + intent.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {intent.status === "pending" && (
                        <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                          Execute
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
