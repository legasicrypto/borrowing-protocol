"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/lib/context/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { TrendingUp, RefreshCw } from "lucide-react"

interface Price {
  asset: string
  price: number
  round_id: number
  timestamp: string
}

export default function PricesManagementPage() {
  const { connected, publicKey } = useWallet()
  const { toast } = useToast()
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState("BTC")
  const [newPrice, setNewPrice] = useState("")

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/prices")
      const data = await response.json()
      if (data.prices) {
        setPrices(data.prices)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch prices:", error)
    }
  }

  const handleUpdatePrice = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    if (!newPrice || Number(newPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/management/prices/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: selectedAsset,
          price: newPrice,
          admin_address: publicKey,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Price Updated",
          description: `${selectedAsset} price updated to $${newPrice}`,
        })
        setNewPrice("")
        fetchPrices()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update price",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Price Management</h1>
          <p className="text-muted-foreground">Update oracle prices for assets</p>
        </div>
        <Button onClick={fetchPrices} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Update Price Form */}
        <Card className="glass-strong p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Update Price
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Asset</Label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full mt-2 p-2 rounded-lg bg-background border border-white/10"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="XLM">Stellar (XLM)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>

            <div>
              <Label>New Price (USD)</Label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter price"
                className="mt-2"
                step="0.01"
              />
            </div>

            <Button onClick={handleUpdatePrice} disabled={loading || !connected} className="w-full">
              {loading ? "Updating..." : "Update Price On-Chain"}
            </Button>
          </div>
        </Card>

        {/* Current Prices */}
        <Card className="glass-strong p-6">
          <h3 className="text-xl font-bold mb-6">Current Prices</h3>

          <div className="space-y-3">
            {prices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No prices available</p>
            ) : (
              prices.slice(0, 10).map((price, idx) => (
                <div key={idx} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{price.asset}</div>
                      <div className="text-xs text-muted-foreground">Round #{price.round_id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${Number(price.price).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(price.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
