import { Transaction } from "@stellar/stellar-sdk"

export interface WalletSigner {
  signTransaction(
    xdr: string,
    opts?: { networkPassphrase?: string; address?: string },
  ): Promise<{ signedTxXdr: string }>
}

export async function signAndSubmitTransaction(xdr: string, walletType: string): Promise<string> {
  console.log("[v0] Signing transaction with wallet:", walletType)

  // Get wallet from window
  const wallet = getWallet(walletType)

  if (!wallet) {
    throw new Error(`Wallet ${walletType} not found`)
  }

  // Sign the transaction
  const { signedTxXdr } = await wallet.signTransaction(xdr, {
    networkPassphrase:
      process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
        ? "Public Global Stellar Network ; September 2015"
        : "Test SDF Network ; September 2015",
  })

  console.log("[v0] Transaction signed successfully")

  // Submit to network
  const { SorobanRpc } = await import("@stellar/stellar-sdk")
  const server = new SorobanRpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org")

  const transaction = new Transaction(
    signedTxXdr,
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
      ? "Public Global Stellar Network ; September 2015"
      : "Test SDF Network ; September 2015",
  )

  const response = await server.sendTransaction(transaction)

  console.log("[v0] Transaction submitted:", response)

  if (response.status === "PENDING" || response.status === "SUCCESS") {
    // Wait for confirmation
    let getResponse = await server.getTransaction(response.hash)
    const retries = 10

    for (let i = 0; i < retries; i++) {
      if (getResponse.status !== "NOT_FOUND") {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
      getResponse = await server.getTransaction(response.hash)
    }

    if (getResponse.status === "SUCCESS") {
      console.log("[v0] Transaction confirmed:", response.hash)
      return response.hash
    }
  }

  throw new Error(`Transaction failed: ${response.status}`)
}

function getWallet(walletType: string): WalletSigner | null {
  if (typeof window === "undefined") return null

  switch (walletType.toLowerCase()) {
    case "freighter":
      return (window as any).freighter
    case "rabet":
      return (window as any).rabet
    case "xbull":
      return (window as any).xBullSDK
    case "albedo":
      return (window as any).albedo
    default:
      return null
  }
}
