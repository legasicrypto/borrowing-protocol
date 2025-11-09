/// <reference types="vite/client" />

interface PhantomProvider {
  isPhantom?: boolean;
  isConnected: boolean;
  publicKey: {
    toString(): string;
    toBytes(): Uint8Array;
  } | null;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, display?: string): Promise<{ signature: Uint8Array }>;
  on(event: string, callback: (args: any) => void): void;
  request(args: { method: string; params?: any }): Promise<any>;
}

interface Window {
  phantom?: {
    solana?: PhantomProvider;
  };
  solana?: PhantomProvider;
}
