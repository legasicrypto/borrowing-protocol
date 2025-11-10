"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Key, Database, Bell, CheckCircle2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Network settings state
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet")
  const [rpcUrl, setRpcUrl] = useState("")
  const [horizonUrl, setHorizonUrl] = useState("")

  // Contract addresses state
  const [contracts, setContracts] = useState({
    loans: "",
    liquidation: "",
    policy: "",
    oracle: "",
    kyc: "",
  })

  // Notification settings state
  const [notifications, setNotifications] = useState({
    liquidationAlerts: true,
    priceUpdates: true,
    policyChanges: false,
    vaultActivity: true,
  })

  useEffect(() => {
    const loadedNetwork = (process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toLowerCase() || "testnet") as "testnet" | "mainnet"
    const loadedRpcUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"

    setNetwork(loadedNetwork)
    setRpcUrl(loadedRpcUrl)
    setHorizonUrl(loadedNetwork === "testnet" ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org")

    setContracts({
      loans: process.env.NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT || "",
      liquidation: process.env.NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT || "",
      policy: process.env.NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT || "",
      oracle: process.env.NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT || "",
      kyc: process.env.NEXT_PUBLIC_SOROBAN_KYC_CONTRACT || "",
    })
  }, [])

  const handleNetworkChange = (newNetwork: "testnet" | "mainnet") => {
    setNetwork(newNetwork)
    setSaved(false)

    if (newNetwork === "testnet") {
      setRpcUrl("https://soroban-testnet.stellar.org")
      setHorizonUrl("https://horizon-testnet.stellar.org")
    } else {
      setRpcUrl("https://soroban.stellar.org")
      setHorizonUrl("https://horizon.stellar.org")
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)

    try {
      // Simulate save operation - in production, this would save to a backend
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSaved(true)
      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully.",
      })

      // In production, you would also update env vars or save to database
      console.log("[v0] Settings saved:", {
        network,
        rpcUrl,
        horizonUrl,
        contracts,
        notifications,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure integrations, network settings, and notifications.</p>
      </div>

      {/* Status Indicator */}
      {saved && (
        <div className="glass-strong rounded-xl p-4 flex items-center gap-3 bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <p className="text-sm text-green-500 font-medium">All settings saved successfully</p>
        </div>
      )}

      {/* Stellar Network */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Stellar Network</h2>
            <p className="text-sm text-muted-foreground">Configure Soroban RPC and network settings</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              network === "testnet"
                ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                : "bg-green-500/10 text-green-500 border border-green-500/20"
            }`}
          >
            {network === "testnet" ? "🧪 Testnet Active" : "🚀 Mainnet"}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="network">Network</Label>
            <select
              id="network"
              value={network}
              onChange={(e) => handleNetworkChange(e.target.value as "testnet" | "mainnet")}
              className="w-full mt-1 rounded-lg bg-muted/50 px-3 py-2 text-sm outline-none ring-1 ring-transparent transition-all focus:ring-primary"
            >
              <option value="testnet">Testnet</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </div>

          <div>
            <Label htmlFor="rpc-url">Soroban RPC URL</Label>
            <Input
              id="rpc-url"
              type="text"
              value={rpcUrl}
              onChange={(e) => {
                setRpcUrl(e.target.value)
                setSaved(false)
              }}
              placeholder="https://soroban-testnet.stellar.org"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="horizon-url">Horizon URL</Label>
            <Input
              id="horizon-url"
              type="text"
              value={horizonUrl}
              onChange={(e) => {
                setHorizonUrl(e.target.value)
                setSaved(false)
              }}
              placeholder="https://horizon-testnet.stellar.org"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Contract Addresses</h2>
            <p className="text-sm text-muted-foreground">Deployed Soroban smart contract addresses</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { name: "Loans Contract", key: "loans" as const, env: "NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT" },
            {
              name: "Liquidation Manager",
              key: "liquidation" as const,
              env: "NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT",
            },
            { name: "Policy Registry", key: "policy" as const, env: "NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT" },
            { name: "Price Oracle Adapter", key: "oracle" as const, env: "NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT" },
            { name: "KYC Registry", key: "kyc" as const, env: "NEXT_PUBLIC_SOROBAN_KYC_CONTRACT" },
          ].map((contract) => (
            <div key={contract.key}>
              <Label htmlFor={contract.key} className="flex items-center justify-between">
                <span>{contract.name}</span>
                {contracts[contract.key] && (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </span>
                )}
              </Label>
              <Input
                id={contract.key}
                type="text"
                value={contracts[contract.key]}
                onChange={(e) => {
                  setContracts({ ...contracts, [contract.key]: e.target.value })
                  setSaved(false)
                }}
                placeholder={`C${Array(55).fill("A").join("")}...`}
                className="mt-1 font-mono text-xs"
              />
            </div>
          ))}
        </div>

        {!contracts.loans || !contracts.liquidation || !contracts.policy || !contracts.oracle || !contracts.kyc ? (
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-500">
              Some contract addresses are missing. Deploy contracts or add existing addresses to enable full
              functionality.
            </p>
          </div>
        ) : null}
      </div>

      {/* Notifications */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage alert preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              label: "Liquidation Alerts",
              description: "Get notified when positions approach liquidation",
              key: "liquidationAlerts" as const,
            },
            {
              label: "Price Updates",
              description: "Alerts for significant price movements",
              key: "priceUpdates" as const,
            },
            {
              label: "Policy Changes",
              description: "Notifications when risk parameters are updated",
              key: "policyChanges" as const,
            },
            {
              label: "Vault Activity",
              description: "Fireblocks vault transaction notifications",
              key: "vaultActivity" as const,
            },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{setting.label}</p>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={notifications[setting.key]}
                onCheckedChange={(checked) => {
                  setNotifications({ ...notifications, [setting.key]: checked })
                  setSaved(false)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <Button
        size="lg"
        className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        onClick={handleSaveSettings}
        disabled={loading}
      >
        <Save className="h-5 w-5" />
        {loading ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  )
}
