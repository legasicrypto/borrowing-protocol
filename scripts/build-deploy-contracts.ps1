# PowerShell script for building and deploying Soroban contracts

param(
    [Parameter(Position=0)]
    [ValidateSet('build', 'deploy', 'clean')]
    [string]$Command = 'build'
)

$ErrorActionPreference = 'Stop'

# Verify required tools
function Test-Requirements {
    $tools = @(
        @{Name='rustc'; Cmd='rustc --version'},
        @{Name='cargo'; Cmd='cargo --version'},
        @{Name='soroban'; Cmd='soroban --version'}
    )

    foreach ($tool in $tools) {
        Write-Host "Checking for $($tool.Name)..."
        try {
            Invoke-Expression $tool.Cmd | Out-Null
        } catch {
            Write-Error "❌ $($tool.Name) not found. Please install it first. See SETUP_CONTRACTS.md for instructions."
            exit 1
        }
    }
}

# Load environment variables
function Import-EnvFile {
    if (Test-Path .env.local) {
        Get-Content .env.local | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $key = $matches[1]
                $value = $matches[2]
                [Environment]::SetEnvironmentVariable($key, $value)
            }
        }
    }
}

# Build all contracts
function Build-Contracts {
    Write-Host "📦 Building contracts..."
    
    $contracts = @('loans', 'policy_registry', 'price_adapter', 'liquidation_manager')
    
    Push-Location contracts
    try {
        foreach ($contract in $contracts) {
            Write-Host "Building $contract..."
            Push-Location $contract
            try {
                soroban contract build
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to build $contract"
                }
            } finally {
                Pop-Location
            }
        }
    } finally {
        Pop-Location
    }
    
    Write-Host "✅ All contracts built successfully!"
}

# Deploy contracts to testnet
function Deploy-Contracts {
    if (-not $env:DEPLOYER_SECRET_KEY) {
        Write-Error "❌ DEPLOYER_SECRET_KEY not set in .env.local"
        exit 1
    }

    Write-Host "🌐 Deploying contracts to testnet..."
    
    $network = "testnet"
    $rpcUrl = "https://soroban-testnet.stellar.org"
    $contractIds = @{}

    Push-Location contracts
    try {
        # Deploy each contract and capture its ID
        $contracts = @(
            @{Name='policy_registry'; Path='policy_registry/target/wasm32-unknown-unknown/release/policy_registry.wasm'},
            @{Name='price_adapter'; Path='price_adapter/target/wasm32-unknown-unknown/release/price_adapter.wasm'},
            @{Name='liquidation_manager'; Path='liquidation_manager/target/wasm32-unknown-unknown/release/liquidation_manager.wasm'},
            @{Name='loans'; Path='loans/target/wasm32-unknown-unknown/release/loans.wasm'}
        )

        foreach ($contract in $contracts) {
            Write-Host "Deploying $($contract.Name)..."
            $result = soroban contract deploy --wasm $contract.Path --source-account $env:DEPLOYER_SECRET_KEY --network $network --rpc-url $rpcUrl
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to deploy $($contract.Name)"
            }
            $contractIds[$contract.Name] = $result.Trim()
            Write-Host "$($contract.Name) deployed: $($contractIds[$contract.Name])"
        }
    } finally {
        Pop-Location
    }

    # Output contract IDs in .env format
    Write-Host "`nAdd these to your .env.local:`n"
    Write-Host "NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT=$($contractIds['loans'])"
    Write-Host "NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT=$($contractIds['liquidation_manager'])"
    Write-Host "NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT=$($contractIds['policy_registry'])"
    Write-Host "NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT=$($contractIds['price_adapter'])"
}

# Clean build artifacts
function Clean-Contracts {
    Write-Host "🧹 Cleaning contract build artifacts..."
    
    Push-Location contracts
    try {
        Get-ChildItem -Directory | ForEach-Object {
            Push-Location $_
            try {
                if (Test-Path target) {
                    Remove-Item -Recurse -Force target
                }
            } finally {
                Pop-Location
            }
        }
    } finally {
        Pop-Location
    }
    
    Write-Host "✅ Clean complete"
}

# Main script execution
Test-Requirements
Import-EnvFile

switch ($Command) {
    'build' { Build-Contracts }
    'deploy' { Deploy-Contracts }
    'clean' { Clean-Contracts }
}