"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProgressBarLtv } from "@/components/ui/ProgressBarLtv"
import { calculateLoanMetrics } from "@/lib/calculations"
import { useSystemConfig } from "@/hooks/useSystemConfig"
import { toast } from "sonner"
import btcLogo from "@/assets/btc-logo.webp"
import usdcLogo from "@/assets/usdc-logo.png"
import eurcLogo from "@/assets/eurc-logo.png"
import { ConfirmLoanModal } from "./ConfirmLoanModal"

interface CreateLoanModalProps {
  open: boolean
  onClose: () => void
  onCreateLoan: (loan: {
    collateralType: string
    collateralAmount: number
    borrowedEur: number
    borrowCurrency: "USDC" | "EURC"
    autoTopUpEnabled: boolean
  }) => void
  cryptoPrices: Record<string, { price_usd: number; price_eur: number }>
  kycStatus: string | null
}

export function CreateLoanModal({ open, onClose, onCreateLoan, cryptoPrices, kycStatus }: CreateLoanModalProps) {
  const [collateralType, setCollateralType] = useState<string>("BTC")
  const [collateralAmount, setCollateralAmount] = useState<string>("")
  const [borrowAmount, setBorrowAmount] = useState<string>("")
  const [borrowCurrency, setBorrowCurrency] = useState<"USDC" | "EURC">("USDC")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(false)
  const { maxLtvBtc, maxLtvUsdc, liquidationThreshold } = useSystemConfig()
  const MAX_COLLATERAL = 10000

  const maxLtv = collateralType === "BTC" ? maxLtvBtc : maxLtvUsdc

  const getExchangeRate = (): number => {
    const priceData = cryptoPrices[collateralType]
    if (priceData?.price_usd && priceData?.price_eur) {
      return priceData.price_usd / priceData.price_eur
    }
    return 1.1 // Fallback rate
  }

  const eurUsdRate = getExchangeRate()

  const collateralPriceUsd = cryptoPrices[collateralType]?.price_usd || 0
  const collateralValueUsd = Number.parseFloat(collateralAmount || "0") * collateralPriceUsd

  const collateralValue = borrowCurrency === "EURC" ? collateralValueUsd / eurUsdRate : collateralValueUsd

  const borrowValue = Number.parseFloat(borrowAmount || "0")
  const maxBorrowable = collateralValue * (maxLtv / 100)

  const collateralPriceForMetrics =
    borrowCurrency === "EURC"
      ? cryptoPrices[collateralType]?.price_eur || 0
      : cryptoPrices[collateralType]?.price_usd || 0

  const metrics = calculateLoanMetrics(
    Number.parseFloat(collateralAmount || "0"),
    borrowValue,
    collateralPriceForMetrics,
    liquidationThreshold,
  )

  const getHealthColor = () => {
    const utilizationRate = (borrowValue / maxBorrowable) * 100

    if (utilizationRate <= 50) return "text-legasi-green"
    if (utilizationRate <= 75) return "text-yellow-500"
    if (utilizationRate <= 90) return "text-orange-500"
    return "text-red-500"
  }

  const getHealthStatus = () => {
    const utilizationRate = (borrowValue / maxBorrowable) * 100

    if (utilizationRate <= 50) return "Very Healthy"
    if (utilizationRate <= 75) return "Healthy"
    if (utilizationRate <= 90) return "Warning"
    return "At Risk"
  }

  const handleCreate = () => {
    onCreateLoan({
      collateralType,
      collateralAmount: Number.parseFloat(collateralAmount),
      borrowedEur: borrowValue,
      borrowCurrency,
      autoTopUpEnabled,
    })

    setCollateralAmount("")
    setBorrowAmount("")
    setAutoTopUpEnabled(false)
    setShowConfirmation(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Amount to Borrow</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Collateral Type</Label>
            <Select value={collateralType} onValueChange={setCollateralType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">
                  <div className="flex items-center gap-2">
                    <img src={btcLogo || "/placeholder.svg"} alt="BTC" className="w-4 h-4" />
                    <span>Bitcoin (BTC)</span>
                  </div>
                </SelectItem>
                <SelectItem value="USDC">
                  <div className="flex items-center gap-2">
                    <img src={usdcLogo || "/placeholder.svg"} alt="USDC" className="w-4 h-4" />
                    <span>USD Coin (USDC)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stablecoin to borrow</Label>
            <Select value={borrowCurrency} onValueChange={(val) => setBorrowCurrency(val as "USDC" | "EURC")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC">
                  <div className="flex items-center gap-2">
                    <img src={usdcLogo || "/placeholder.svg"} alt="USDC" className="w-4 h-4" />
                    <span>USDC (USD Coin)</span>
                  </div>
                </SelectItem>
                <SelectItem value="EURC">
                  <div className="flex items-center gap-2">
                    <img src={eurcLogo || "/placeholder.svg"} alt="EURC" className="w-4 h-4" />
                    <span>EURC (Euro Coin)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Collateral Amount</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                className="pr-20"
              />
              <button
                onClick={() => setCollateralAmount(MAX_COLLATERAL.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold bg-legasi-orange hover:bg-legasi-orange/80 rounded transition-colors"
              >
                Max
              </button>
            </div>

            <div className="px-1 pt-2">
              <Slider
                value={[Number.parseFloat(collateralAmount || "0")]}
                onValueChange={(value) => setCollateralAmount(value[0].toString())}
                max={MAX_COLLATERAL}
                step={0.01}
                className="w-full"
              />
            </div>

            {collateralValue > 0 && (
              <p className="text-sm text-muted-foreground">
                ≈ {borrowCurrency === "EURC" ? "€" : "$"}
                {collateralValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Amount to Borrow ({borrowCurrency})</Label>
            <div className="relative">
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                className="pr-20"
              />
              <button
                onClick={() => {
                  if (collateralValue > 0) {
                    setBorrowAmount((collateralValue * (maxLtv / 100)).toFixed(2))
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold bg-legasi-orange hover:bg-legasi-orange/80 rounded transition-colors"
                disabled={collateralValue === 0}
              >
                Max
              </button>
            </div>

            {collateralValue > 0 && (
              <div className="px-1 pt-2">
                <Slider
                  value={[Number.parseFloat(borrowAmount || "0")]}
                  onValueChange={(value) => setBorrowAmount(value[0].toString())}
                  max={maxBorrowable}
                  step={1}
                  className="w-full"
                  disabled={collateralValue === 0}
                />
              </div>
            )}

            {collateralValue > 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Max: {(collateralValue * (maxLtv / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                  {borrowCurrency} ({maxLtv}% LTV)
                </p>
              </>
            )}
          </div>

          {borrowValue > 0 && collateralValue > 0 && (
            <div className="bg-legasi-dark/50 rounded-lg p-4 space-y-4">
              <ProgressBarLtv value={metrics.ltvRatio} />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Health Factor</p>
                  <p className={`text-lg font-semibold ${getHealthColor()}`}>{metrics.healthFactor.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{getHealthStatus()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Liquidation Price</p>
                  <p className="text-lg font-semibold">
                    {borrowCurrency === "EURC" ? "€" : "$"}
                    {metrics.liquidationPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {borrowValue > 0 && collateralValue > 0 && (
            <div className="bg-card/50 border border-border/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  <Label htmlFor="auto-top-up" className="text-base font-semibold cursor-pointer">
                    Auto-Top-Up
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${autoTopUpEnabled ? "text-legasi-green" : "text-muted-foreground"}`}
                  >
                    {autoTopUpEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch id="auto-top-up" checked={autoTopUpEnabled} onCheckedChange={setAutoTopUpEnabled} />
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Automatically uses available USDC or EURC in your Legasi wallet to keep your Health Factor above 1.5.
              </p>

              {autoTopUpEnabled && (
                <div className="flex items-center gap-2 bg-legasi-green/10 border border-legasi-green/30 rounded-md px-3 py-2">
                  <div className="h-2 w-2 bg-legasi-green rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-legasi-green">Auto-Top-Up will be active on this loan</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!collateralAmount || !borrowAmount) {
                  toast.error("Please fill in all fields")
                  return
                }
                if (metrics.ltvRatio > maxLtv) {
                  toast.error(`LTV too high. Maximum allowed: ${maxLtv}%`)
                  return
                }
                setShowConfirmation(true)
              }}
              className="flex-1"
            >
              Review Loan
            </Button>
          </div>
        </div>
      </DialogContent>

      <ConfirmLoanModal
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleCreate}
        loanData={{
          collateralType,
          collateralAmount: Number.parseFloat(collateralAmount || "0"),
          borrowAmount: borrowValue,
          collateralValue,
          maxBorrowable,
          metrics,
          cryptoPrices: collateralPriceForMetrics,
          borrowCurrency,
          autoTopUpEnabled,
        }}
      />
    </Dialog>
  )
}
