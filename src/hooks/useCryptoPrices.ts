import { useState, useEffect } from "react";

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface UseCryptoPricesReturn {
  prices: Record<string, CryptoPrice>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CRYPTO_IDS = {
  SOL: "solana",
  BTC: "bitcoin",
  ETH: "ethereum",
  USDC: "usd-coin",
};

export function useCryptoPrices(): UseCryptoPricesReturn {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const ids = Object.values(CRYPTO_IDS).join(",");
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch crypto prices");
      }

      const data = await response.json();

      const formattedPrices: Record<string, CryptoPrice> = {};
      
      Object.entries(CRYPTO_IDS).forEach(([symbol, id]) => {
        if (data[id]) {
          formattedPrices[symbol] = {
            id,
            symbol,
            name: symbol,
            current_price: data[id].usd,
            price_change_percentage_24h: data[id].usd_24h_change || 0,
          };
        }
      });

      setPrices(formattedPrices);
    } catch (err) {
      console.error("Error fetching crypto prices:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      
      // Fallback to mock data
      setPrices({
        SOL: { id: "solana", symbol: "SOL", name: "Solana", current_price: 142.5, price_change_percentage_24h: 3.2 },
        BTC: { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 67840, price_change_percentage_24h: -1.5 },
        ETH: { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3245, price_change_percentage_24h: 2.1 },
        USDC: { id: "usd-coin", symbol: "USDC", name: "USD Coin", current_price: 1.0, price_change_percentage_24h: 0.0 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Refetch every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { prices, loading, error, refetch: fetchPrices };
}
