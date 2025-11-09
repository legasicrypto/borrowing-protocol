import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CustomTooltip } from "./CustomTooltip";

interface PortfolioChartProps {
  data: Array<{
    date: string;
    value: number;
    borrowed: number;
  }>;
}

export function PortfolioChart({ data }: PortfolioChartProps) {
  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <CardTitle>Portfolio Evolution</CardTitle>
        <CardDescription>Collateral value vs borrowed amount</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: "hsl(var(--foreground))" }}
              iconSize={16}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#14F195"
              strokeWidth={3}
              name="Collateral Value"
              dot={{ fill: "#14F195", r: 5 }}
              activeDot={{ r: 7, className: "drop-shadow-[0_0_8px_rgba(20,241,149,0.6)]" }}
            />
            <Line
              type="monotone"
              dataKey="borrowed"
              stroke="#FF5722"
              strokeWidth={3}
              name="Borrowed Amount"
              dot={{ fill: "#FF5722", r: 5 }}
              activeDot={{ r: 7, className: "drop-shadow-[0_0_8px_rgba(255,87,34,0.6)]" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
