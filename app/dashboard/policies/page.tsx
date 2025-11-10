"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

interface PolicyParams {
  asset: string
  max_ltv: number
  liquidation_threshold: number
  liquidation_penalty: number
  interest_rate_base: number
  interest_rate_slope: number
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyParams[]>([
    {
      asset: "BTC",
      max_ltv: 65,
      liquidation_threshold: 75,
      liquidation_penalty: 5,
      interest_rate_base: 3.5,
      interest_rate_slope: 1.2,
    },
    {
      asset: "USDC",
      max_ltv: 80,
      liquidation_threshold: 85,
      liquidation_penalty: 3,
      interest_rate_base: 2.0,
      interest_rate_slope: 0.8,
    },
  ])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Policies updated successfully!")
    } catch (error) {
      console.error("[v0] Failed to save policies:", error)
    } finally {
      setSaving(false)
    }
  }

  const updatePolicy = (index: number, field: keyof PolicyParams, value: string | number) => {
    const updated = [...policies]
    updated[index] = { ...updated[index], [field]: value }
    setPolicies(updated)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Policy Registry</h1>
          <p className="text-muted-foreground mt-2">
            Configure risk parameters, LTV bands, and interest rate formulas for each asset.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Sync On-Chain
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Policies"}
          </Button>
        </div>
      </div>

      {/* Policy Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {policies.map((policy, index) => (
          <motion.div
            key={policy.asset}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-strong rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">{policy.asset} Policy</h3>
                <p className="text-sm text-muted-foreground">Version 1.0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{policy.asset}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor={`max-ltv-${index}`} className="text-sm">
                  Max LTV (%)
                </Label>
                <Input
                  id={`max-ltv-${index}`}
                  type="number"
                  value={policy.max_ltv}
                  onChange={(e) => updatePolicy(index, "max_ltv", Number.parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`liq-threshold-${index}`} className="text-sm">
                  Liquidation Threshold (%)
                </Label>
                <Input
                  id={`liq-threshold-${index}`}
                  type="number"
                  value={policy.liquidation_threshold}
                  onChange={(e) => updatePolicy(index, "liquidation_threshold", Number.parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`liq-penalty-${index}`} className="text-sm">
                  Liquidation Penalty (%)
                </Label>
                <Input
                  id={`liq-penalty-${index}`}
                  type="number"
                  value={policy.liquidation_penalty}
                  onChange={(e) => updatePolicy(index, "liquidation_penalty", Number.parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`base-rate-${index}`} className="text-sm">
                    Base Rate (%)
                  </Label>
                  <Input
                    id={`base-rate-${index}`}
                    type="number"
                    step="0.1"
                    value={policy.interest_rate_base}
                    onChange={(e) => updatePolicy(index, "interest_rate_base", Number.parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`slope-${index}`} className="text-sm">
                    Rate Slope
                  </Label>
                  <Input
                    id={`slope-${index}`}
                    type="number"
                    step="0.1"
                    value={policy.interest_rate_slope}
                    onChange={(e) => updatePolicy(index, "interest_rate_slope", Number.parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Risk Bands Visualization */}
      <div className="glass-strong rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">LTV Risk Bands</h3>
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.asset}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{policy.asset}</span>
                <span className="text-xs text-muted-foreground">0% → 100% LTV</span>
              </div>
              <div className="relative h-8 rounded-full overflow-hidden bg-muted/30">
                <div
                  className="absolute h-full bg-gradient-to-r from-success to-primary"
                  style={{ width: `${policy.max_ltv}%` }}
                />
                <div
                  className="absolute h-full bg-gradient-to-r from-primary to-destructive"
                  style={{ left: `${policy.max_ltv}%`, width: `${policy.liquidation_threshold - policy.max_ltv}%` }}
                />
                <div
                  className="absolute h-full bg-destructive"
                  style={{ left: `${policy.liquidation_threshold}%`, width: `${100 - policy.liquidation_threshold}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium text-white">
                  <span>Safe</span>
                  <span>Warning</span>
                  <span>Liquidation</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
