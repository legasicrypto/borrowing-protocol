import { SorobanRpc } from 'stellar-sdk';
import { SOROBAN_CONFIG } from './config';

export async function submitTransaction(signedXDR: string) {
  try {
    const server = new SorobanRpc.Server(SOROBAN_CONFIG.rpcUrl, {
      allowHttp: SOROBAN_CONFIG.rpcUrl.startsWith('http:'),
    });

    // Send transaction
    const sendResponse = await server.sendTransaction(signedXDR);
    
    if (sendResponse.status !== 'PENDING') {
      throw new Error(`Transaction failed: ${sendResponse.status}`);
    }

    // Get transaction result
    let getResponse;
    while (true) {
      getResponse = await server.getTransaction(sendResponse.hash);
      
      if (getResponse.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      if (getResponse.status === 'SUCCESS') {
        return {
          success: true,
          hash: sendResponse.hash,
          result: getResponse.resultMetaXdr
        };
      }
      
      if (getResponse.status === 'FAILED') {
        throw new Error(`Transaction failed: ${getResponse.resultXdr}`);
      }
      
      break;
    }

    return {
      success: false,
      hash: sendResponse.hash,
      error: 'Transaction status unknown'
    };
  } catch (error) {
    console.error('Transaction submission error:', error);
    throw error;
  }
}