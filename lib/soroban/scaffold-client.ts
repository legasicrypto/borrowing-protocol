import type { WalletType } from "../context/wallet-context"

export class ScaffoldStellarClient {
  private walletType: WalletType | null = null
  private publicKey: string | null = null

  setWallet(walletType: WalletType, publicKey: string) {
    console.log("[v0] Scaffold: Setting wallet", { walletType, publicKey })
    this.walletType = walletType
    this.publicKey = publicKey
  }

  async signAndSubmitTransaction(xdr: string): Promise<string> {
    if (!this.walletType || !this.publicKey) {
      throw new Error("Wallet not connected")
    }

    if (typeof window === "undefined") {
      throw new Error("Wallet signing can only be done in browser")
    }

    console.log("[v0] Scaffold: Signing transaction with wallet", this.walletType)

    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet"
    const networkPassphrase =
      process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
        ? "Public Global Stellar Network ; September 2015"
        : "Test SDF Network ; September 2015"

    try {
      let signedXdr: string

    // Request signature from wallet
    if (this.walletType === "freighter") {
        if (!window.freighter) {
          throw new Error("Freighter wallet not found. Please install Freighter extension.")
        }
        signedXdr = await window.freighter.signTransaction(xdr, {
          networkPassphrase,
          network,
        })
    } else if (this.walletType === "rabet") {
        if (!window.rabet) {
          throw new Error("Rabet wallet not found. Please install Rabet extension.")
        }
        const result = await window.rabet.sign(xdr, network)
        signedXdr = result.xdr
    } else if (this.walletType === "xbull") {
        if (!window.xBullSDK) {
          throw new Error("xBull wallet not found. Please install xBull extension.")
        }
        const result = await window.xBullSDK.sign({ xdr, network })
        signedXdr = result.response
    } else if (this.walletType === "albedo") {
        if (!window.albedo) {
          throw new Error("Albedo wallet not found. Please install Albedo extension.")
        }
        const result = await window.albedo.tx({
          xdr,
          network,
        })
        signedXdr = result.signed_envelope_xdr
      } else {
        throw new Error(`Unsupported wallet type: ${this.walletType}`)
      }

      console.log("[v0] Transaction signed successfully")
      return signedXdr
    } catch (error) {
      console.error("[v0] Transaction signing failed:", error)
      throw error
    }
  }

  async submitTransaction(signedXdr: string): Promise<string> {
    console.log("[v0] Scaffold: Submitting transaction to network")

    const response = await fetch("/api/soroban/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xdr: signedXdr }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit transaction")
    }

    return data.hash
  }

    // Loan Operations
  async openPosition(positionId: string, collateralRef: string, asset: string): Promise<{ hash: string }> {
    if (!this.publicKey) throw new Error("Wallet not connected")

    console.log("[v0] Scaffold: Opening position", { positionId, collateralRef, asset, wallet: this.walletType })

    try {
      // Step 1: Build transaction via API route (server-side)
      console.log("[v0] Step 1: Building transaction")
      const buildResponse = await fetch("/api/soroban/build-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract: "loans",
          method: "open_position",
          args: {
            positionId,
            owner: this.publicKey,
            collateralRef,
            asset,
            signerPublicKey: this.publicKey,
          },
          sourceAccount: this.publicKey,
        }),
      })

      if (!buildResponse.ok) {
        const error = await buildResponse.json()
        throw new Error(error.error || "Failed to build transaction")
      }

      const { xdr } = await buildResponse.json()

      // Step 2: Request wallet signature
      console.log("[v0] Step 2: Requesting wallet signature")
      const signedXdr = await this.signAndSubmitTransaction(xdr)

      // Step 3: Submit to network
      console.log("[v0] Step 3: Submitting signed transaction")
      const hash = await this.submitTransaction(signedXdr)

      console.log("[v0] Transaction submitted successfully:", hash)
      return { hash }
    } catch (error) {
      console.error("[v0] openPosition error:", error)
      throw error
    }

  }
 
  async draw(positionId: string, amount: number, oracleRound: number, ltvBps: number) {
    if (!this.publicKey) throw new Error("Wallet not connected")

    console.log("[v0] Scaffold: Drawing from position", { positionId, amount })

    const amountBigInt = BigInt(Math.floor(amount * 10_000_000)) // Convert to 7 decimals
    const oracleRoundBigInt = BigInt(oracleRound)

    // Build transaction via API route
    const buildResponse = await fetch("/api/soroban/build-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract: "loans",
        method: "draw",
        args: {
          positionId,
          amount: amountBigInt.toString(),
          oracleRound: oracleRoundBigInt.toString(),
          newLtvBps: ltvBps,
        },
        sourceAccount: this.publicKey,
      }),
    })

    if (!buildResponse.ok) {
      const error = await buildResponse.json()
      throw new Error(error.error || "Failed to build transaction")
    }

    const { xdr } = await buildResponse.json()

    // Sign and submit
    const signedXdr = await this.signAndSubmitTransaction(xdr)
    const hash = await this.submitTransaction(signedXdr)

    return hash
  }

  async repay(positionId: string, amount: number) {
    if (!this.publicKey) throw new Error("Wallet not connected")

    console.log("[v0] Scaffold: Repaying position", { positionId, amount })

    const amountBigInt = BigInt(Math.floor(amount * 10_000_000)) // Convert to 7 decimals

    // Build transaction via API route
    const buildResponse = await fetch("/api/soroban/build-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract: "loans",
        method: "repay",
        args: {
          positionId,
          payer: this.publicKey,
          amount: amountBigInt.toString(),
        },
        sourceAccount: this.publicKey,
      }),
    })

    if (!buildResponse.ok) {
      const error = await buildResponse.json()
      throw new Error(error.error || "Failed to build transaction")
    }

    const { xdr } = await buildResponse.json()

    // Sign and submit
    const signedXdr = await this.signAndSubmitTransaction(xdr)
    const hash = await this.submitTransaction(signedXdr)

    return hash
  }

  async getPosition(positionId: string) {
    // Try server-side positions API first
    try {
      const resp = await fetch(`/api/positions?wallet=${encodeURIComponent(this.publicKey || "")}`)
      if (!resp.ok) {
        throw new Error(`Failed to fetch position: ${resp.status}`)
      }
      const data = await resp.json()
      const positions = data.positions || []
      return positions.find((p: any) => p.position_id === positionId) || null
    } catch (e) {
      console.warn('[v0] getPosition fallback - returning null', e)
      return null
    }
  }

  // Price Oracle Operations
  async updatePrice(asset: string, price: number, timestamp: number, roundId: number) {
    if (!this.publicKey) throw new Error("Wallet not connected")

    console.log("[v0] Scaffold: Updating price", { asset, price })

    const priceBigInt = BigInt(Math.floor(price * 10_000_000)) // Convert to 7 decimals
    const timestampBigInt = BigInt(timestamp)
    const roundIdBigInt = BigInt(roundId)

    // Build on server-side (admin flow expected). Attempt to call server API to build transaction.
    const buildResp = await fetch('/api/soroban/build-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contract: 'priceOracle',
        method: 'update_price',
        args: { asset, price: priceBigInt.toString(), timestamp: timestampBigInt.toString(), roundId: roundIdBigInt.toString() },
        sourceAccount: this.publicKey,
      }),
    })

    if (!buildResp.ok) {
      const err = await buildResp.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to build price update transaction')
    }

    const { xdr } = await buildResp.json()
    const signedXdr = await this.signAndSubmitTransaction(xdr)
    const hash = await this.submitTransaction(signedXdr)
    return hash
  }

  async getPrice(asset: string) {
    try {
      const resp = await fetch('/api/prices')
      if (!resp.ok) throw new Error('Failed to fetch prices')
      const data = await resp.json()
      const prices = data.prices || []
      return prices.find((p: any) => p.asset === asset) || null
    } catch (e) {
      console.warn('[v0] getPrice fallback - returning null', e)
      return null
    }
  }

  // KYC Operations
  async checkKYC(userAddress: string) {
    // Fallback KYC check: try server endpoint if available, otherwise assume verified in demo mode
    try {
      const resp = await fetch(`/api/kyc/status?address=${encodeURIComponent(userAddress)}`)
      if (!resp.ok) {
        console.warn('[v0] checkKYC server returned non-ok, falling back to demo true')
        return true
      }
      const data = await resp.json()
      return data?.kyc_status === 'verified' || data?.verified === true
    } catch (e) {
      console.warn('[v0] checkKYC fallback - assuming verified', e)
      return true
    }
  }
}

export const scaffoldClient = new ScaffoldStellarClient()
