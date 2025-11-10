"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowRight, Shield, Zap, CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { CONTRACTS } from "@/lib/soroban/constants"
import { scaffoldClient } from "@/lib/soroban/scaffold-client"
import { hashKeccak256 } from "@/lib/utils"

const ASSETS = [
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    price: 0.42,
    maxLTV: 50,
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/512-IPxhI79CPXHRY7pyzfpzvOX7tfl8f2.png",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 95000,
    maxLTV: 70,
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Bitcoin.svg%20%281%29-rtTEQeg8dzEsSiPC2OQTzX0Nww6gly.webp",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    price: 1.0,
    maxLTV: 80,
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/USD_Coin_logo_%28cropped%29-rWtia6AhuOWCyDdD5afreKnmDMh2Ye.png",
  },
]

export default function BorrowPage() {
  const { connected, publicKey, walletType } = useWallet()
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0])
  const [collateralAmount, setCollateralAmount] = useState("")
  const [ltvRatio, setLtvRatio] = useState(50)
  const [loading, setLoading] = useState(false)
  const [txDetails, setTxDetails] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)


  // Initialize scaffold client when wallet connects
  useEffect(() => {
    if (connected && publicKey && walletType) {
      scaffoldClient.setWallet(walletType, publicKey)
    }
  }, [connected, publicKey, walletType])

  const collateralNum = Number(collateralAmount) || 0
  const collateralValue = collateralNum * selectedAsset.price
  const maxBorrowable = (collateralValue * selectedAsset.maxLTV) / 100
  const borrowAmount = (collateralValue * ltvRatio) / 100
  const interestRate = ltvRatio > 60 ? 8 : ltvRatio > 40 ? 6.5 : 5.2
  const healthFactor = collateralValue / (borrowAmount || 1)
  const liquidationPrice = borrowAmount / (collateralNum * (selectedAsset.maxLTV / 100)) || 0

    const handleBorrow = async () => {
    console.log("[v0] Borrow button clicked")

    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!walletType) {
      toast({
        title: "Wallet Error",
        description: "Wallet type not detected. Please reconnect your wallet.",
        variant: "destructive",
      })
      return
    }

    if (collateralNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid collateral amount",
        variant: "destructive",
      })
      return
    }

    if (borrowAmount <= 0) {
      toast({
        title: "Invalid Borrow Amount",
        description: "Borrow amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      toast({
        title: "Confirm Transaction",
        description: `Create loan for ${collateralNum} ${selectedAsset.symbol} collateral to borrow ${borrowAmount.toFixed(2)} USDC?`,
        action: (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => resolve(false)}>Cancel</Button>
            <Button size="sm" onClick={() => resolve(true)}>Confirm</Button>
          </div>
        ),
      })
    })

    if (!confirmed) {
      return
    }

    setLoading(true)
    setShowSuccess(false)

    // Initialize scaffold client just in case
    if (walletType && publicKey) {
      scaffoldClient.setWallet(walletType, publicKey)
    }    try {
      // Step 1: Create position record and receive position id + transaction XDR from server
      console.log("[v0] Step 1: Creating position record on server and getting transaction XDR")
      toast({
        title: "Creating Loan Position",
        description: "Please wait while we prepare your transaction...",
      })

      const createResponse = await fetch("/api/positions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_stellar: publicKey,
          collateral_asset: selectedAsset.symbol,
          collateral_amount: collateralNum,
          borrow_asset: "USDC",
          borrow_amount: borrowAmount,
        }),
      })

      const createData = await createResponse.json()
      if (!createResponse.ok || !createData.success) {
        throw new Error(createData.error || "Failed to create position on server")
      }

      const positionId = createData.position.position_id
      const collateralRef = createData.position.vault_id || `vault_${selectedAsset.symbol}_${Date.now()}`

      // Step 2: Ask wallet to sign and submit the open_position transaction
      console.log("[v0] Step 2: Requesting wallet signature via scaffoldClient")
      toast({
        title: "Sign Transaction",
        description: "Please check your wallet and sign the transaction...",
      })

      const { hash: txHash } = await scaffoldClient.openPosition(positionId, collateralRef, selectedAsset.symbol)

      // Step 3: Show success and confirm transaction in DB
      toast({
        title: "Transaction Submitted",
        description: "Your loan position is being created on-chain...",
      })

      // Step 4: Update position status in DB
      try {
        await fetch("/api/positions/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position_id: positionId, tx_hash: txHash }),
        })
      } catch (e) {
        console.warn("[v0] Failed to confirm position in DB after on-chain tx", e)
      }

      setTxDetails({
        positionId,
        collateral: `${collateralNum} ${selectedAsset.symbol}`,
        borrowed: `${borrowAmount.toFixed(2)} USDC`,
        ltv: `${ltvRatio}%`,
        healthFactor: healthFactor.toFixed(2),
        interestRate: `${interestRate}%`,
        timestamp: new Date().toLocaleString(),
        txHash,
      })
      setShowSuccess(true)

      toast({
        title: "Loan Created Successfully! 🎉",
        description: `Transaction confirmed: ${txHash.substring(0, 8)}...`,
      })

      setTimeout(() => {
        router.push("/dashboard/positions")
        router.refresh()
      }, 3000)
    } catch (error: any) {
      console.error("[v0] Failed to create loan:", error)
      toast({
        title: "Failed to Create Loan",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess && txDetails) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="glass-strong p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">Loan Created Successfully!</h2>
          <p className="text-muted-foreground mb-8">Your loan has been created on the Stellar blockchain</p>

          <div className="glass rounded-xl p-6 space-y-4 text-left">
            <h3 className="text-lg font-bold mb-4">Transaction Details</h3>

            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-muted-foreground">Position ID</span>
              <span className="font-mono text-sm">{txDetails.positionId}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-muted-foreground">Collateral</span>
              <span className="font-bold">{txDetails.collateral}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-muted-foreground">Borrowed</span>
              <span className="font-bold text-green-500">{txDetails.borrowed}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-muted-foreground">LTV Ratio</span>
              <span className="font-bold">{txDetails.ltv}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-muted-foreground">Health Factor</span>
              <span className="font-bold text-green-500">{txDetails.healthFactor}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-muted-foreground">Interest Rate</span>
              <span className="font-bold">{txDetails.interestRate} APY</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Timestamp</span>
              <span className="text-sm">{txDetails.timestamp}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Transaction</span>
              <span className="font-mono text-sm">
                {txDetails.txHash ? (
                  <a
                    href={`https://explorer.stellar.org/transactions/${txDetails.txHash}${process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' ? '' : '?network=test'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {txDetails.txHash.substring(0, 8)}...{txDetails.txHash.substring(txDetails.txHash.length - 6)}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-6">Redirecting to your positions in 3 seconds...</p>
        </Card>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="glass-strong p-12 max-w-md text-center">
          <Shield className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Connect your wallet to start borrowing against your crypto assets.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold">Borrow Against Your Crypto</h1>
        <p className="text-muted-foreground mt-2">Get instant liquidity without selling your assets</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Collateral Setup */}
        <Card className="glass-strong p-6">
          <h3 className="text-xl font-bold mb-6">Setup Collateral</h3>

          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Select Asset</Label>
              <div className="grid grid-cols-2 gap-3">
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
                    <div className="font-bold">{asset.symbol}</div>
                    <div className="text-sm text-muted-foreground">${asset.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Collateral Amount</Label>
              <Input
                type="text"
                value={collateralAmount}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setCollateralAmount(value)
                  }
                }}
                placeholder="0"
              />
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
              />
              <p className="text-xs text-muted-foreground mt-2">Max LTV: {selectedAsset.maxLTV}%</p>
            </div>
          </div>
        </Card>

        {/* Right: Loan Details */}
        <Card className="glass-strong p-6">
          <h3 className="text-xl font-bold mb-6">Loan Details</h3>

          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <div className="text-sm text-muted-foreground mb-1">You will receive</div>
              <div className="text-3xl font-bold">${borrowAmount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">USDC</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Interest</span>
                </div>
                <div className="text-xl font-bold">{interestRate}%</div>
                <div className="text-xs text-muted-foreground">APY</div>
              </div>

              <div className="glass rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Health</span>
                </div>
                <div className="text-xl font-bold">{healthFactor.toFixed(2)}</div>
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

            <Button
              onClick={handleBorrow}
              disabled={loading || collateralNum <= 0}
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Loan...
                </>
              ) : (
                <>
                  Borrow Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {!loading && (
              <p className="text-xs text-center text-muted-foreground">
                Clicking "Borrow Now" will create your loan instantly
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
