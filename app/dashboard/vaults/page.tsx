"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import { Button } from "@/components/ui/button"
import { RefreshCw, ExternalLink, Shield } from "lucide-react"
import { motion } from "framer-motion"

interface Vault {
  id: string
  vault_id: string
  asset_type: string
  balance: string
  position_id: string
  created_at: string
  last_audit: string
}

export default function VaultsPage() {
  const { connected, publicKey } = useWallet()
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (connected && publicKey) {
      fetchVaults()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  const fetchVaults = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vaults?wallet=${publicKey}`)
      const data = await res.json()
      setVaults(data.vaults || [])
    } catch (error) {
      console.error("Failed to fetch vaults:", error)
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
          <p className="text-muted-foreground">Connect your Stellar wallet to view your Fireblocks custody vaults.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Fireblocks Vaults</h1>
          <p className="text-muted-foreground mt-2">Monitor segregated custody vaults and collateral balances.</p>
        </div>
        <Button
          onClick={fetchVaults}
          disabled={loading}
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Sync Vaults
        </Button>
      </div>

      {/* Vault Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full glass-strong rounded-2xl p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading vaults...</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="col-span-full glass-strong rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">No vaults found. Create your first position to initialize a vault.</p>
          </div>
        ) : (
          vaults.map((vault, index) => (
            <motion.div
              key={vault.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`glass-strong rounded-2xl p-6 border-2 transition-all ${
                vault.asset_type === "BTC"
                  ? "border-orange-500/20 hover:border-orange-500/40"
                  : "border-blue-500/20 hover:border-blue-500/40"
              }`}
            >
              {/* Vault Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                      vault.asset_type === "BTC" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {vault.asset_type}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">{vault.vault_id}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Balance */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold mt-1">
                  {Number.parseFloat(vault.balance).toFixed(8)} {vault.asset_type}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ ${(Number.parseFloat(vault.balance) * (vault.asset_type === "BTC" ? 45000 : 1)).toFixed(2)} USD
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Position ID</span>
                  <span className="font-mono">{vault.position_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Audit</span>
                  <span>{new Date(vault.last_audit).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Total BTC Collateral</h3>
          <p className="text-3xl font-bold gradient-text">
            {vaults
              .filter((v) => v.asset_type === "BTC")
              .reduce((sum, v) => sum + Number.parseFloat(v.balance), 0)
              .toFixed(4)}{" "}
            BTC
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Total USDC Collateral</h3>
          <p className="text-3xl font-bold gradient-text">
            {vaults
              .filter((v) => v.asset_type === "USDC")
              .reduce((sum, v) => sum + Number.parseFloat(v.balance), 0)
              .toFixed(2)}{" "}
            USDC
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Active Vaults</h3>
          <p className="text-3xl font-bold gradient-text">{vaults.length}</p>
        </div>
      </div>
    </div>
  )
}
