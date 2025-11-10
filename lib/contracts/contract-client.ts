import { Contract, SorobanRpc, TransactionBuilder, Networks, type Keypair } from "@stellar/stellar-sdk"
import deployedContracts from "./deployed-contracts.json"

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"
const NETWORK_PASSPHRASE = Networks.TESTNET

export class ContractClient {
  private rpc: SorobanRpc.Server
  private contracts: typeof deployedContracts.contracts

  constructor() {
    this.rpc = new SorobanRpc.Server(RPC_URL)
    this.contracts = deployedContracts.contracts
  }

  // Get contract instance
  getContract(contractType: "loans" | "policyRegistry" | "priceAdapter" | "liquidationManager") {
    const contractId = this.contracts[contractType]
    if (!contractId) {
      throw new Error(`Contract ${contractType} not deployed`)
    }
    return new Contract(contractId)
  }

  // Open a new position
  async openPosition(params: {
    positionId: string
    owner: string
    collateralRef: string
    asset: string
    signerKeypair: Keypair
  }) {
    const contract = this.getContract("loans")

    const account = await this.rpc.getAccount(params.signerKeypair.publicKey())

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "open_position",
          ...this.encodeArgs([
            { type: "bytes32", value: params.positionId },
            { type: "address", value: params.owner },
            { type: "bytes32", value: params.collateralRef },
            { type: "symbol", value: params.asset },
          ]),
        ),
      )
      .setTimeout(30)
      .build()

    const preparedTx = await this.rpc.prepareTransaction(tx)
    preparedTx.sign(params.signerKeypair)

    const result = await this.rpc.sendTransaction(preparedTx)
    return this.pollTransaction(result.hash)
  }

  // Draw (borrow) from position
  async draw(params: {
    positionId: string
    amount: number
    oracleRound: number
    newLtvBps: number
    signerKeypair: Keypair
  }) {
    const contract = this.getContract("loans")

    const account = await this.rpc.getAccount(params.signerKeypair.publicKey())

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "draw",
          ...this.encodeArgs([
            { type: "bytes32", value: params.positionId },
            { type: "i128", value: params.amount },
            { type: "i128", value: params.oracleRound },
            { type: "i128", value: params.newLtvBps },
          ]),
        ),
      )
      .setTimeout(30)
      .build()

    const preparedTx = await this.rpc.prepareTransaction(tx)
    preparedTx.sign(params.signerKeypair)

    const result = await this.rpc.sendTransaction(preparedTx)
    return this.pollTransaction(result.hash)
  }

  // Repay debt
  async repay(params: {
    positionId: string
    payer: string
    amount: number
    signerKeypair: Keypair
  }) {
    const contract = this.getContract("loans")

    const account = await this.rpc.getAccount(params.signerKeypair.publicKey())

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "repay",
          ...this.encodeArgs([
            { type: "bytes32", value: params.positionId },
            { type: "address", value: params.payer },
            { type: "i128", value: params.amount },
          ]),
        ),
      )
      .setTimeout(30)
      .build()

    const preparedTx = await this.rpc.prepareTransaction(tx)
    preparedTx.sign(params.signerKeypair)

    const result = await this.rpc.sendTransaction(preparedTx)
    return this.pollTransaction(result.hash)
  }

  // Get position details (view function)
  async getPosition(positionId: string) {
    const contract = this.getContract("loans")

    // For view functions, we use simulateTransaction
    const tx = new TransactionBuilder(
      // Use a placeholder account for simulation
      new SorobanRpc.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
      { fee: "100", networkPassphrase: NETWORK_PASSPHRASE },
    )
      .addOperation(contract.call("get_position", ...this.encodeArgs([{ type: "bytes32", value: positionId }])))
      .setTimeout(30)
      .build()

    const result = await this.rpc.simulateTransaction(tx)

    if (SorobanRpc.Api.isSimulationSuccess(result)) {
      return this.decodePosition(result.result?.retval)
    }

    throw new Error("Failed to get position")
  }

  // Update price (admin only)
  async updatePrice(params: {
    asset: string
    price: number
    roundId: number
    source: string
    signerKeypair: Keypair
  }) {
    const contract = this.getContract("priceAdapter")

    const account = await this.rpc.getAccount(params.signerKeypair.publicKey())

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "update_price",
          ...this.encodeArgs([
            { type: "symbol", value: params.asset },
            { type: "i128", value: params.price },
            { type: "i128", value: params.roundId },
            { type: "symbol", value: params.source },
          ]),
        ),
      )
      .setTimeout(30)
      .build()

    const preparedTx = await this.rpc.prepareTransaction(tx)
    preparedTx.sign(params.signerKeypair)

    const result = await this.rpc.sendTransaction(preparedTx)
    return this.pollTransaction(result.hash)
  }

  // Get price (view function)
  async getPrice(asset: string) {
    const contract = this.getContract("priceAdapter")

    const tx = new TransactionBuilder(
      new SorobanRpc.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
      { fee: "100", networkPassphrase: NETWORK_PASSPHRASE },
    )
      .addOperation(contract.call("get_price", ...this.encodeArgs([{ type: "symbol", value: asset }])))
      .setTimeout(30)
      .build()

    const result = await this.rpc.simulateTransaction(tx)

    if (SorobanRpc.Api.isSimulationSuccess(result)) {
      return this.decodePriceRound(result.result?.retval)
    }

    return null
  }

  // Helper: Encode arguments for contract calls
  private encodeArgs(args: Array<{ type: string; value: any }>): any[] {
    // This would use the generated bindings in production
    // For now, simplified encoding
    return args.map((arg) => {
      switch (arg.type) {
        case "address":
          return arg.value
        case "symbol":
          return arg.value
        case "bytes32":
          return Buffer.from(arg.value, "hex")
        case "i128":
          return BigInt(arg.value)
        default:
          return arg.value
      }
    })
  }

  // Helper: Decode position from contract
  private decodePosition(scval: any) {
    // Use generated bindings to decode
    // Simplified for POC
    return scval
  }

  // Helper: Decode price round
  private decodePriceRound(scval: any) {
    // Use generated bindings to decode
    return scval
  }

  // Helper: Poll transaction status
  private async pollTransaction(hash: string, maxAttempts = 10): Promise<any> {
    let attempts = 0

    while (attempts < maxAttempts) {
      const txStatus = await this.rpc.getTransaction(hash)

      if (txStatus.status === "SUCCESS") {
        return txStatus
      }

      if (txStatus.status === "FAILED") {
        throw new Error(`Transaction failed: ${hash}`)
      }

      // Wait 1 second before next poll
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++
    }

    throw new Error(`Transaction timeout: ${hash}`)
  }
}

// Singleton instance
export const contractClient = new ContractClient()
