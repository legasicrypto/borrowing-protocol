# Testing the Borrow Flow

This guide explains how to test the borrow flow end-to-end using a wallet on testnet.

## Prerequisites

1. Install a supported wallet:
   - [Freighter](https://www.freighter.app/)
   - [Rabet](https://rabet.io/)
   - [xBull](https://xbull.app/)
   - [Albedo](https://albedo.link/)

2. Fund your testnet account:
   - Go to https://laboratory.stellar.org/
   - Create a new keypair
   - Fund it with testnet friendbot

## Local Development Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment template:
```bash
cp .env.local.example .env.local
```

3. Start the development server:
```bash
pnpm dev
```

## Testing Steps

1. Connect Wallet:
   - Open http://localhost:3000/dashboard/borrow
   - Click "Connect Wallet"
   - Select your wallet (e.g., Freighter)
   - Approve the connection

2. Create a Loan:
   - Select an asset (e.g., XLM)
   - Enter collateral amount
   - Adjust LTV ratio
   - Click "Borrow Now"
   - You'll see progress toasts for each step

3. Sign Transaction:
   - Your wallet will prompt to sign the transaction
   - Review and sign it
   - The app will show transaction status

4. Verify:
   - You'll see a success message with the transaction hash
   - The app will redirect to /dashboard/positions
   - Your position will appear in the list

## Expected Behavior

1. Before Borrow:
   - Wallet connection status shown
   - Asset selector works
   - Collateral/borrow calculators update
   - Health factor and liquidation price shown

2. During Borrow:
   - Loading states appear
   - Progress toasts show each step
   - Wallet prompts for signature
   - Transaction submission feedback

3. After Borrow:
   - Success message with tx hash
   - Position appears in list
   - Transaction viewable in explorer

## Troubleshooting

1. "Wallet not connected":
   - Check wallet is installed
   - Ensure testnet is selected
   - Try reconnecting wallet

2. Transaction fails:
   - Check testnet XLM balance
   - Verify loan parameters are valid
   - Check browser console for errors

3. Position not showing:
   - Refresh positions page
   - Check transaction status in explorer
   - Verify database transaction completed

## Contract Flow

The borrow flow involves these steps:

1. Frontend prepares loan parameters
2. Server builds transaction XDR
3. Wallet signs transaction
4. Server submits to Soroban
5. Position is tracked in database

Key files:
- `app/dashboard/borrow/page.tsx` - UI and flow logic
- `lib/soroban/scaffold-client.ts` - Wallet integration
- `lib/soroban/contract-client.ts` - Contract interface
- `app/api/positions/create/route.ts` - Backend position creation