import { useState } from 'react';
import { signAndSubmitTransaction } from '@/lib/stellar/transaction';

export function useTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const submit = async (xdr: string) => {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const result = await signAndSubmitTransaction(xdr);
      setTxHash(result.hash);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    submit,
    loading,
    error,
    txHash,
  };
}