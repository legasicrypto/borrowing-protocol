import { WalletType } from '@/lib/stellar/wallet';
import { NETWORK_CONFIG } from '@/lib/soroban/config';

export async function initializeWalletConnection(walletType: WalletType) {
  // Default network config
  const networkConfig = {
    networkPassphrase: NETWORK_CONFIG.network === 'mainnet' 
      ? 'Public Global Stellar Network ; September 2015'
      : 'Test SDF Network ; September 2015',
    networkUrl: NETWORK_CONFIG.horizonUrl,
    sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL
  };

  try {
    let wallet;
    switch (walletType) {
      case 'freighter':
        // Ensure Freighter is installed
        if (!(window as any).freighter) {
          throw new Error('Freighter not installed');
        }
        await (window as any).freighter.configure({
          networkName: NETWORK_CONFIG.network,
          networkPassphrase: networkConfig.networkPassphrase,
          sorobanRpcUrl: networkConfig.sorobanRpcUrl,
        });
        break;

      case 'albedo':
        // Albedo is web-based, no installation needed
        break;

      case 'xbull':
        if (!(window as any).xBullSDK) {
          throw new Error('xBull not installed');
        }
        await (window as any).xBullSDK.connect({
          network: NETWORK_CONFIG.network,
        });
        break;

      case 'rabet':
        if (!(window as any).rabet) {
          throw new Error('Rabet not installed');
        }
        await (window as any).rabet.connect();
        break;

      default:
        throw new Error('Unsupported wallet type');
    }

    console.log(`[v0] ${walletType} wallet initialized successfully`);
    return true;
  } catch (error) {
    console.error(`[v0] Failed to initialize ${walletType} wallet:`, error);
    throw error;
  }
}