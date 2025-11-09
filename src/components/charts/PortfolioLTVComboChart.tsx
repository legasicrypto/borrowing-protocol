import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceArea } from "recharts";
import { CustomTooltip } from "./CustomTooltip";

interface PortfolioLTVComboChartProps {
  portfolioData: Array<{
    date: string;
    value: number;
    borrowed: number;
  }>;
  ltvData: Array<{
    date: string;
    ltv: number;
  }>;
  currentPrice: number;
}

export function PortfolioLTVComboChart({ portfolioData, ltvData, currentPrice }: PortfolioLTVComboChartProps) {
  // Merge both datasets by date
  const combinedData = portfolioData.map((portfolio, index) => ({
    date: portfolio.date,
    collateralValue: portfolio.value,
    borrowedAmount: portfolio.borrowed,
    ltv: ltvData[index]?.ltv || 0,
  }));

  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <CardTitle>Portfolio & Risk Evolution</CardTitle>
        <CardDescription>Collateral value and LTV correlation over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={combinedData}>
            <defs>
              <linearGradient id="collateralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14F195" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#14F195" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            
            {/* X Axis */}
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            
            {/* Left Y Axis - Collateral Value ($) */}
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
              label={{ 
                value: "Value ($)", 
                angle: -90, 
                position: "insideLeft",
                style: { fill: "hsl(var(--foreground))" }
              }}
            />
            
            {/* Right Y Axis - LTV (%) */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
              domain={[0, 100]}
              label={{ 
                value: "LTV (%)", 
                angle: 90, 
                position: "insideRight",
                style: { fill: "hsl(var(--foreground))" }
              }}
            />
            
            {/* Risk Zones */}
            <ReferenceArea 
              yAxisId="right" 
              y1={60} 
              y2={75} 
              fill="#FFA726" 
              fillOpacity={0.1} 
            />
            <ReferenceArea 
              yAxisId="right" 
              y1={75} 
              y2={100} 
              fill="#EF5350" 
              fillOpacity={0.15} 
            />
            
            {/* Threshold Lines */}
            <ReferenceLine 
              yAxisId="right" 
              y={60} 
              stroke="#FFA726" 
              strokeDasharray="3 3"
              label={{ 
                value: "60% Warning", 
                fill: "#FFA726", 
                position: "right",
                fontSize: 11
              }}
            />
            <ReferenceLine 
              yAxisId="right" 
              y={75} 
              stroke="#EF5350" 
              strokeDasharray="3 3"
              label={{ 
                value: "75% Critical", 
                fill: "#EF5350", 
                position: "right",
                fontSize: 11
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: "hsl(var(--foreground))" }}
              iconSize={16}
            />
            
            {/* Collateral Value Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="collateralValue"
              stroke="#14F195"
              strokeWidth={3}
              name="Collateral Value ($)"
              dot={{ fill: "#14F195", r: 4 }}
              activeDot={{ r: 6, className: "drop-shadow-[0_0_8px_rgba(20,241,149,0.6)]" }}
            />
            
            {/* Borrowed Amount Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="borrowedAmount"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Borrowed Amount ($)"
              dot={{ fill: "#3B82F6", r: 3 }}
              activeDot={{ r: 5 }}
            />
            
            {/* LTV Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ltv"
              stroke="#FF5722"
              strokeWidth={3}
              name="LTV (%)"
              dot={{ fill: "#FF5722", r: 4 }}
              activeDot={{ r: 6, className: "drop-shadow-[0_0_8px_rgba(255,87,34,0.6)]" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
