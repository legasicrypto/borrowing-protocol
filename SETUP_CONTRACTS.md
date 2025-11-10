# Setting up Soroban Contract Development Environment on Windows

This guide walks through setting up the required tools to build and deploy Soroban smart contracts on Windows.

## Prerequisites

1. Install Rust toolchain:
   ```powershell
   # Download and run rustup-init.exe
   winget install Rustlang.Rustup
   # OR use the official installer
   # https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe
   
   # Restart your terminal, then add wasm32 target
   rustup target add wasm32-unknown-unknown
   ```

2. Install Soroban CLI:
   ```powershell
   cargo install --locked soroban-cli
   ```

3. Verify installation:
   ```powershell
   rustc --version
   cargo --version
   soroban --version
   ```

## Building Contracts

1. Navigate to the project root:
   ```powershell
   cd "path\to\legasi"
   ```

2. Build all contracts:
   ```powershell
   .\scripts\build-deploy-contracts.ps1 build
   ```

This will compile all contracts to WebAssembly in their respective `target` directories.

## Deploying Contracts

1. Create a Stellar account for deployment:
   - Visit https://laboratory.stellar.org/
   - Create a new keypair
   - Fund it using the testnet friendbot

2. Create `.env.local` from example:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```

3. Add your deployment account secret key to `.env.local`:
   ```
   DEPLOYER_SECRET_KEY=S...
   ```

4. Deploy contracts:
   ```powershell
   .\scripts\build-deploy-contracts.ps1 deploy
   ```

5. The script will output contract IDs - add these to your `.env.local`:
   ```
   NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=...
   NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=...
   NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=...
   NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=...
   NEXT_PUBLIC_SOROBAN_KYC_CONTRACT=...
   ```

## Troubleshooting

- If you see "soroban is not recognized":
  1. Check that `%USERPROFILE%\.cargo\bin` is in your PATH
  2. Restart your terminal

- If contract build fails:
  1. Clean the target directories:
     ```powershell
     .\scripts\build-deploy-contracts.ps1 clean
     ```
  2. Try building again

- If deployment fails:
  1. Check your account has sufficient testnet XLM
  2. Verify RPC_URL is accessible
  3. Check DEPLOYER_SECRET_KEY is correct