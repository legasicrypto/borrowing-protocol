# Run Soroban contracts and enable on-chain transactions (Testnet)

This project can build Soroban transaction XDRs server-side and sign/submit them client-side using a browser wallet (Freighter, Rabet, xBull, Albedo). To enable full on-chain transactions you must:

1. Deploy the Soroban smart contracts to Soroban Testnet (or use existing deployed contract IDs).

2. Configure environment variables in your hosting (Vercel/Netlify) with the deployed contract IDs and RPC endpoints.

Required environment variables (set these in Vercel/Netlify/hosting dashboard):

- NEXT_PUBLIC_NETWORK=testnet
- NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
- NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
- NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=<deployed_loans_contract_id>
- NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=<deployed_liquidation_contract_id>
- NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=<deployed_policy_contract_id>
- NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=<deployed_price_oracle_contract_id>
- NEXT_PUBLIC_SOROBAN_KYC_CONTRACT=<deployed_kyc_contract_id>

Notes:
- Do NOT commit secret keys. Contract IDs are public and safe to add to `NEXT_PUBLIC_*` vars.
- If you don't want to deploy contracts yet, the app will run but attempts to build transactions will return clear errors indicating which contract ID is missing.

How to deploy Soroban contracts (local machine):

1. Install Rust and Soroban CLI:
   - Install Rust: https://rustup.rs/
   - Install Soroban CLI: `cargo install --locked soroban-cli`

2. Build and deploy contracts (from project `contracts/` folder):
   - `./scripts/build-contracts.sh` (or `cd contracts && soroban build` where appropriate)
   - `./scripts/deploy-soroban.sh` (this script uses `soroban` to deploy to testnet)

3. After deployment, copy the contract IDs and set them in your hosting environment variables listed above.

Quick local test (after env vars are set):

1. Install dependencies and build:

```powershell
pnpm install
pnpm run build
pnpm run start
```

2. Open the app in your browser and navigate to `/test-transaction` to connect a wallet and perform a test transaction.

If you want, I can help:
- Add a script to automatically deploy contracts (requires soroban CLI on the deploy runner).
- Prepare a Vercel deployment with sample env var placeholders.
- Walk through deploying contracts step-by-step from your machine and then set the environment variables in Vercel/Netlify.
