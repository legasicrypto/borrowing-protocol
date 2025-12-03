"use client"

import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react"
import { useAppKitProvider } from "@reown/appkit/react"
import type { Provider } from "@reown/appkit-adapter-solana/react"
import { useCallback } from "react"

export function useWallet() {
  const { open } = useAppKit()
  const { address, isConnected, caipAddress } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { walletProvider } = useAppKitProvider<Provider>("solana")

  const connect = useCallback(async () => {
    await open()
  }, [open])

  const signMessage = useCallback(
    async (message: string): Promise<{ signature: Uint8Array; publicKey: string }> => {
      if (!walletProvider || !address) {
        throw new Error("Wallet not connected")
      }

      const encodedMessage = new TextEncoder().encode(message)
      const signature = await walletProvider.signMessage(encodedMessage)

      return {
        signature,
        publicKey: address,
      }
    },
    [walletProvider, address],
  )

  return {
    address,
    isConnected,
    caipAddress,
    connect,
    disconnect,
    signMessage,
    walletProvider,
  }
}
