# Soroban Transaction Guide

This guide explains how to deploy and test Soroban smart contracts with browser-based wallet transactions.

## Prerequisites

1. **Stellar Wallet**: Install one of the following wallets:
   - [Freighter](https://freighter.app/) (Recommended)
   - [Rabet](https://rabet.io/)
   - [xBull](https://www.xbull.app/)
   - [Albedo](https://albedo.link/)

2. **Soroban CLI**: Install the Soroban CLI for contract deployment
   ```bash
   cargo install --locked soroban-cli
   ```

3. **Rust Toolchain**: Required for building contracts
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

4. **Testnet Account**: Fund your testnet account with testnet XLM
   - Get testnet XLM from: https://laboratory.stellar.org/#account-creator?network=testnet

## Deployment

### 1. Build Contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

### 2. Deploy to Testnet

```bash
# Make sure you have a Soroban identity configured
soroban keys generate deployer --network testnet
soroban keys fund deployer --network testnet

# Run the deployment script
./scripts/deploy-soroban.sh
```

The script will:
1. Build all contracts
2. Deploy them to Stellar Testnet
3. Initialize each contract
4. Output contract addresses

### 3. Configure Environment Variables

Add the contract addresses to your `.env.local`:

```env
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=<loans_contract_id>
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=<policy_registry_contract_id>
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=<price_oracle_contract_id>
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=<liquidation_manager_contract_id>
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

## Testing Transactions

### 1. Start the Development Server

```bash
npm run dev
# or
pnpm dev
```

### 2. Navigate to Test Page

Open http://localhost:3000/test-transaction in your browser

### 3. Connect Wallet

1. Click "Connect Wallet" button
2. Select your installed wallet (Freighter, Rabet, etc.)
3. Approve the connection request
4. Your wallet address will be displayed

### 4. Test Transaction

1. Fill in the form fields (or leave empty for auto-generated values):
   - **Position ID**: Unique identifier for the position
   - **Collateral Reference**: Reference to collateral
   - **Asset Symbol**: Asset symbol (e.g., USDC, XLM)

2. Click "Open Position (Transaction)"
3. Approve the transaction in your wallet
4. Wait for confirmation
5. View the transaction hash and link to Stellar Expert

### 5. Query Position

1. Enter a position ID
2. Click "Query Position (Read)"
3. View the position data returned from the contract

## Transaction Flow

The transaction flow works as follows:

1. **Build Transaction** (Server-side)
   - Client calls `/api/soroban/build-transaction`
   - Server builds the Soroban transaction XDR
   - Returns unsigned XDR to client

2. **Sign Transaction** (Browser)
   - Client receives unsigned XDR
   - Wallet extension prompts user to sign
   - Returns signed XDR

3. **Submit Transaction** (Server-side)
   - Client sends signed XDR to `/api/soroban/submit`
   - Server submits to Stellar network
   - Polls for transaction confirmation
   - Returns transaction hash

4. **Confirmation**
   - Transaction hash is displayed
   - Link to Stellar Expert for transaction details

## Supported Operations

### Loans Contract

- **open_position**: Open a new loan position
- **draw**: Borrow from a position
- **repay**: Repay debt on a position
- **get_position**: Query position details

### Price Oracle Contract

- **update_price**: Update asset price (admin only)
- **get_price**: Query current asset price

## Troubleshooting

### "Account not found" Error

- Make sure your wallet account is funded with testnet XLM
- Get testnet XLM from: https://laboratory.stellar.org/#account-creator?network=testnet

### "Transaction simulation failed" Error

- Check that the contract is properly deployed
- Verify contract addresses in environment variables
- Check that the account has sufficient XLM for fees

### "Wallet not found" Error

- Make sure a Stellar wallet extension is installed
- Refresh the page after installing the wallet
- Check browser console for wallet detection errors

### "Transaction failed on-chain" Error

- Check the transaction on Stellar Expert for detailed error
- Verify contract initialization was successful
- Check that all required parameters are correct

## Contract Addresses

After deployment, save your contract addresses:

```bash
# Example output from deployment script
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYPNGZLSQ2GE4TLYIV...
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=CBW6B4C5H2C5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYPNGZLSQ2GE4TLYIV...
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=CCX7B4C5H2C5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYPNGZLSQ2GE4TLYIV...
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=CDY8B4C5H2C5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYPNGZLSQ2GE4TLYIV...
```

## Next Steps

1. Deploy contracts to testnet
2. Test transactions using the test page
3. Integrate transaction calls into your application
4. Monitor transactions on Stellar Expert
5. Deploy to mainnet when ready

## Resources

- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Freighter Wallet](https://freighter.app/)
- [Stellar Expert](https://stellar.expert/)
- [Stellar Laboratory](https://laboratory.stellar.org/)

