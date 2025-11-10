"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import { MetricCard } from "@/components/metric-card"
import { DollarSign, TrendingUp, AlertCircle, Shield } from "lucide-react"
import { motion } from "framer-motion"

interface Position {
  id: string
  position_id: string
  collateral_asset: string
  collateral_amount: number
  borrowed_asset: string
  principal: number
  ltv: number
  status: string
}

export default function DashboardPage() {
  const { connected, publicKey } = useWallet()
  const [positions, setPositions] = useState<Position[]>([])
  const [liquidationIntents, setLiquidationIntents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (connected && publicKey) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  const fetchDashboardData = async () => {
    try {
      console.log("[v0] Fetching dashboard data for:", publicKey)

      const posRes = await fetch(`/api/positions?wallet=${publicKey}`)
      const posData = await posRes.json()
      console.log("[v0] Dashboard positions:", posData)
      setPositions(posData.positions || [])

      const liqRes = await fetch("/api/liquidations")
      const liqData = await liqRes.json()
      setLiquidationIntents(liqData.liquidations || [])
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const activeLoans = positions.filter((p) => p.status === "active" || p.status === "open").length
  const totalBorrowed = positions
    .filter((p) => p.status === "active" || p.status === "open")
    .reduce((sum, p) => sum + Number(p.principal), 0)
  const totalCollateralValue = positions
    .filter((p) => p.status === "active" || p.status === "open")
    .reduce((sum, p) => {
      const price = p.collateral_asset === "BTC" ? 95000 : p.collateral_asset === "XLM" ? 0.42 : 1
      return sum + Number(p.collateral_amount) * price
    }, 0)
  const avgLTV =
    positions.length > 0 ? positions.reduce((sum, p) => sum + Number(p.ltv) * 100, 0) / positions.length : 0

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
          <p className="text-muted-foreground mb-6">
            Connect your Stellar wallet to access the Legasi dashboard and manage your positions.
          </p>
          <p className="text-sm text-muted-foreground">Click "Connect Wallet" in the navigation bar to get started.</p>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Track liquidity, monitor LTVs, and manage Legasi credit flows.</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Collateral"
          value={`$${totalCollateralValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={
            activeLoans > 0 ? `${activeLoans} active position${activeLoans !== 1 ? "s" : ""}` : "No active positions"
          }
          icon={DollarSign}
          gradient="from-violet-500 to-cyan-400"
        />
        <MetricCard
          title="Active Loans"
          value={activeLoans.toString()}
          icon={TrendingUp}
          gradient="from-cyan-400 to-blue-500"
        />
        <MetricCard
          title="Average LTV"
          value={`${avgLTV.toFixed(1)}%`}
          icon={Shield}
          gradient="from-teal-400 to-emerald-500"
        />
        <MetricCard
          title="Total Borrowed"
          value={`$${totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={AlertCircle}
          gradient="from-rose-400 to-pink-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Recent Positions</h2>
        {positions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No positions yet. Create your first loan to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {positions.slice(0, 5).map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between rounded-lg bg-background/50 p-4 hover:bg-background/80 transition-colors"
              >
                <div>
                  <p className="font-medium">{position.position_id}</p>
                  <p className="text-sm text-muted-foreground">
                    {position.collateral_asset} → {position.borrowed_asset}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {Number(position.collateral_amount).toFixed(4)} {position.collateral_asset}
                  </p>
                  <p className={`text-sm ${Number(position.ltv) * 100 > 70 ? "text-destructive" : "text-success"}`}>
                    LTV: {(Number(position.ltv) * 100).toFixed(1)}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
