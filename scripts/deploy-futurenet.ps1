<#
PowerShell helper to build contracts and (optionally) deploy them to Futurenet.

Usage:
  - Set the deployer secret key in env var: $env:DEPLOYER_SECRET_KEY
  - From repo root: pwsh .\scripts\deploy-futurenet.ps1

This script will:
  1. Build all contracts found under ./contracts that contain a Cargo.toml
  2. List discovered release WASM files
  3. Print recommended `soroban contract deploy` commands for each wasm
  4. Optionally execute deployments and capture outputs
#>

param(
    [switch]$DeployAutomatically
)

if (-not $env:DEPLOYER_SECRET_KEY) {
    Write-Host "Environment variable DEPLOYER_SECRET_KEY is not set. Please set it and re-run." -ForegroundColor Yellow
    Write-Host "Example (PowerShell):`n$env:DEPLOYER_SECRET_KEY = 'S...'
" -ForegroundColor Gray
    exit 1
}

$deployer = $env:DEPLOYER_SECRET_KEY
$rpc = "https://soroban-futurenet.stellar.org"
$network = "futurenet"

Write-Host "Building contracts in ./contracts ..." -ForegroundColor Cyan

Get-ChildItem -Path .\contracts -Directory | ForEach-Object {
    $dir = $_.FullName
    $cargo = Join-Path $dir 'Cargo.toml'
    if (Test-Path $cargo) {
        Write-Host "Building $($_.Name) ..."
        Push-Location $dir
        soroban contract build
        Pop-Location
    }
}

Write-Host "\nSearching for release WASM files..." -ForegroundColor Cyan
$wasms = Get-ChildItem -Path .\contracts -Recurse -Filter '*.wasm' | Where-Object { $_.FullName -match 'release' }
if (-not $wasms) {
    Write-Host "No release wasm files found. Ensure soroban contract build ran successfully." -ForegroundColor Red
    exit 1
}

Write-Host "Found the following WASM files:" -ForegroundColor Green
$index = 0
$wasmList = @()
foreach ($w in $wasms) {
    $index++
    Write-Host "[$index] $($w.FullName)"
    $wasmList += $w.FullName
}

Write-Host "\nRecommended deploy commands:" -ForegroundColor Cyan
$deployCommands = @()
foreach ($w in $wasmList) {
    $cmd = "soroban contract deploy --wasm \"$w\" --source-account $deployer --network $network --rpc-url $rpc"
    Write-Host $cmd -ForegroundColor Gray
    $deployCommands += $cmd
}

if ($DeployAutomatically) {
    Write-Host "\nDeploying automatically per --DeployAutomatically flag..." -ForegroundColor Cyan
    $results = @()
    foreach ($cmd in $deployCommands) {
        Write-Host "Running: $cmd" -ForegroundColor Gray
        $out = iex $cmd 2>&1
        $results += @{ command = $cmd; output = $out -join "`n" }
        Write-Host "Result:" -ForegroundColor Green
        Write-Host $out -ForegroundColor White
    }
    $json = $results | ConvertTo-Json -Depth 5
    $outFile = .\deployed-contracts-futurenet.json
    $json | Out-File -FilePath $outFile -Encoding utf8
    Write-Host "Wrote deployment outputs to $outFile" -ForegroundColor Cyan
} else {
    Write-Host "\nTo deploy, re-run this script with -DeployAutomatically or copy/paste the commands above and run them locally." -ForegroundColor Yellow
}

Write-Host "Done." -ForegroundColor Green
