# Deploying Contracts to Futurenet

This guide automates building, deploying, initializing and verifying the Soroban contracts on Futurenet.

Prerequisites
- Rust toolchain + wasm target: `rustup target add wasm32-unknown-unknown`
- soroban CLI: `cargo install --locked soroban-cli` (or use the provided binary)
- A funded Futurenet account (deployer) and its secret key
- From repo root: PowerShell (Windows)

Overview
- Build: compile contracts to WASM
- Deploy: policy_registry, price_adapter, liquidation_manager, then loans
- Initialize loans contract with the addresses above
- Verify: submit an `open_position` and read it back

Environment
Set the deployer secret key in an environment variable (recommended) or pass as argument to scripts:

```powershell
$env:DEPLOYER_SECRET_KEY = "S..."   # DO NOT commit this value
```

RPC & network used in scripts: `https://soroban-futurenet.stellar.org` and network name `futurenet`.

Files added in this repo
- `scripts/deploy-futurenet.ps1` — PowerShell script that builds contracts and helps deploy them to Futurenet
- `scripts/test-loans.ps1` — PowerShell script that runs a basic open_position + get_position verification using the deployed LOANS contract ID

Quick manual commands (if you prefer manual steps)

1) Build all contracts

```powershell
Set-Location .\contracts
Get-ChildItem -Directory | ForEach-Object {
  if (Test-Path (Join-Path $_.FullName 'Cargo.toml')) {
    Write-Host "Building $_"
    Push-Location $_.FullName
    soroban contract build
    Pop-Location
  }
}
```

2) Deploy contracts (example)

```powershell
$rpc = "https://soroban-futurenet.stellar.org"
$network = "futurenet"
$deployer = $env:DEPLOYER_SECRET_KEY

# Example for a single contract (replace paths and names accordingly)
soroban contract deploy --wasm .\contracts\loans\target\wasm32-unknown-unknown\release\loans.wasm --source-account $deployer --network $network --rpc-url $rpc
```

3) Initialize loans contract

```powershell
# Replace placeholders with values printed by the deploy commands
$LOANS_ID = '<LOANS_CONTRACT_ID>'
$POLICY_ID = '<POLICY_CONTRACT_ID>'
$ORACLE_ID = '<PRICE_ADAPTER_CONTRACT_ID>'
$LIQ_ID = '<LIQUIDATION_MANAGER_CONTRACT_ID>'
$ADMIN_PUBLIC = '<ADMIN_PUBLIC_KEY>'

soroban contract invoke --id $LOANS_ID --fn initialize \
  --arg Address:$ADMIN_PUBLIC \
  --arg Address:$POLICY_ID \
  --arg Address:$ORACLE_ID \
  --arg Address:$LIQ_ID \
  --source-account $deployer --network $network --rpc-url $rpc
```

4) Add contract IDs to `.env.local` (repo root)

```
NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=<LOANS_CONTRACT_ID>
NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=<POLICY_CONTRACT_ID>
NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=<PRICE_ADAPTER_CONTRACT_ID>
NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=<LIQUIDATION_MANAGER_CONTRACT_ID>
NEXT_PUBLIC_STELLAR_NETWORK=futurenet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-futurenet.stellar.org
```

5) Test via CLI (open position + get position)

```powershell
# Create example position id (32 bytes hex)
$bytes = New-Object 'System.Byte[]' 32; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); $pos = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''

# Open position (signed by owner admin or the account you control)
soroban contract invoke --id $LOANS_ID --fn open_position --arg BytesN:0x$pos --arg Address:<OWNER_PUBLIC_KEY> --arg BytesN:0x$pos --arg Symbol:USDC --source-account $deployer --network $network --rpc-url $rpc

# Query position
soroban contract invoke --id $LOANS_ID --fn get_position --arg BytesN:0x$pos --network $network --rpc-url $rpc
```

If anything fails, check the CLI output for simulation errors and the RPC endpoint health.

Security note
- Never commit secret keys. Use environment variables and local `.env.local`.

If you'd like, run `.\scripts\deploy-futurenet.ps1` locally and paste the printed contract IDs here; I will help wire them into `.env.local` and verify the front-end flow.
