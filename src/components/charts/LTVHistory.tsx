import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CustomTooltip } from "./CustomTooltip";

interface LTVHistoryProps {
  data: Array<{
    date: string;
    ltv: number;
  }>;
}

export function LTVHistory({ data }: LTVHistoryProps) {
  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <CardTitle>LTV History</CardTitle>
        <CardDescription>Loan-to-Value ratio over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorLtv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5722" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FF5722" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="dangerZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF5350" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#EF5350" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={60} 
              stroke="#FFA726" 
              strokeDasharray="3 3" 
              label={{ value: "60% Warning", fill: "#FFA726", position: "right" }}
            />
            <ReferenceLine 
              y={75} 
              stroke="#EF5350" 
              strokeDasharray="3 3" 
              label={{ value: "75% Critical", fill: "#EF5350", position: "right" }}
            />
            <Area
              type="monotone"
              dataKey="ltv"
              stroke="#FF5722"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorLtv)"
              name="LTV %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
