import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  type xdr,
  Account,
  scValToNative,
  nativeToScVal,
  Address,
  xdr as XDR,
} from "@stellar/stellar-sdk"
import { createHash } from "crypto"
import { Buffer } from "buffer"

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

import { DEMO_CONTRACT_IDS } from "../demo/contracts"

export const CONTRACTS = {
  loans: process.env.NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT || DEMO_CONTRACT_IDS.LOANS,
  liquidationManager: process.env.NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT || DEMO_CONTRACT_IDS.LIQUIDATION,
  policyRegistry: process.env.NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT || DEMO_CONTRACT_IDS.POLICY,
  priceOracle: process.env.NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT || DEMO_CONTRACT_IDS.ORACLE,
  kycRegistry: process.env.NEXT_PUBLIC_SOROBAN_KYC_CONTRACT || DEMO_CONTRACT_IDS.KYC,
}

let _rpcServer: SorobanRpc.Server | null = null
export function getRpcServer() {
  if (!_rpcServer) {
    _rpcServer = new SorobanRpc.Server(RPC_URL)
  }
  return _rpcServer
}

// Helper function to build and simulate contract call
export async function buildContractCall(contractId: string, method: string, args: xdr.ScVal[], sourceAccount: string) {
  const server = getRpcServer()
  const contract = new Contract(contractId)

  const account = await server.getAccount(sourceAccount)
  const builtTransaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  const simulated = await server.simulateTransaction(builtTransaction)

  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`)
  }

  const assembledTx = SorobanRpc.assembleTransaction(builtTransaction, simulated).build()

  return { transaction: assembledTx, simulation: simulated }
}

// Loans Contract Client
export class LoansContractClient {
  private contractId: string

  constructor(contractId: string = CONTRACTS.loans) {
    this.contractId = contractId
  }

  async openPosition(
    positionId: string,
    owner: string,
    collateralRef: string,
    asset: string,
    signerPublicKey: string,
  ): Promise<{ xdr: string }> {
    console.log("[v0] Building openPosition transaction:", { positionId, owner, collateralRef, asset })

    if (!this.contractId) {
      throw new Error(
        "Loans contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT to the deployed contract ID or deploy the loans contract to Soroban testnet."
      )
    }

    const args = [
      stringToBytesN32(positionId), // BytesN<32>
      new Address(owner).toScVal(),
      stringToBytesN32(collateralRef), // BytesN<32>
      XDR.ScVal.scvSymbol(asset), // Symbol
    ]

    const { transaction } = await buildContractCall(this.contractId, "open_position", args, signerPublicKey)

    return { xdr: transaction.toXDR() }
  }

  async draw(
    positionId: string,
    amount: bigint,
    oracleRound: bigint,
    newLtvBps: number,
    signerPublicKey: string,
  ): Promise<{ xdr: string }> {
    console.log("[v0] Building draw transaction:", { positionId, amount: amount.toString(), oracleRound, newLtvBps })

    if (!this.contractId) {
      throw new Error(
        "Loans contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT to the deployed contract ID or deploy the loans contract to Soroban testnet."
      )
    }

    const args = [
      stringToBytesN32(positionId), // BytesN<32>
      nativeToScVal(amount, { type: "i128" }),
      nativeToScVal(oracleRound, { type: "u64" }),
      nativeToScVal(newLtvBps, { type: "u32" }),
    ]

    const { transaction } = await buildContractCall(this.contractId, "draw", args, signerPublicKey)

    return { xdr: transaction.toXDR() }
  }

  async repay(positionId: string, payer: string, amount: bigint, signerPublicKey: string): Promise<{ xdr: string }> {
    console.log("[v0] Building repay transaction:", { positionId, payer, amount: amount.toString() })

    if (!this.contractId) {
      throw new Error(
        "Loans contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT to the deployed contract ID or deploy the loans contract to Soroban testnet."
      )
    }

    const args = [
      stringToBytesN32(positionId), // BytesN<32>
      new Address(payer).toScVal(),
      nativeToScVal(amount, { type: "i128" }),
    ]

    const { transaction } = await buildContractCall(this.contractId, "repay", args, signerPublicKey)

    return { xdr: transaction.toXDR() }
  }

  async getPosition(positionId: string): Promise<any> {
    console.log("[v0] Querying position:", positionId)

    if (!this.contractId) {
      throw new Error(
        "Loans contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT to the deployed contract ID or deploy the loans contract to Soroban testnet."
      )
    }

    try {
      const server = getRpcServer()
      const contract = new Contract(this.contractId)

      const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0")

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("get_position", stringToBytesN32(positionId)))
        .setTimeout(30)
        .build()

      const simulated = await server.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationSuccess(simulated) && simulated.result) {
        const result = simulated.result.retval
        return scValToNative(result)
      }

      throw new Error("Failed to get position")
    } catch (error) {
      console.error("[v0] Error getting position:", error)
      throw error
    }
  }

  async accrue(positionId: string, signerPublicKey: string): Promise<{ xdr: string }> {
    console.log("[v0] Building accrue transaction:", positionId)

    const args = [stringToBytesN32(positionId)]

    const { transaction } = await buildContractCall(this.contractId, "accrue", args, signerPublicKey)

    return { xdr: transaction.toXDR() }
  }
}

// Price Oracle Contract Client
export class PriceOracleContractClient {
  private contractId: string

  constructor(contractId: string = CONTRACTS.priceOracle) {
    this.contractId = contractId
  }

  async updatePrice(
    asset: string,
    price: bigint,
    timestamp: bigint,
    roundId: bigint,
    signerPublicKey: string,
  ): Promise<{ xdr: string }> {
    console.log("[v0] Building updatePrice transaction:", { asset, price: price.toString(), timestamp, roundId })

    if (!this.contractId) {
      throw new Error(
        "Price oracle contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT to the deployed contract ID or deploy the oracle contract to Soroban testnet."
      )
    }

    const args = [
      nativeToScVal(asset, { type: "string" }),
      nativeToScVal(price, { type: "i128" }),
      nativeToScVal(timestamp, { type: "u64" }),
      nativeToScVal(roundId, { type: "u64" }),
    ]

    const { transaction } = await buildContractCall(this.contractId, "update_price", args, signerPublicKey)

    return { xdr: transaction.toXDR() }
  }

  async getPrice(asset: string): Promise<any> {
    console.log("[v0] Querying price for:", asset)

    if (!this.contractId) {
      throw new Error(
        "Price oracle contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT to the deployed contract ID or deploy the oracle contract to Soroban testnet."
      )
    }

    try {
      const server = getRpcServer()
      const contract = new Contract(this.contractId)

      const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0")

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("get_price", nativeToScVal(asset, { type: "string" })))
        .setTimeout(30)
        .build()

      const simulated = await server.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationSuccess(simulated) && simulated.result) {
        const result = simulated.result.retval
        return scValToNative(result)
      }

      throw new Error("Failed to get price")
    } catch (error) {
      console.error("[v0] Error getting price:", error)
      throw error
    }
  }
}

// Liquidation Manager Contract Client
export class LiquidationManagerContractClient {
  private contractId: string

  constructor(contractId: string = CONTRACTS.liquidationManager) {
    this.contractId = contractId
  }

  async emitIntent(
    positionId: string,
    notionalToRaise: bigint,
    minOut: bigint,
    deadline: bigint,
    signerPublicKey: string,
  ): Promise<{ xdr: string; nonce: bigint }> {
    console.log("[v0] Building emitIntent transaction:", { positionId, notionalToRaise, minOut, deadline })

    if (!this.contractId) {
      throw new Error(
        "Liquidation manager contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT to the deployed contract ID or deploy the contract to Soroban testnet."
      )
    }

    const nonce = BigInt(Date.now())

    const args = [
      nativeToScVal(positionId, { type: "string" }),
      nativeToScVal(notionalToRaise, { type: "i128" }),
      nativeToScVal(minOut, { type: "i128" }),
      nativeToScVal(deadline, { type: "u64" }),
      nativeToScVal(nonce, { type: "u64" }),
    ]

    const { transaction } = await buildContractCall(this.contractId, "emit_intent", args, signerPublicKey)

    return { xdr: transaction.toXDR(), nonce }
  }

  async submitReceipt(
    intentNonce: bigint,
    proceeds: bigint,
    fees: bigint,
    signature: string,
    signerPublicKey: string,
  ): Promise<{ xdr: string }> {
    console.log("[v0] Building submitReceipt transaction:", { intentNonce, proceeds, fees })

    if (!this.contractId) {
      throw new Error(
        "Liquidation manager contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT to the deployed contract ID or deploy the contract to Soroban testnet."
      )
    }

    const args = [
      nativeToScVal(intentNonce, { type: "u64" }),
      nativeToScVal(proceeds, { type: "i128" }),
      nativeToScVal(fees, { type: "i128" }),
      nativeToScVal(signature, { type: "string" }),
    ]

    const { transaction } = await buildContractCall(this.contractId, "submit_receipt", args, signerPublicKey)

    return { xdr: transaction.toXDR() }
  }
}

// Policy Registry Contract Client
export class PolicyRegistryContractClient {
  private contractId: string

  constructor(contractId: string = CONTRACTS.policyRegistry) {
    this.contractId = contractId
  }

  async getPolicy(asset: string): Promise<any> {
    console.log("[v0] Querying policy for:", asset)

    if (!this.contractId) {
      throw new Error(
        "Policy registry contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT to the deployed contract ID or deploy the contract to Soroban testnet."
      )
    }

    try {
      const server = getRpcServer()
      const contract = new Contract(this.contractId)

      const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0")

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("get_policy", nativeToScVal(asset, { type: "string" })))
        .setTimeout(30)
        .build()

      const simulated = await server.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationSuccess(simulated) && simulated.result) {
        const result = simulated.result.retval
        return scValToNative(result)
      }

      throw new Error("Failed to get policy")
    } catch (error) {
      console.error("[v0] Error getting policy:", error)
      throw error
    }
  }

  async updatePolicy(asset: string, policy: any, signerPublicKey: string): Promise<{ xdr: string }> {
    console.log("[v0] Building updatePolicy transaction:", { asset, policy })

    if (!this.contractId) {
      throw new Error(
        "Policy registry contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT to the deployed contract ID or deploy the contract to Soroban testnet."
      )
    }

    const args = [nativeToScVal(asset, { type: "string" }), nativeToScVal(policy, { type: "map" })]

    const { transaction } = await buildContractCall(this.contractId, "update_policy", args, signerPublicKey)

    return { xdr: transaction.toXDR() }
  }
}

// KYC Registry Contract Client
export class KYCRegistryContractClient {
  private contractId: string

  constructor(contractId: string = CONTRACTS.kycRegistry) {
    this.contractId = contractId
  }

  async isVerified(userAddress: string): Promise<boolean> {
    console.log("[v0] Checking KYC for:", userAddress)

    if (!this.contractId) {
      throw new Error(
        "KYC registry contract ID is not configured. Set NEXT_PUBLIC_SOROBAN_KYC_CONTRACT to the deployed contract ID or deploy the contract to Soroban testnet."
      )
    }
    try {
      const server = getRpcServer()
      const contract = new Contract(this.contractId)

      const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0")

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("is_verified", new Address(userAddress).toScVal()))
        .setTimeout(30)
        .build()

      const simulated = await server.simulateTransaction(transaction)

      if (SorobanRpc.Api.isSimulationSuccess(simulated) && simulated.result) {
        const result = simulated.result.retval
        return scValToNative(result)
      }

      return false
    } catch (error) {
      console.error("[v0] Error checking KYC:", error)
      return false
    }
  }

  async register(userAddress: string, kycHash: string, signerPublicKey: string): Promise<{ xdr: string }> {
    console.log("[v0] Building register KYC transaction:", { userAddress, kycHash })

    const args = [new Address(userAddress).toScVal(), nativeToScVal(kycHash, { type: "string" })]

    const { transaction } = await buildContractCall(this.contractId, "register", args, signerPublicKey)

    return { xdr: transaction.toXDR() }
  }
}

// Singleton instances
export const loansContract = new LoansContractClient()
export const priceOracleContract = new PriceOracleContractClient()
export const liquidationManagerContract = new LiquidationManagerContractClient()
export const policyRegistryContract = new PolicyRegistryContractClient()
export const kycRegistryContract = new KYCRegistryContractClient()

export function stringToBytesN32(str: string): XDR.ScVal {
  // Create a hash of the string to get exactly 32 bytes
  const hash = createHash("sha256").update(str).digest()
  
  // Ensure we have exactly 32 bytes (SHA256 always produces 32 bytes)
  if (hash.length !== 32) {
    throw new Error(`Hash length mismatch: expected 32 bytes, got ${hash.length}`)
  }
  
  // Create BytesN<32> ScVal - in Soroban, BytesN is represented as scvBytes with fixed length
  return XDR.ScVal.scvBytes(Buffer.from(hash))
}
