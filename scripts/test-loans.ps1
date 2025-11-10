<#
Simple test script for Loans contract on Futurenet.

This script demonstrates how to call `open_position` and `get_position` using the soroban CLI.
Before running, set the following environment variables or edit the variables below:

  $env:LOANS_ID            - Loans contract ID
  $env:DEPLOYER_SECRET_KEY - Deployer secret (used to sign transactions)
  $env:OWNER_PUBLIC        - Owner public key for the position (address)

Usage:
  pwsh .\scripts\test-loans.ps1
#>

if (-not $env:LOANS_ID) { Write-Host "Please set LOANS_ID in environment (contract id)." -ForegroundColor Red; exit 1 }
if (-not $env:DEPLOYER_SECRET_KEY) { Write-Host "Please set DEPLOYER_SECRET_KEY in environment." -ForegroundColor Red; exit 1 }
if (-not $env:OWNER_PUBLIC) { Write-Host "Please set OWNER_PUBLIC in environment." -ForegroundColor Red; exit 1 }

$LOANS_ID = $env:LOANS_ID
$deployer = $env:DEPLOYER_SECRET_KEY
$owner = $env:OWNER_PUBLIC
$rpc = 'https://soroban-futurenet.stellar.org'
$network = 'futurenet'

Write-Host "Generating random 32-byte position id..." -ForegroundColor Cyan
$bytes = New-Object 'System.Byte[]' 32; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); $pos = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
Write-Host "Position id: 0x$pos"

Write-Host "\nCalling open_position (simulation + send) ..." -ForegroundColor Cyan
$openCmd = "soroban contract invoke --id $LOANS_ID --fn open_position --arg BytesN:0x$pos --arg Address:$owner --arg BytesN:0x$pos --arg Symbol:USDC --source-account $deployer --network $network --rpc-url $rpc"
Write-Host $openCmd -ForegroundColor Gray

Write-Host "\nNOTE: The command above will actually submit a transaction to Futurenet using the deployer key. Ensure the deployer account is funded and you intend to run this against Futurenet." -ForegroundColor Yellow

$proceed = Read-Host "Run open_position now? (y/N)"
if ($proceed -ne 'y') { Write-Host "Skipped open_position."; exit 0 }

iex $openCmd

Write-Host "\nQuerying position (get_position) ..." -ForegroundColor Cyan
$getCmd = "soroban contract invoke --id $LOANS_ID --fn get_position --arg BytesN:0x$pos --network $network --rpc-url $rpc"
Write-Host $getCmd -ForegroundColor Gray
iex $getCmd

Write-Host "Test finished." -ForegroundColor Green
