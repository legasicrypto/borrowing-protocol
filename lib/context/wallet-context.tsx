"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { scaffoldClient } from "@/lib/soroban/scaffold-client"
import { stellarWallet, type WalletState, type WalletType } from "@/lib/stellar/wallet"

interface WalletContextType extends WalletState {
  connect: (walletType?: WalletType) => Promise<any>
  disconnect: () => Promise<void>
  loading: boolean
  isConnected: boolean
  address: string | null
  balances: Array<{ asset: string; balance: string }>
  refreshBalances: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    network: null,
    networkPassphrase: null,
  })
  const [balances, setBalances] = useState<Array<{ asset: string; balance: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log("[v0] WalletProvider mounted, checking connection")
    checkConnection()
    
    // Refresh balances on mount and when wallet connects
    if (wallet.connected && wallet.publicKey) {
      fetchBalances(wallet.publicKey).catch((e) => console.warn('[v0] refreshBalances failed', e))
    }
  }, [wallet.connected, wallet.publicKey])

  useEffect(() => {
    console.log("[v0] Wallet state updated:", wallet)
  }, [wallet])

  const checkConnection = async () => {
    try {
      console.log("[v0] Checking existing wallet connection")
      const publicKey = await stellarWallet.getPublicKey()
      if (publicKey) {
        console.log("[v0] Found existing connection:", publicKey)
        setWallet({
          connected: true,
          publicKey,
          network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
          networkPassphrase: null,
        })
        // fetch balances for connected account
        try {
          await fetchBalances(publicKey)
        } catch (e) {
          console.warn("[v0] Failed to fetch balances during init", e)
        }
      } else {
        console.log("[v0] No existing connection found")
      }
    } catch (error) {
      console.error("[v0] Failed to check wallet connection:", error)
    }
  }

  const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
    (process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org')

  const fetchBalances = async (publicKey: string) => {
    try {
      const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`)
      if (!res.ok) throw new Error('Failed to fetch account from Horizon')
      const data = await res.json()
      const bal = (data.balances || []).map((b: any) => {
        if (b.asset_type === 'native') return { asset: 'XLM', balance: b.balance }
        return { asset: b.asset, balance: b.balance }
      })
      setBalances(bal)
    } catch (err) {
      console.error('[v0] fetchBalances error', err)
      setBalances([])
      throw err
    }
  }

  const connect = async (walletType?: WalletType) => {
    console.log("[v0] Connecting wallet:", walletType)
    setLoading(true)
    try {
      const state = await stellarWallet.connect(walletType)
      console.log("[v0] Wallet connected, updating state:", state)
      setWallet(state)
      // fetch balances for the newly connected wallet
      if (state.publicKey) {
        try {
          await fetchBalances(state.publicKey)
        } catch (e) {
          console.warn('[v0] Failed to fetch balances after connect', e)
        }
      }
      try {
        // Initialize scaffold client for wallet-based signing
        if (state.walletType && state.publicKey) {
          scaffoldClient.setWallet(state.walletType, state.publicKey)
        }
      } catch (e) {
        console.warn('[v0] Failed to set scaffold client wallet', e)
      }
      return state
    } catch (error) {
      console.error("[v0] Connection failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    console.log("[v0] Disconnecting wallet")
    await stellarWallet.disconnect()
    setWallet({
      connected: false,
      publicKey: null,
      network: null,
      networkPassphrase: null,
    })
    setBalances([])
  }

  return (
    <WalletContext.Provider
      value={{
        ...wallet,
        balances,
        refreshBalances: async () => {
          if (wallet.publicKey) await fetchBalances(wallet.publicKey)
        },
        connect,
        disconnect,
        loading,
        isConnected: wallet.connected,
        address: wallet.publicKey,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
