"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { scaffoldClient } from "@/lib/soroban/scaffold-client"

export default function TestTransactionPage() {
  const { isConnected, publicKey, walletType, connect } = useWallet()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null)
  const [positionId, setPositionId] = useState("")
  const [collateralRef, setCollateralRef] = useState("")
  const [asset, setAsset] = useState("USDC")

  // Initialize scaffold client when wallet connects
  useEffect(() => {
    if (isConnected && publicKey && walletType) {
      scaffoldClient.setWallet(walletType, publicKey)
    }
  }, [isConnected, publicKey, walletType])

  const handleOpenPosition = async () => {
    if (!isConnected || !publicKey) {
      setResult({ success: false, message: "Please connect your wallet first" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Generate a unique position ID if not provided
      const finalPositionId = positionId.trim() || `test_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const finalCollateralRef = collateralRef.trim() || `collateral_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const finalAsset = asset.trim() || "USDC"

      console.log("[Test] Opening position:", { finalPositionId, finalCollateralRef, finalAsset, publicKey })

      const txHash = await scaffoldClient.openPosition(finalPositionId, finalCollateralRef, finalAsset)

      setResult({
        success: true,
        message: "Transaction submitted successfully!",
        txHash,
      })

      console.log("[Test] Transaction hash:", txHash)
    } catch (error: any) {
      console.error("[Test] Transaction failed:", error)
      setResult({
        success: false,
        message: error.message || "Transaction failed. Please check the console for details.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestQuery = async () => {
    if (!isConnected || !publicKey) {
      setResult({ success: false, message: "Please connect your wallet first" })
      return
    }

    if (!positionId) {
      setResult({ success: false, message: "Please enter a position ID" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      console.log("[Test] Querying position:", positionId)
      const position = await scaffoldClient.getPosition(positionId)
      console.log("[Test] Position data:", position)
      setResult({
        success: true,
        message: `Position found: ${JSON.stringify(position, null, 2)}`,
      })
    } catch (error: any) {
      console.error("[Test] Query failed:", error)
      setResult({
        success: false,
        message: error.message || "Query failed. Position may not exist.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Test Soroban Transactions</h1>
          <p className="text-muted-foreground">
            Test your Soroban smart contract transactions with your connected wallet
          </p>
        </div>

        {!isConnected ? (
          <Alert>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Please connect your wallet to test transactions</span>
                <Button onClick={() => connect()} variant="outline">
                  Connect Wallet
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Wallet connected: {publicKey?.substring(0, 8)}...{publicKey?.substring(publicKey.length - 8)}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="positionId">Position ID</Label>
            <Input
              id="positionId"
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              placeholder="Enter position ID (or leave empty for auto-generated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collateralRef">Collateral Reference</Label>
            <Input
              id="collateralRef"
              value={collateralRef}
              onChange={(e) => setCollateralRef(e.target.value)}
              placeholder="Enter collateral reference (or leave empty for auto-generated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset">Asset Symbol</Label>
            <Input
              id="asset"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              placeholder="USDC"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleOpenPosition}
            disabled={loading || !isConnected}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Open Position (Transaction)"
            )}
          </Button>

          <Button
            onClick={handleTestQuery}
            disabled={loading || !isConnected}
            variant="outline"
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Querying...
              </>
            ) : (
              "Query Position (Read)"
            )}
          </Button>
        </div>

        {result && (
          <Alert className={result.success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className={result.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
              <div className="space-y-2">
                <p>{result.message}</p>
                {result.txHash && (
                  <div>
                    <p className="font-mono text-xs break-all">
                      TX Hash: {result.txHash}
                    </p>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm mt-1 inline-block"
                    >
                      View on Stellar Expert →
                    </a>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Make sure you have a Stellar wallet installed (Freighter, Rabet, xBull, or Albedo)</li>
            <li>Connect your wallet using the button above</li>
            <li>Fill in the position details (or leave empty for auto-generated values)</li>
            <li>Click "Open Position" to submit a transaction to the Soroban contract</li>
            <li>Approve the transaction in your wallet</li>
            <li>Wait for the transaction to be confirmed on-chain</li>
            <li>Use "Query Position" to read position data from the contract</li>
          </ol>
        </div>
      </Card>
    </div>
  )
}

