import type { ReactNode } from "react"
// Import to initialize AppKit - the import itself triggers initialization
import "@/lib/walletConnect"

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  // AppKit is initialized via import, no additional provider wrapper needed
  // The createAppKit call in walletConnect.ts sets up everything
  return <>{children}</>
}