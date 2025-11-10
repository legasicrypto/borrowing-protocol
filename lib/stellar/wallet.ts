export interface WalletState {
  connected: boolean
  publicKey: string | null
  network: string | null
  networkPassphrase: string | null
  walletType?: string
}

// Wallet type definitions
interface FreighterAPI {
  isConnected: () => Promise<boolean>
  getPublicKey: () => Promise<string>
  signTransaction: (xdr: string, opts?: any) => Promise<string>
}

interface RabetAPI {
  connect: () => Promise<{ publicKey: string }>
  disconnect: () => Promise<void>
  sign: (xdr: string, network: string) => Promise<{ xdr: string }>
}

interface XBullAPI {
  connect: () => Promise<{ publicKey: string }>
  sign: (params: { xdr: string; network: string }) => Promise<{ response: string }>
}

interface AlbedoAPI {
  publicKey: (params?: any) => Promise<{ pubkey: string }>
  tx: (params: { xdr: string; network: string }) => Promise<{ signed_envelope_xdr: string }>
}

declare global {
  interface Window {
    freighter?: FreighterAPI
    rabet?: RabetAPI
    xBullSDK?: XBullAPI
    albedo?: AlbedoAPI
  }
}

export type WalletType = "freighter" | "rabet" | "xbull" | "albedo"

export class StellarWallet {
  private currentWallet: WalletType | null = null

  getAvailableWallets(): { id: WalletType; name: string; icon: string }[] {
    const wallets = []

    if (typeof window !== "undefined") {
      if (window.freighter) {
        wallets.push({ id: "freighter" as WalletType, name: "Freighter", icon: "🚀" })
      }
      if (window.rabet) {
        wallets.push({ id: "rabet" as WalletType, name: "Rabet", icon: "🦊" })
      }
      if (window.xBullSDK) {
        wallets.push({ id: "xbull" as WalletType, name: "xBull", icon: "🐂" })
      }
      if (window.albedo) {
        wallets.push({ id: "albedo" as WalletType, name: "Albedo", icon: "⭐" })
      }
    }

    return wallets
  }

  async connect(walletType?: WalletType): Promise<WalletState> {
    if (typeof window === "undefined") {
      throw new Error("Wallet can only be used in browser")
    }

    // If no wallet type specified, try to detect or use stored preference
    if (!walletType) {
      const available = this.getAvailableWallets()
      if (available.length === 0) {
        throw new Error("No Stellar wallets detected. Please install Freighter, Rabet, xBull, or Albedo.")
      }
      walletType = available[0].id
    }

    this.currentWallet = walletType

    try {
      let publicKey: string

      switch (walletType) {
        case "freighter":
          publicKey = await window.freighter!.getPublicKey()
          break

        case "rabet":
          const rabetResult = await window.rabet!.connect()
          publicKey = rabetResult.publicKey
          break

        case "xbull":
          const xbullResult = await window.xBullSDK!.connect()
          publicKey = xbullResult.publicKey
          break

        case "albedo":
          const albedoResult = await window.albedo!.publicKey()
          publicKey = albedoResult.pubkey
          break

        default:
          throw new Error(`Unsupported wallet type: ${walletType}`)
      }

      // Store wallet preference
      if (typeof window !== "undefined") {
        localStorage.setItem("preferredWallet", walletType)
      }

      return {
        connected: true,
        publicKey,
        network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
        networkPassphrase:
          process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
            ? "Public Global Stellar Network ; September 2015"
            : "Test SDF Network ; September 2015",
        walletType,
      }
    } catch (error) {
      console.error("Wallet connection failed:", error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (typeof window !== "undefined" && this.currentWallet === "rabet" && window.rabet) {
      try {
        await window.rabet.disconnect()
      } catch (error) {
        console.error("Wallet disconnect failed:", error)
      }
    }

    this.currentWallet = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("preferredWallet")
    }
  }

  async signTransaction(xdr: string): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("Wallet can only be used in browser")
    }

    if (!this.currentWallet) {
      throw new Error("No wallet connected")
    }

    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet"

    try {
      let signedXdr: string

      switch (this.currentWallet) {
        case "freighter":
          signedXdr = await window.freighter!.signTransaction(xdr, { network })
          break

        case "rabet":
          const rabetResult = await window.rabet!.sign(xdr, network)
          signedXdr = rabetResult.xdr
          break

        case "xbull":
          const xbullResult = await window.xBullSDK!.sign({ xdr, network })
          signedXdr = xbullResult.response
          break

        case "albedo":
          const albedoResult = await window.albedo!.tx({ xdr, network })
          signedXdr = albedoResult.signed_envelope_xdr
          break

        default:
          throw new Error(`Unsupported wallet type: ${this.currentWallet}`)
      }

      return signedXdr
    } catch (error) {
      console.error("Transaction signing failed:", error)
      throw error
    }
  }

  async getPublicKey(): Promise<string | null> {
    if (typeof window === "undefined") {
      return null
    }

    // Try to restore connection from stored preference
    const preferredWallet = localStorage.getItem("preferredWallet") as WalletType | null

    if (preferredWallet && this.isWalletAvailable(preferredWallet)) {
      try {
        this.currentWallet = preferredWallet
        const state = await this.connect(preferredWallet)
        return state.publicKey
      } catch {
        return null
      }
    }

    return null
  }

  isWalletAvailable(walletType: WalletType): boolean {
    if (typeof window === "undefined") return false

    switch (walletType) {
      case "freighter":
        return !!window.freighter
      case "rabet":
        return !!window.rabet
      case "xbull":
        return !!window.xBullSDK
      case "albedo":
        return !!window.albedo
      default:
        return false
    }
  }

  isInstalled(): boolean {
    return this.getAvailableWallets().length > 0
  }
}

export const stellarWallet = new StellarWallet()
