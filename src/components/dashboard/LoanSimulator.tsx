import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { GlowButton } from "@/components/ui/GlowButton";
import { useRealtimeCryptoPrices } from "@/hooks/useRealtimeCryptoPrices";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import {
  calculateMaxBorrowable,
  calculateHealthFactor,
  calculateLiquidationPrice,
} from "@/lib/calculations";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import solLogo from "@/assets/sol-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import eurcLogo from "@/assets/eurc-logo.png";

const CRYPTOS = [
  { symbol: "SOL", name: "Solana", logo: solLogo },
  { symbol: "USDC", name: "USD Coin", logo: usdcLogo },
];

export function LoanSimulator() {
  const navigate = useNavigate();
  const { prices, loading } = useRealtimeCryptoPrices();
  const { liquidationThreshold, maxLtvSol, maxLtvUsdc, interestRate, loading: configLoading } = useSystemConfig();
  const [selectedCrypto, setSelectedCrypto] = useState("SOL");
  const [collateralAmount, setCollateralAmount] = useState<string>("100");
  const [borrowPercentage, setBorrowPercentage] = useState<number>(80);
  const [payoutCurrency, setPayoutCurrency] = useState<"USDC" | "EURC">("EURC");
  const MAX_COLLATERAL = 10000;

  // Get real-time EUR/USD exchange rate
  const eurUsdRate = useExchangeRate(prices);

  // LTV dynamique selon le crypto sélectionné
  const ltvRatio = selectedCrypto === "SOL" ? maxLtvSol : maxLtvUsdc;

  const cryptoPrice = prices[selectedCrypto]?.price_usd || 0;
  const priceChange = prices[selectedCrypto]?.change_24h || 0;
  const collateralNum = parseFloat(collateralAmount || "0");
  
  // Calculate collateral value in USD first, then convert to EUR if needed
  const collateralValueUsd = collateralNum * cryptoPrice;
  const collateralValue = payoutCurrency === "EURC" 
    ? collateralValueUsd / eurUsdRate  // Convert USD → EUR
    : collateralValueUsd;              // Keep in USD

  const maxBorrowable = calculateMaxBorrowable(collateralValue, ltvRatio);
  const actualBorrowAmount = maxBorrowable * (borrowPercentage / 100);
  
  // Currency symbol based on payout choice
  const currencySymbol = payoutCurrency === "USDC" ? "$" : "€";
  const healthFactor = calculateHealthFactor(collateralValue, actualBorrowAmount, liquidationThreshold);
  const liquidationPrice = calculateLiquidationPrice(
    actualBorrowAmount,
    collateralNum,
    liquidationThreshold
  );

  const getHealthColor = () => {
    const utilizationRate = (actualBorrowAmount / maxBorrowable) * 100;
    
    if (utilizationRate <= 50) return "text-legasi-green";
    if (utilizationRate <= 75) return "text-yellow-500";
    if (utilizationRate <= 90) return "text-orange-500";
    return "text-red-500";
  };

  const getHealthStatus = () => {
    const utilizationRate = (actualBorrowAmount / maxBorrowable) * 100;
    
    if (utilizationRate <= 50) return "Very Healthy";
    if (utilizationRate <= 75) return "Healthy";
    if (utilizationRate <= 90) return "Warning";
    return "At Risk";
  };

  return (
    <section id="simulator" className="py-12 px-6 bg-legasi-dark">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Simulate Your Loan</h2>
          <p className="text-xl text-muted-foreground">
            Simulate your loan in real-time
          </p>
        </motion.div>

        <Card className="bg-legasi-card border-2 border-legasi-orange/30">
          <CardHeader>
            <CardTitle className="text-2xl">Simulate Your Loan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Crypto Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Select Collateral
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CRYPTOS.map((crypto) => (
                  <button
                    key={crypto.symbol}
                    onClick={() => setSelectedCrypto(crypto.symbol)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedCrypto === crypto.symbol
                        ? "border-legasi-orange bg-legasi-orange/10"
                        : "border-border hover:border-legasi-orange/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <img src={crypto.logo} alt={crypto.symbol} className="w-6 h-6" />
                      <span className="font-semibold">{crypto.symbol}</span>
                    </div>
                    {!loading && prices[crypto.symbol] && (
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        ${prices[crypto.symbol].price_usd.toLocaleString()}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Live Price Display */}
              {!loading && prices[selectedCrypto] && (
                <div className="flex items-center gap-2 text-sm p-3 bg-background rounded-lg">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-bold text-lg">
                    ${cryptoPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      priceChange > 0 ? "text-legasi-green" : "text-red-500"
                    }`}
                  >
                    {priceChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(priceChange).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {/* Collateral Amount Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Collateral Amount
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  className="text-lg pr-32 h-12"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={() => setCollateralAmount(MAX_COLLATERAL.toString())}
                  className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold bg-legasi-orange hover:bg-legasi-orange/80 rounded transition-colors"
                >
                  Max
                </button>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                  {selectedCrypto}
                </div>
              </div>
              
              {/* Slider pour ajuster le collateral */}
              <div className="px-1">
                <Slider
                  value={[parseFloat(collateralAmount || "0")]}
                  onValueChange={(value) => setCollateralAmount(value[0].toString())}
                  max={MAX_COLLATERAL}
                  step={1}
                  className="w-full"
                />
              </div>
              
              {/* Value in USD */}
              <div className="text-sm text-muted-foreground">
                ≈ ${collateralValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* LTV Display (non-editable) */}
            <div className="p-3 bg-legasi-orange/10 rounded-lg border border-legasi-orange/30">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">LTV Ratio</div>
                  <div className="text-xs text-muted-foreground">{selectedCrypto} Max</div>
                </div>
                <div className="text-2xl font-bold text-legasi-orange">{ltvRatio}%</div>
              </div>
            </div>

            {/* Borrow Amount Control */}
            {collateralValue > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Amount to Borrow
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={actualBorrowAmount.toFixed(0)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value || "0");
                      const percentage = (value / maxBorrowable) * 100;
                      setBorrowPercentage(Math.min(100, Math.max(0, percentage)));
                    }}
                    className="text-lg pr-20 h-12"
                    placeholder="Enter amount"
                    min="0"
                    max={maxBorrowable}
                    step="100"
                  />
                  <button
                    onClick={() => setBorrowPercentage(100)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold bg-legasi-orange hover:bg-legasi-orange/80 rounded transition-colors"
                  >
                    Max
                  </button>
                </div>
                
                {/* Slider pour ajuster le pourcentage d'emprunt */}
                <div className="px-1">
                  <Slider
                    value={[borrowPercentage]}
                    onValueChange={(value) => setBorrowPercentage(value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                {/* Unified Risk Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">Your current borrowing risk</span>
                    <span className={`font-semibold ${
                      borrowPercentage <= 50 ? "text-legasi-green" : 
                      borrowPercentage <= 75 ? "text-yellow-500" : 
                      "text-red-500"
                    }`}>
                      {borrowPercentage <= 50 ? "Low Risk" : 
                       borrowPercentage <= 75 ? "Medium Risk" : 
                       "High Risk"}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        borrowPercentage <= 50 ? "bg-gradient-to-r from-legasi-green to-green-400" : 
                        borrowPercentage <= 75 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" : 
                        "bg-gradient-to-r from-red-500 to-red-400"
                      }`}
                      style={{ width: `${borrowPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{currencySymbol}0</span>
                    <span>{currencySymbol}{actualBorrowAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span>{currencySymbol}{maxBorrowable.toLocaleString(undefined, { maximumFractionDigits: 0 })} max</span>
                  </div>
                </div>
                
                {/* Info Text */}
                <p className="text-xs text-muted-foreground">
                  Max borrowable: {currencySymbol}{maxBorrowable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            )}

            {/* Payout Currency Selector */}
            {collateralValue > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Choose payout currency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPayoutCurrency("USDC")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      payoutCurrency === "USDC"
                        ? "border-legasi-orange bg-legasi-orange/10"
                        : "border-border hover:border-legasi-orange/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <img src={usdcLogo} alt="USDC" className="w-6 h-6" />
                      <span className="font-semibold">USDC</span>
                    </div>
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      Payout in USD
                    </div>
                  </button>

                  <button
                    onClick={() => setPayoutCurrency("EURC")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      payoutCurrency === "EURC"
                        ? "border-legasi-orange bg-legasi-orange/10"
                        : "border-border hover:border-legasi-orange/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <img src={eurcLogo} alt="EURC" className="w-6 h-6" />
                      <span className="font-semibold">EURC</span>
                    </div>
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      Payout in EUR
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Results Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-border">
              <div className="p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">You will borrow</div>
                <div className="text-2xl font-bold text-legasi-orange">
                  {currencySymbol}{actualBorrowAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  of {currencySymbol}{maxBorrowable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} max
                </div>
              </div>

              <div className="p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Interest Rate</div>
                <div className="text-2xl font-bold">{interestRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">APY</div>
              </div>

              <div className="p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Health Factor</div>
                <div className={`text-2xl font-bold ${getHealthColor()}`}>
                  {healthFactor.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getHealthStatus()}
                </div>
              </div>

              <div className="p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Liquidation Price</div>
                <div className="text-2xl font-bold text-red-500">
                  ${liquidationPrice.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{selectedCrypto}</div>
              </div>
            </div>

            {/* CTA Button */}
            <GlowButton
              className="w-full h-12 text-base"
              onClick={() => navigate("/auth")}
            >
              Borrow Now
            </GlowButton>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
