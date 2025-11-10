"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { AlertTriangle, TrendingUp, Shield, Zap, Loader2 } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { scaffoldClient } from "@/lib/soroban/scaffold-client"
import { useWallet } from "@/lib/context/wallet-context"
import { hashKeccak256 } from "@/lib/utils"

const ASSETS = [
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    price: 0.42,
    change: 3.15,
    maxLTV: 50,
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/512-IPxhI79CPXHRY7pyzfpzvOX7tfl8f2.png",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 45000,
    change: 1.2,
    maxLTV: 70,
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Bitcoin.svg%20%281%29-rtTEQeg8dzEsSiPC2OQTzX0Nww6gly.webp",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    price: 1.0,
    change: 0.0,
    maxLTV: 80,
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/USD_Coin_logo_%28cropped%29-rWtia6AhuOWCyDdD5afreKnmDMh2Ye.png",
  },
]

const PAYOUT_CURRENCIES = [
  {
    symbol: "USDC",
    name: "USD Coin",
    label: "Payout in USD",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/USD_Coin_logo_%28cropped%29-rWtia6AhuOWCyDdD5afreKnmDMh2Ye.png",
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    label: "Payout in EUR",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/USD_Coin_logo_%28cropped%29-rWtia6AhuOWCyDdD5afreKnmDMh2Ye.png",
  },
]

export default function SimulatorPage() {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0])
  const [collateralAmount, setCollateralAmount] = useState(100)
  const [ltvRatio, setLtvRatio] = useState(40)
  const [borrowAmount, setBorrowAmount] = useState(0)
  const [payoutCurrency, setPayoutCurrency] = useState(PAYOUT_CURRENCIES[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { connected, publicKey, walletType } = useWallet()

  useEffect(() => {
    if (connected && publicKey && walletType) {
      scaffoldClient.setWallet(walletType, publicKey)
    }
  }, [connected, publicKey, walletType])

  const handleBorrow = async () => {
    if (!collateralAmount || !borrowAmount) {
      toast({
        title: "Error",
        description: "Please enter collateral and borrow amounts",
        variant: "destructive",
      })
      return
    }

    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect a Stellar wallet to perform on-chain transactions",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const collateralRef = hashKeccak256(Date.now().toString())
      const positionId = `pos_${Date.now().toString().slice(-8)}`

      // Open position using scaffoldClient which builds the transaction server-side,
      // asks the wallet to sign it and submits to the network.
      const txHash = await scaffoldClient.openPosition(positionId, collateralRef, selectedAsset.symbol)

      toast({
        title: "Success!",
        description: `Position created — tx ${txHash}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process transaction",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const collateralValue = collateralAmount * selectedAsset.price
  const maxBorrowable = (collateralValue * selectedAsset.maxLTV) / 100
  const interestRate = ltvRatio > 60 ? 8 : ltvRatio > 40 ? 6.5 : 5.2
  const healthFactor = collateralValue / (borrowAmount || 1)
  const liquidationPrice = borrowAmount / (collateralAmount * (selectedAsset.maxLTV / 100))

  useEffect(() => {
    const calculatedBorrow = (collateralValue * ltvRatio) / 100
    setBorrowAmount(Math.min(calculatedBorrow, maxBorrowable))
  }, [collateralAmount, ltvRatio, collateralValue, maxBorrowable])

  const getRiskLevel = () => {
    if (ltvRatio < 30) return { text: "Low Risk", color: "text-green-500", bg: "bg-green-500/10" }
    if (ltvRatio < 50) return { text: "Medium Risk", color: "text-yellow-500", bg: "bg-yellow-500/10" }
    return { text: "High Risk", color: "text-red-500", bg: "bg-red-500/10" }
  }

  const risk = getRiskLevel()

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-5xl font-bold font-[family-name:var(--font-manrope)] mb-4">Simulate Your Loan</h1>
          <p className="text-xl text-muted-foreground">Simulate your loan in real-time</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Card className="glass-strong p-6">
              <Label className="text-lg font-bold mb-4 block">Select Collateral</Label>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {ASSETS.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedAsset.symbol === asset.symbol
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Image
                      src={asset.icon || "/placeholder.svg"}
                      alt={asset.name}
                      width={40}
                      height={40}
                      className="mx-auto mb-2"
                    />
                    <div className="text-sm font-bold">{asset.symbol}</div>
                    <div className="text-xs text-muted-foreground">${asset.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>

              <div className="glass rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Price:</span>
                  <div className="text-right">
                    <div className="font-bold">${selectedAsset.price.toLocaleString()}</div>
                    <div className="text-xs text-green-500">+{selectedAsset.change}%</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Collateral Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(Number(e.target.value))}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={() => setCollateralAmount(1000)}>
                      Max
                    </Button>
                    <span className="flex items-center px-3 glass rounded-lg">{selectedAsset.symbol}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">≈ ${collateralValue.toLocaleString()}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>LTV Ratio</Label>
                    <span className="text-sm font-bold">{ltvRatio}%</span>
                  </div>
                  <Slider
                    value={[ltvRatio]}
                    onValueChange={([value]) => setLtvRatio(value)}
                    max={selectedAsset.maxLTV}
                    step={1}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedAsset.symbol} Max: {selectedAsset.maxLTV}%
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">Amount to Borrow</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={borrowAmount.toFixed(0)}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setBorrowAmount(Math.min(val, maxBorrowable))
                      }}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={() => setBorrowAmount(maxBorrowable)}>
                      Max
                    </Button>
                  </div>

                  <div className="mt-3 glass rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Your current borrowing risk</span>
                      <span className={`text-xs font-bold ${risk.color}`}>{risk.text}</span>
                    </div>
                    <div className="relative h-2 bg-background rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          ltvRatio < 30 ? "bg-green-500" : ltvRatio < 50 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(borrowAmount / maxBorrowable) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>€0</span>
                      <span className="font-bold">€{borrowAmount.toFixed(0)}</span>
                      <span>€{maxBorrowable.toFixed(0)} max</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Max borrowable: €{maxBorrowable.toFixed(0)}</p>
                </div>
              </div>
            </Card>

            <Card className="glass-strong p-6">
              <Label className="text-lg font-bold mb-4 block">Choose payout currency</Label>
              <div className="grid grid-cols-2 gap-3">
                {PAYOUT_CURRENCIES.map((currency) => (
                  <button
                    key={currency.symbol}
                    onClick={() => setPayoutCurrency(currency)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      payoutCurrency.symbol === currency.symbol
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Image
                      src={currency.icon || "/placeholder.svg"}
                      alt={currency.name}
                      width={32}
                      height={32}
                      className="mx-auto mb-2"
                    />
                    <div className="font-bold mb-1">{currency.symbol}</div>
                    <div className="text-xs text-muted-foreground">{currency.label}</div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Right: Results Section */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Card className="glass-strong p-6">
              <h3 className="text-2xl font-bold mb-6">Loan Summary</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-muted-foreground">You will borrow</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">€{borrowAmount.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">of €{maxBorrowable.toFixed(0)} max</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Interest Rate</span>
                    </div>
                    <div className="text-2xl font-bold">{interestRate}%</div>
                    <div className="text-xs text-muted-foreground">APY</div>
                  </div>

                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Health Factor</span>
                    </div>
                    <div className="text-2xl font-bold">{healthFactor.toFixed(2)}</div>
                    <div className={`text-xs ${healthFactor > 2 ? "text-green-500" : "text-yellow-500"}`}>
                      {healthFactor > 2 ? "Safe" : "Warning"}
                    </div>
                  </div>
                </div>

                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-sm">
                    <div className="flex items-center justify-between">
                      <span>Liquidation Price</span>
                      <span className="font-bold">
                        ${liquidationPrice.toFixed(2)} {selectedAsset.symbol}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              <Button 
                className="w-full mt-6 h-12 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={handleBorrow}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Borrow Now"
                )}
              </Button>
            </Card>

            <Card className="glass-strong p-6">
              <h3 className="text-lg font-bold mb-4">Key Features</h3>
              <div className="space-y-3">
                {[
                  { icon: Zap, text: "Instant approval in seconds" },
                  { icon: Shield, text: "Secure custody with Fireblocks" },
                  { icon: TrendingUp, text: "Competitive rates from 5.2% APY" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 glass rounded-lg p-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground glass rounded-xl p-4">
              <span>Powered by</span>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/502d9b1bbee8c2169cc0eb3d0982ba3bf02ce300-1776x548-ZkZuFs0UmldFjQztQRHaH2TjWuPHFu.avif"
                alt="Stellar"
                width={80}
                height={24}
                className="h-5 w-auto"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
