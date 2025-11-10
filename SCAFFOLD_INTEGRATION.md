# Scaffold Stellar Integration Guide

This project uses Scaffold Stellar to connect Soroban smart contracts with the frontend dashboard.

## Architecture

\`\`\`
contracts/              # Rust smart contracts (Soroban)
├── loans/             # Main lending contract
├── policy_registry/   # Governance parameters
├── price_adapter/     # Price oracle
└── liquidation_manager/ # Liquidation coordination

lib/soroban/           # TypeScript contract clients
├── contract-client.ts # Auto-generated from contracts
└── scaffold-client.ts # Wallet integration layer
\`\`\`

## Development Workflow

### 1. Build Contracts

\`\`\`bash
chmod +x scripts/build-contracts.sh
./scripts/build-contracts.sh
\`\`\`

### 2. Deploy to Testnet

\`\`\`bash
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/loans.wasm \
  --source-account YOUR_SECRET_KEY \
  --network testnet
\`\`\`

### 3. Update Environment Variables

\`\`\`env
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=C...
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=C...
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=C...
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=C...
NEXT_PUBLIC_SOROBAN_KYC_CONTRACT=C...
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

## How It Works

### Loan Creation Flow

1. **User clicks "Borrow Now"** → Frontend calls `scaffoldClient.openPosition()`
2. **Build transaction XDR** → Contract client creates Soroban transaction
3. **Sign with wallet** → User approves in Freighter/Rabet/xBull/Albedo
4. **Submit to network** → Transaction sent to Stellar testnet
5. **Poll for confirmation** → Wait for transaction success
6. **Save to database** → Mirror data in Supabase for fast UI

### All Dashboard Features Connected

- **Borrow** → `openPosition()` + `draw()` on Loans contract
- **Repay** → `repay()` on Loans contract  
- **Positions** → `getPosition()` view function + Supabase mirror
- **Prices** → `updatePrice()` on PriceAdapter contract
- **Policies** → `updatePolicy()` on PolicyRegistry contract
- **Liquidations** → `emitIntent()` on LiquidationManager contract

## Benefits

✅ **Type-safe** - TypeScript clients generated from Rust contracts
✅ **Multi-wallet** - Works with all major Stellar wallets
✅ **Hot reload** - Development mode with instant updates
✅ **Environment management** - Easy testnet/mainnet switching
✅ **On-chain verified** - All operations recorded on Stellar blockchain
