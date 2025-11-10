declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SOROBAN_RPC_URL: string;
      NEXT_PUBLIC_CONTRACT_ID: string;
      NEXT_PUBLIC_NETWORK: string;
      NEXT_PUBLIC_HORIZON_URL: string;
    }
  }
}

// Soroban Configuration
export const SOROBAN_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID || '', // Will be set after deployment
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  network: process.env.NEXT_PUBLIC_NETWORK || 'testnet',
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
} as const;

// Transaction Configuration
export const TX_CONFIG = {
  timeout: 30, // seconds
  pollingInterval: 2000, // milliseconds
} as const;