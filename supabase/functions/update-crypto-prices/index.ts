import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    eur: number;
    usd_24h_change: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔄 Starting crypto price update...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch prices from CoinGecko (free API, no key required)
    const cryptoIds = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      USDC: "usd-coin",
    };

    const ids = Object.values(cryptoIds).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,eur&include_24hr_change=true`;

    console.log(`📡 Fetching prices from CoinGecko...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data: CoinGeckoPrice = await response.json();
    console.log("💰 Received prices:", JSON.stringify(data, null, 2));

    // Insert prices into database
    const priceInserts = [];
    for (const [symbol, coinId] of Object.entries(cryptoIds)) {
      const priceData = data[coinId];
      if (priceData) {
        priceInserts.push({
          symbol,
          price_usd: priceData.usd,
          price_eur: priceData.eur,
          change_24h: priceData.usd_24h_change || 0,
          recorded_at: new Date().toISOString(),
        });
      }
    }

    if (priceInserts.length === 0) {
      throw new Error("No price data received from CoinGecko");
    }

    console.log(`💾 Inserting ${priceInserts.length} prices into database...`);
    const { error: insertError } = await supabase
      .from("crypto_prices")
      .insert(priceInserts);

    if (insertError) {
      console.error("❌ Error inserting prices:", insertError);
      throw insertError;
    }

    console.log("✅ Successfully updated crypto prices");

    return new Response(
      JSON.stringify({
        success: true,
        prices: priceInserts,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error updating crypto prices:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
