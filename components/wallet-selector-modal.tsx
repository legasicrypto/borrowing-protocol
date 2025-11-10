"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { WalletType } from "@/lib/stellar/wallet"
import { motion } from "framer-motion"
import { ExternalLink, Wallet } from "lucide-react"
import Image from "next/image"

interface WalletOption {
  id: WalletType
  name: string
  icon: string
  description: string
  downloadUrl: string
}

const ALL_WALLETS: WalletOption[] = [
  {
    id: "freighter",
    name: "Freighter",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f-XYekDjtKaymLDB2Z9tx3TKtHuuRuZf.png",
    description: "Browser extension wallet for Stellar",
    downloadUrl: "https://www.freighter.app/",
  },
  {
    id: "rabet",
    name: "Rabet",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rabet-J746DSlZjHcf3KE99d2A7BGWjaUF4c.png",
    description: "Simple and secure Stellar wallet",
    downloadUrl: "https://rabet.io/",
  },
  {
    id: "xbull",
    name: "xBull",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b-b5H0SwqcQ3kIFhjkyQx14omBqq1vMH.jpg",
    description: "Feature-rich Stellar wallet",
    downloadUrl: "https://xbull.app/",
  },
  {
    id: "albedo",
    name: "Albedo",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/albedo-U62rZL4pChqjqwNY03QBS9QCpWZzY0.png",
    description: "Safe, fast, and open-source",
    downloadUrl: "https://albedo.link/",
  },
]

interface WalletSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWalletSelect: (walletType: WalletType) => Promise<void>
}

export function WalletSelectorModal({ open, onOpenChange, onWalletSelect }: WalletSelectorModalProps) {
  const [availableWallets, setAvailableWallets] = useState<Set<WalletType>>(new Set())
  const [connecting, setConnecting] = useState<WalletType | null>(null)

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const available = new Set<WalletType>()
      if (window.freighter) available.add("freighter")
      if (window.rabet) available.add("rabet")
      if (window.xBullSDK) available.add("xbull")
      if (window.albedo) available.add("albedo")
      setAvailableWallets(available)
    }
  }, [open])

  const handleWalletClick = async (walletType: WalletType) => {
    if (!availableWallets.has(walletType)) {
      return
    }

    setConnecting(walletType)
    try {
      await onWalletSelect(walletType)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Your Stellar Wallet
          </DialogTitle>
          <DialogDescription>Choose a wallet to connect to the Legasi platform</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {ALL_WALLETS.map((wallet) => {
            const isAvailable = availableWallets.has(wallet.id)
            const isConnecting = connecting === wallet.id

            return (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => handleWalletClick(wallet.id)}
                  disabled={!isAvailable || isConnecting}
                  variant="outline"
                  className={`w-full h-auto p-4 justify-start text-left hover:bg-primary/5 ${
                    isAvailable ? "border-primary/30" : "border-muted opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image
                        src={wallet.icon || "/placeholder.svg"}
                        alt={`${wallet.name} logo`}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {wallet.name}
                        {!isAvailable && (
                          <span className="text-xs font-normal text-muted-foreground">(Not installed)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{wallet.description}</div>
                    </div>
                    {isConnecting ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : !isAvailable ? (
                      <a
                        href={wallet.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </Button>
              </motion.div>
            )
          })}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Don't have a wallet? Click the link icon to install one.
        </div>
      </DialogContent>
    </Dialog>
  )
}
