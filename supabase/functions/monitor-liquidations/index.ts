import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Loan {
  id: string;
  user_id: string;
  collateral_type: string;
  collateral_amount: number;
  borrowed_usdc: number;
  health_factor: number;
  ltv_ratio: number;
  status: string;
}

interface CryptoPrice {
  symbol: string;
  price_usd: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Starting liquidation monitoring...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active loans
    const { data: loans, error: loansError } = await supabase
      .from('loan_positions')
      .select('*')
      .eq('status', 'active');

    if (loansError) throw loansError;
    console.log(`📊 Found ${loans.length} active loans to monitor`);

    // Get current crypto prices
    const { data: prices, error: pricesError } = await supabase
      .from('crypto_prices')
      .select('symbol, price_usd')
      .in('symbol', ['BTC', 'ETH', 'SOL'])
      .order('recorded_at', { ascending: false })
      .limit(3);

    if (pricesError) throw pricesError;

    const priceMap: Record<string, number> = {};
    prices.forEach((p: CryptoPrice) => {
      priceMap[p.symbol] = p.price_usd;
    });

    console.log("💰 Current prices:", priceMap);

    let warningCount = 0;
    let criticalCount = 0;
    let liquidatedCount = 0;

    // Check each loan
    for (const loan of loans as Loan[]) {
      const currentPrice = priceMap[loan.collateral_type];
      if (!currentPrice) {
        console.warn(`⚠️ No price found for ${loan.collateral_type}`);
        continue;
      }

      // Recalculate health factor with current price
      const collateralValue = loan.collateral_amount * currentPrice;
      const healthFactor = collateralValue / (loan.borrowed_usdc * 1.25); // 80% liquidation threshold

      console.log(`🏦 Loan ${loan.id.substring(0, 8)}: HF = ${healthFactor.toFixed(2)}`);

      // Update health factor in database
      await supabase
        .from('loan_positions')
        .update({ health_factor: healthFactor })
        .eq('id', loan.id);

      // Critical: Liquidate (HF < 1.0)
      if (healthFactor < 1.0) {
        console.log(`🚨 LIQUIDATING loan ${loan.id.substring(0, 8)}`);
        
        // Liquidate the position
        const { error: liquidateError } = await supabase
          .from('loan_positions')
          .update({ status: 'liquidated' })
          .eq('id', loan.id);

        if (!liquidateError) {
          // Record liquidation
          await supabase.from('liquidations').insert({
            loan_id: loan.id,
            user_id: loan.user_id,
            collateral_liquidated: loan.collateral_amount,
            debt_repaid: loan.borrowed_usdc,
            liquidation_price: currentPrice,
          });

          // Record transaction
          await supabase.from('transactions').insert({
            user_id: loan.user_id,
            loan_id: loan.id,
            type: 'liquidation',
            amount: loan.collateral_amount,
            currency: loan.collateral_type,
            status: 'success',
          });

          // Send critical notification
          await supabase.from('notifications').insert({
            user_id: loan.user_id,
            title: '🚨 Position Liquidée',
            message: `Votre prêt a été liquidé. ${loan.collateral_amount.toFixed(4)} ${loan.collateral_type} ont été utilisés pour rembourser ${loan.borrowed_usdc.toFixed(2)} USDC.`,
            type: 'critical',
          });

          liquidatedCount++;
        }
      }
      // Warning: At risk (HF < 1.2)
      else if (healthFactor < 1.2) {
        console.log(`⚠️ WARNING for loan ${loan.id.substring(0, 8)}`);
        
        await supabase.from('notifications').insert({
          user_id: loan.user_id,
          title: '⚠️ Risque de Liquidation',
          message: `Votre position est à risque ! Health Factor: ${healthFactor.toFixed(2)}. Ajoutez du collatéral pour éviter la liquidation.`,
          type: 'warning',
        });
        
        warningCount++;
      }
      // Watch: Needs attention (HF < 1.5)
      else if (healthFactor < 1.5) {
        console.log(`👀 WATCH loan ${loan.id.substring(0, 8)}`);
        
        await supabase.from('notifications').insert({
          user_id: loan.user_id,
          title: '👀 Surveiller la Position',
          message: `Health Factor: ${healthFactor.toFixed(2)}. Envisagez d'ajouter du collatéral pour plus de sécurité.`,
          type: 'info',
        });
        
        criticalCount++;
      }
    }

    const summary = {
      total_loans: loans.length,
      warnings: warningCount,
      critical: criticalCount,
      liquidated: liquidatedCount,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Monitoring complete:", summary);

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
