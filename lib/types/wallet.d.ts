declare global {
  interface Window {
    freighter?: {
      configure: (params: {
        networkName: string;
        networkPassphrase: string;
        sorobanRpcUrl: string;
      }) => Promise<void>;
      signTransaction: (xdr: string) => Promise<string>;
    };
    xBullSDK?: {
      connect: (params: { network: string }) => Promise<void>;
      signTransaction: (xdr: string) => Promise<string>;
    };
    rabet?: {
      connect: () => Promise<void>;
      signTransaction: (xdr: string) => Promise<string>;
    };
  }
}