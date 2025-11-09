import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { calculateHealthFactor } from "@/lib/calculations";
import { AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { CustomTooltip } from "./CustomTooltip";

interface LiquidationPreviewProps {
  currentPrice: number;
  collateralAmount: number;
  borrowedAmount: number;
  liquidationThreshold: number;
  collateralType: string;
}

export function LiquidationPreview({
  currentPrice,
  collateralAmount,
  borrowedAmount,
  liquidationThreshold,
  collateralType,
}: LiquidationPreviewProps) {
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  // Calculate simulated values
  const simulatedPrice = currentPrice * (1 + priceChangePercent / 100);
  const simulatedCollateralValue = collateralAmount * simulatedPrice;
  const simulatedHealthFactor = calculateHealthFactor(
    simulatedCollateralValue,
    borrowedAmount,
    liquidationThreshold
  );

  // Generate chart data
  const chartData = useMemo(() => {
    const data = [];
    for (let change = -50; change <= 20; change += 5) {
      const price = currentPrice * (1 + change / 100);
      const collateralValue = collateralAmount * price;
      const hf = calculateHealthFactor(collateralValue, borrowedAmount, liquidationThreshold);
      data.push({
        priceChange: change,
        healthFactor: Math.min(hf, 5), // Cap at 5 for readability
        liquidationThreshold: 1.0,
      });
    }
    return data;
  }, [currentPrice, collateralAmount, borrowedAmount, liquidationThreshold]);

  // Don't render if no collateral
  if (collateralAmount === 0 || borrowedAmount === 0) {
    return (
      <Card className="bg-legasi-card border-border">
        <CardHeader>
          <CardTitle>Liquidation Preview</CardTitle>
          <CardDescription>Simulate price impact on your position</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No active position to simulate
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <CardTitle>Liquidation Preview</CardTitle>
        <CardDescription>Simulate price impact on Health Factor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-[200px] md:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="priceChange"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                label={{ value: "Price Change (%)", position: "insideBottom", offset: -5, fontSize: 12 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                label={{ value: "Health Factor", angle: -90, position: "insideLeft", fontSize: 12 }}
                domain={[0, 5]}
              />

              {/* Risk zones */}
              <ReferenceArea y1={0} y2={1.0} fill="#EF5350" fillOpacity={0.1} />
              <ReferenceArea y1={1.0} y2={1.2} fill="#FFA726" fillOpacity={0.1} />
              <ReferenceArea y1={1.2} y2={1.5} fill="#FDD835" fillOpacity={0.1} />
              <ReferenceArea y1={1.5} y2={5} fill="#14F195" fillOpacity={0.1} />

              {/* Liquidation threshold line */}
              <ReferenceLine
                y={1.0}
                stroke="#EF5350"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: "Liquidation", position: "right", fill: "#EF5350", fontSize: 10 }}
              />

              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="healthFactor"
                stroke="#14F195"
                strokeWidth={3}
                dot={false}
                name="Health Factor"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Simulate price change</Label>
          <Slider
            value={[priceChangePercent]}
            min={-50}
            max={20}
            step={1}
            onValueChange={(value) => setPriceChangePercent(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-50%</span>
            <span className="font-semibold text-foreground">
              {priceChangePercent > 0 ? "+" : ""}
              {priceChangePercent}%
            </span>
            <span>+20%</span>
          </div>
        </div>

        {/* Simulation Results */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Simulated {collateralType} Price</p>
            <p className="font-mono font-semibold">${simulatedPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">New Health Factor</p>
            <p
              className={cn(
                "font-mono font-semibold text-lg",
                simulatedHealthFactor < 1.0
                  ? "text-red-500"
                  : simulatedHealthFactor < 1.2
                  ? "text-orange-500"
                  : simulatedHealthFactor < 1.5
                  ? "text-yellow-500"
                  : "text-legasi-green"
              )}
            >
              {simulatedHealthFactor.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Warning Alert */}
        {simulatedHealthFactor < 1.2 && (
          <Alert variant={simulatedHealthFactor < 1.0 ? "destructive" : "default"} className="border-orange-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {simulatedHealthFactor < 1.0 ? "Liquidation Risk!" : "Warning"}
            </AlertTitle>
            <AlertDescription>
              {simulatedHealthFactor < 1.0
                ? "At this price level, your position would be liquidated!"
                : "At this price level, your position would be at high risk of liquidation."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
