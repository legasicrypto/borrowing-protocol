import {
  Networks,
  TransactionBuilder,
  Keypair,
  Contract,
  SorobanRpc,
  type xdr,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk"

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

export async function buildSorobanTransaction({
  contractId,
  method,
  args,
  sourceAddress,
  signerSecret,
}: {
  contractId: string
  method: string
  args: xdr.ScVal[]
  sourceAddress: string
  signerSecret?: string
}) {
  console.log("[v0] Building Soroban transaction:", { contractId, method, sourceAddress })

  const server = new SorobanRpc.Server(RPC_URL)

  // Load source account
  const sourceKeypair = signerSecret ? Keypair.fromSecret(signerSecret) : null
  const sourcePublicKey = sourceKeypair ? sourceKeypair.publicKey() : sourceAddress

  const account = await server.getAccount(sourcePublicKey)

  // Build contract invocation
  const contract = new Contract(contractId)
  const operation = contract.call(method, ...args)

  // Build transaction
  const transaction = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build()

  // Simulate to get footprint
  const simulated = await server.simulateTransaction(transaction)

  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`)
  }

  // Prepare transaction with footprint
  const preparedTx = SorobanRpc.assembleTransaction(transaction, simulated).build()

  // If signer provided, sign and submit
  if (signerSecret && sourceKeypair) {
    preparedTx.sign(sourceKeypair)

    const sendResponse = await server.sendTransaction(preparedTx)
    console.log("[v0] Transaction sent:", sendResponse.hash)

    // Poll for result
    let status = sendResponse.status
    let attempts = 0
    while (status === "PENDING" && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const txResponse = await server.getTransaction(sendResponse.hash)
      status = txResponse.status
      attempts++

      if (status === "SUCCESS") {
        console.log("[v0] Transaction succeeded:", sendResponse.hash)
        return {
          ok: true,
          txHash: sendResponse.hash,
          result: txResponse.returnValue,
        }
      }
      if (status === "FAILED") {
        throw new Error(`Transaction failed: ${sendResponse.hash}`)
      }
    }

    throw new Error("Transaction polling timeout")
  }

  // Return unsigned XDR for client signing
  return {
    ok: true,
    xdr: preparedTx.toXDR(),
    requiresSignature: true,
  }
}

export function toScVal(value: any, type: string): xdr.ScVal {
  switch (type) {
    case "address":
      return new Address(value).toScVal()
    case "u128":
      return nativeToScVal(BigInt(value), { type: "u128" })
    case "u64":
      return nativeToScVal(BigInt(value), { type: "u64" })
    case "bytes":
      // Convert hex string to bytes
      const hexString = value.startsWith("0x") ? value.slice(2) : value
      const buffer = Buffer.from(hexString, "hex")
      return nativeToScVal(buffer, { type: "bytes" })
    case "symbol":
      return nativeToScVal(value, { type: "symbol" })
    default:
      return nativeToScVal(value)
  }
}

export function generatePositionId(): string {
  const crypto = require("crypto")
  return crypto.randomBytes(32).toString("hex")
}
