"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/GlowButton"
import { useRealtimeCryptoPrices } from "@/hooks/useRealtimeCryptoPrices"
import { useCryptoPrices } from "@/hooks/useCryptoPrices"
import { useSystemConfig } from "@/hooks/useSystemConfig"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import btcLogo from "@/assets/btc-logo.webp"
import usdcLogo from "@/assets/usdc-logo.png"
import eurcLogo from "@/assets/eurc-logo.png"

const COLLATERAL_OPTIONS = [
  { symbol: "BTC", name: "Bitcoin", logo: btcLogo, maxAmount: 5000, ltv: 50 },
  { symbol: "USDC", name: "USD Coin", logo: usdcLogo, maxAmount: 500000000, ltv: 90 },
]

const BORROW_OPTIONS = [
  { symbol: "USDC", name: "USD Coin", logo: usdcLogo, currencySymbol: "$" },
  { symbol: "EURC", name: "Euro Coin", logo: eurcLogo, currencySymbol: "€" },
]

export function LoanSimulator() {
  const navigate = useNavigate()
  const { prices: realtimePrices, loading: realtimeLoading } = useRealtimeCryptoPrices()
  const { prices: coingeckoPrices, loading: coingeckoLoading } = useCryptoPrices()
  const { liquidationThreshold, interestRate } = useSystemConfig()
  const eurUsdRate = useExchangeRate(realtimePrices)

  const getPrice = (symbol: string): number => {
    // First try realtime prices from database
    if (realtimePrices[symbol]?.price_usd) {
      return realtimePrices[symbol].price_usd
    }
    // Fallback to CoinGecko API prices
    if (coingeckoPrices[symbol]?.current_price) {
      return coingeckoPrices[symbol].current_price
    }
    // Default fallbacks
    if (symbol === "USDC") return 1
    if (symbol === "BTC") return 95000 // Approximate fallback
    return 0
  }

  const loading = realtimeLoading && coingeckoLoading

  // Step 1: Collateral selection
  const [selectedCollateral, setSelectedCollateral] = useState("BTC")
  const [collateralInput, setCollateralInput] = useState("")

  // Step 2: Borrow selection
  const [selectedBorrow, setSelectedBorrow] = useState("USDC")
  const [borrowInput, setBorrowInput] = useState("")

  // Get current collateral config
  const collateralConfig = COLLATERAL_OPTIONS.find((c) => c.symbol === selectedCollateral)!
  const borrowConfig = BORROW_OPTIONS.find((b) => b.symbol === selectedBorrow)!

  // Parse amounts
  const collateralAmount = Number.parseFloat(collateralInput) || 0
  const borrowAmount = Number.parseFloat(borrowInput) || 0

  const btcPrice = getPrice("BTC")
  const usdcPrice = getPrice("USDC")

  // Get current collateral price based on selection
  const collateralPrice = selectedCollateral === "BTC" ? btcPrice : usdcPrice
  const priceChange =
    realtimePrices[selectedCollateral]?.change_24h ||
    coingeckoPrices[selectedCollateral]?.price_change_percentage_24h ||
    0

  const collateralValueUsd = collateralAmount * collateralPrice
  const collateralValue = selectedBorrow === "EURC" ? collateralValueUsd / eurUsdRate : collateralValueUsd

  const maxBorrowable = useMemo(() => {
    return (collateralValue * collateralConfig.ltv) / 100
  }, [collateralValue, collateralConfig.ltv])

  const monthlyInterest = (borrowAmount * interestRate) / 100 / 12

  // Handlers
  const handleCollateralChange = (value: string) => {
    setCollateralInput(value)
    setBorrowInput("") // Reset borrow when collateral changes
  }

  const handleCollateralSelect = (symbol: string) => {
    setSelectedCollateral(symbol)
    setCollateralInput("")
    setBorrowInput("")
  }

  const handleBorrowSelect = (symbol: string) => {
    setSelectedBorrow(symbol)
    setBorrowInput("")
  }

  const handleBorrowInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty string or any number while typing
    if (value === "" || !isNaN(Number(value))) {
      setBorrowInput(value)
    }
  }

  const handleBorrowBlur = () => {
    const num = Number.parseFloat(borrowInput) || 0
    if (num > maxBorrowable) {
      setBorrowInput(maxBorrowable.toFixed(0))
    } else if (num < 0) {
      setBorrowInput("0")
    }
  }

  const handleSliderChange = (values: number[]) => {
    setBorrowInput(values[0].toFixed(0))
  }

  const handleMaxClick = () => {
    setBorrowInput(maxBorrowable.toFixed(0))
  }

  return (
    <section id="simulator" className="py-12 px-6 bg-legasi-dark">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Loan Simulator</h2>
          <p className="text-xl text-muted-foreground">See how much you can borrow</p>
        </motion.div>

        <Card className="bg-legasi-card border-2 border-legasi-orange/30">
          <CardHeader>
            <CardTitle className="text-xl">Simulate your loan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* STEP 1: Collateral */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-legasi-orange flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold">Select Collateral</h3>
              </div>

              {/* Collateral Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                {COLLATERAL_OPTIONS.map((option) => (
                  <button
                    key={option.symbol}
                    type="button"
                    onClick={() => handleCollateralSelect(option.symbol)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCollateral === option.symbol
                        ? "border-legasi-orange bg-legasi-orange/10"
                        : "border-border hover:border-legasi-orange/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <img src={option.logo || "/placeholder.svg"} alt={option.symbol} className="w-8 h-8" />
                      <div className="text-left">
                        <div className="font-semibold">{option.symbol}</div>
                        <div className="text-xs text-muted-foreground">LTV: {option.ltv}%</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Live Price */}
              {loading ? (
                <div className="flex items-center gap-2 text-sm p-3 bg-background/50 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-muted-foreground">Loading prices...</span>
                </div>
              ) : collateralPrice > 0 ? (
                <div className="flex items-center gap-2 text-sm p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Current {selectedCollateral} Price:</span>
                  <span className="font-bold">${collateralPrice.toLocaleString()}</span>
                  {priceChange !== 0 && (
                    <span className={`flex items-center gap-1 ${priceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(priceChange).toFixed(2)}%
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <span className="text-yellow-500">Price data unavailable - using estimated values</span>
                </div>
              )}

              {/* Collateral Amount Input */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Collateral Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={collateralInput}
                    onChange={(e) => handleCollateralChange(e.target.value)}
                    className="text-xl h-14 pr-20"
                    min={0}
                    max={collateralConfig.maxAmount}
                    step={selectedCollateral === "BTC" ? 0.01 : 1}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    {selectedCollateral}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span>≈ ${collateralValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* STEP 2: Borrow - Only visible when collateral > 0 */}
            {collateralAmount > 0 && (
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-legasi-orange flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <h3 className="text-lg font-semibold">Amount to Borrow</h3>
                </div>

                {/* Stablecoin Selection */}
                <div className="grid grid-cols-2 gap-3">
                  {BORROW_OPTIONS.map((option) => (
                    <button
                      key={option.symbol}
                      type="button"
                      onClick={() => handleBorrowSelect(option.symbol)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedBorrow === option.symbol
                          ? "border-legasi-orange bg-legasi-orange/10"
                          : "border-border hover:border-legasi-orange/50"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <img src={option.logo || "/placeholder.svg"} alt={option.symbol} className="w-8 h-8" />
                        <div className="text-left">
                          <div className="font-semibold">{option.symbol}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.symbol === "USDC" ? "US Dollar" : "Euro"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Borrow Amount Input */}
                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground">Borrow Amount</label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={borrowInput}
                      onChange={handleBorrowInputChange}
                      onBlur={handleBorrowBlur}
                      className="text-xl h-14 pr-32"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleMaxClick}
                        className="h-8 px-3 text-xs font-semibold bg-legasi-orange/20 hover:bg-legasi-orange/30 text-legasi-orange border-legasi-orange/30"
                      >
                        MAX
                      </Button>
                      <span className="text-muted-foreground font-medium">{selectedBorrow}</span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="pt-2 pb-1">
                    <Slider
                      value={[Math.min(borrowAmount, maxBorrowable)]}
                      onValueChange={handleSliderChange}
                      min={0}
                      max={maxBorrowable > 0 ? maxBorrowable : 100}
                      step={Math.max(1, Math.floor(maxBorrowable / 100))}
                      disabled={maxBorrowable <= 0}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{borrowConfig.currencySymbol}0</span>
                    <span>
                      Max: {borrowConfig.currencySymbol}
                      {maxBorrowable.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Results - Only visible when borrowAmount > 0 */}
            {borrowAmount > 0 && (
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-legasi-orange flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <h3 className="text-lg font-semibold">Loan Summary</h3>
                </div>

                {/* Main loan info */}
                <div className="p-5 bg-background/50 rounded-xl border border-legasi-orange/20">
                  <div className="text-sm text-muted-foreground mb-2">You Borrow</div>
                  <div className="text-3xl font-bold text-legasi-orange">
                    {borrowConfig.currencySymbol}
                    {borrowAmount.toLocaleString()}
                    <span className="text-lg font-normal text-muted-foreground ml-2">{selectedBorrow}</span>
                  </div>
                </div>

                {/* Interest details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-background/50 rounded-xl">
                    <div className="text-xs text-muted-foreground mb-1">Interest Rate</div>
                    <div className="text-xl font-bold">
                      {interestRate}%<span className="text-sm font-normal text-muted-foreground ml-1">APY</span>
                    </div>
                  </div>
                  <div className="p-4 bg-background/50 rounded-xl">
                    <div className="text-xs text-muted-foreground mb-1">Monthly Interests</div>
                    <div className="text-xl font-bold">
                      {borrowConfig.currencySymbol}
                      {monthlyInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Collateral summary */}
                <div className="p-4 bg-background/30 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-2">Collateral Locked</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={collateralConfig.logo || "/placeholder.svg"}
                        alt={selectedCollateral}
                        className="w-6 h-6"
                      />
                      <span className="font-semibold">
                        {collateralAmount.toLocaleString()} {selectedCollateral}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      ≈ ${collateralValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <GlowButton className="w-full h-14 text-lg" onClick={() => navigate("/auth")}>
              Start Borrowing
            </GlowButton>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
