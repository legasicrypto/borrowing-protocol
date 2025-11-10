"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Check, X } from "lucide-react"
import { motion } from "framer-motion"

interface PriceFeed {
  id: string
  asset_pair: string
  price: number
  source: string
  published_at: string
  approved_by?: string
}

export default function PricesPage() {
  const [prices, setPrices] = useState<PriceFeed[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/prices")
      const data = await res.json()
      setPrices(data.prices || [])
    } catch (error) {
      console.error("[v0] Failed to fetch prices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (priceId: string) => {
    try {
      await fetch("/api/prices/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: priceId, approved_by: "admin" }),
      })
      fetchPrices()
    } catch (error) {
      console.error("[v0] Failed to approve price:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Price Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage oracle price feeds and approve updates to on-chain contracts.
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add Price
        </Button>
      </div>

      {/* Price Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left text-sm font-medium">Asset Pair</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Source</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Loading prices...
                  </td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No price feeds yet. Add your first price feed.
                  </td>
                </tr>
              ) : (
                prices.map((price, index) => (
                  <motion.tr
                    key={price.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium">{price.asset_pair}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono">${Number.parseFloat(price.price.toString()).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{price.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(price.published_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {price.approved_by ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                          <Check className="h-3 w-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-500">
                          <X className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!price.approved_by && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(price.id)}
                          className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        >
                          <Check className="h-3 w-3" />
                          Approve
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
