import { createAppKit } from "@reown/appkit/react"
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react"
import { solana, solanaDevnet } from "@reown/appkit/networks"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"

// Get project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.warn("WalletConnect Project ID not found. Please set VITE_WALLETCONNECT_PROJECT_ID")
}

// Initialize Solana adapter with wallet adapters
const solanaAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
})

// App metadata
const metadata = {
  name: "Legasi",
  description: "Crypto-backed lending platform",
  url: typeof window !== "undefined" ? window.location.origin : "https://legasi.app",
  icons: ["/favicon.png"],
}

// Create and export the AppKit instance
export const appKit = createAppKit({
  adapters: [solanaAdapter],
  networks: [solana, solanaDevnet],
  projectId: projectId || "demo-project-id",
  metadata,
  features: {
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#FF6B00", // legasi-orange
    "--w3m-color-mix": "#1A1A1A",
    "--w3m-color-mix-strength": 20,
  },
})

export { solana, solanaDevnet }
