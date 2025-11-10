"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import { MetricCard } from "@/components/metric-card"
import { DollarSign, TrendingUp, AlertCircle, Shield } from "lucide-react"
import { Card } from "@/components/ui/card"

interface DashboardStats {
  totalCollateral: number
  activeLoans: number
  avgLTV: number
  pendingLiquidations: number
}

export default function OverviewPage() {
  const { connected, publicKey } = useWallet()
  const [stats, setStats] = useState<DashboardStats>({
    totalCollateral: 0,
    activeLoans: 0,
    avgLTV: 0,
    pendingLiquidations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (connected && publicKey) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  const fetchStats = async () => {
    try {
      console.log("[v0] Fetching dashboard stats...")

      // Fetch positions
      const posRes = await fetch(`/api/positions?wallet=${publicKey}`)
      const posData = await posRes.json()
      const positions = posData.positions || []

      const activePositions = positions.filter((p: any) => p.status === "active" || p.status === "open")

      const totalCollateral = activePositions.reduce(
        (sum: number, p: any) => sum + (Number(p.collateral_amount) || 0),
        0,
      )

      const avgLTV =
        activePositions.length > 0
          ? activePositions.reduce((sum: number, p: any) => sum + Number(p.ltv), 0) / activePositions.length
          : 0

      // Fetch liquidations
      const liqRes = await fetch("/api/liquidations")
      const liqData = await liqRes.json()

      setStats({
        totalCollateral,
        activeLoans: activePositions.length,
        avgLTV,
        pendingLiquidations: (liqData.intents || []).filter((i: any) => i.status === "pending").length,
      })
    } catch (error) {
      console.error("[v0] Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="glass-strong p-12 max-w-md text-center">
          <Shield className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Connect your Stellar wallet to access the Legasi dashboard</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Track liquidity, monitor LTVs, and manage Legasi credit flows</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Collateral"
          value={`${stats.totalCollateral.toFixed(4)} BTC`}
          change={`≈ $${(stats.totalCollateral * 95000).toFixed(2)}`}
          icon={DollarSign}
          gradient="from-violet-500 to-cyan-400"
        />
        <MetricCard
          title="Active Loans"
          value={stats.activeLoans.toString()}
          icon={TrendingUp}
          gradient="from-cyan-400 to-blue-500"
        />
        <MetricCard
          title="Average LTV"
          value={`${stats.avgLTV.toFixed(1)}%`}
          icon={Shield}
          gradient="from-teal-400 to-emerald-500"
        />
        <MetricCard
          title="Pending Liquidations"
          value={stats.pendingLiquidations.toString()}
          icon={AlertCircle}
          gradient="from-rose-400 to-pink-500"
        />
      </div>
    </div>
  )
}
