import { stellarWallet } from './wallet';

interface TransactionResult {
  success: boolean;
  hash: string;
  result?: string;
  error?: string;
}

export async function signAndSubmitTransaction(xdr: string): Promise<TransactionResult> {
  try {
    // Sign the transaction with connected wallet
    const signedXDR = await stellarWallet.signTransaction(xdr);

    // Submit to backend
    const response = await fetch('/api/soroban/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedXDR }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit transaction');
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        hash: result.hash,
        result: result.result
      };
    } else {
      throw new Error(result.error || 'Transaction failed');
    }
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}