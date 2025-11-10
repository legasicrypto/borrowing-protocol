"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/context/wallet-context"
import { Wallet, LogOut } from "lucide-react"
import { motion } from "framer-motion"
import { WalletSelectorModal } from "./wallet-selector-modal"
import type { WalletType } from "@/lib/stellar/wallet"
import { initializeWalletConnection } from "@/lib/stellar/wallet-init"
import { scaffoldClient } from "@/lib/soroban/scaffold-client"

export function WalletConnectButton() {
  const { isConnected, address, disconnect, connect, balances, refreshBalances } = useWallet()
  const [showWalletSelector, setShowWalletSelector] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleOpenSelector = () => {
    console.log("[v0] Opening wallet selector")
    setShowWalletSelector(true)
  }

  const handleWalletSelect = async (walletType: WalletType) => {
    console.log("[v0] Wallet selected:", walletType)
    setIsConnecting(true)
    try {
      const state = await connect(walletType)
      console.log("[v0] Wallet connected successfully")
      setShowWalletSelector(false)
      // Initialize the wallet for transactions
      await initializeWalletConnection(walletType)
      // Ensure scaffold client knows about the connected wallet
      try {
        if (state && state.publicKey) scaffoldClient.setWallet(walletType, state.publicKey)
      } catch (e) {
        console.warn('[v0] Failed to set scaffold client after wallet connect', e)
      }
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  if (isConnected && address) {
    console.log("[v0] Wallet connected, displaying address:", address)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2"
      >
        <div className="glass px-4 py-2 rounded-full text-sm flex items-center gap-3">
          <div>
            <span className="text-muted-foreground">Connected: </span>
            <span className="font-mono text-primary">{address.slice(0, 4)}...{address.slice(-4)}</span>
          </div>
          <div className="text-sm text-muted-foreground">Balance:</div>
          <div className="font-mono">
            {balances && balances.length > 0 ? (
              <span>{balances[0].balance} {balances[0].asset}</span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
          <button
            onClick={() => refreshBalances()}
            title="Refresh balances"
            className="text-xs text-muted-foreground hover:text-primary ml-2"
          >
            Refresh
          </button>
        </div>
        <Button onClick={disconnect} variant="outline" size="icon" className="rounded-full bg-transparent">
          <LogOut className="h-4 w-4" />
        </Button>
      </motion.div>
    )
  }

  return (
    <>
      <Button
        onClick={handleOpenSelector}
        disabled={isConnecting}
        className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>

      <WalletSelectorModal
        open={showWalletSelector}
        onOpenChange={setShowWalletSelector}
        onWalletSelect={handleWalletSelect}
      />
    </>
  )
}
