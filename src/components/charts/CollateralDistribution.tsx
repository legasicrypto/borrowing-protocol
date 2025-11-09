import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CustomTooltip } from "./CustomTooltip";

interface CollateralDistributionProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = [
  "#FF5722", // Orange Legasi
  "#14F195", // Vert Legasi
  "#9945FF", // Violet Legasi
  "#FFA726", // Orange clair
  "#4FC3F7", // Bleu clair
];

export function CollateralDistribution({ data }: CollateralDistributionProps) {
  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <CardTitle>Collateral Distribution</CardTitle>
        <CardDescription>Distribution by crypto type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              style={{
                filter: "drop-shadow(0px 0px 4px rgba(0,0,0,0.5))",
              }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: "hsl(var(--foreground))" }}
              iconSize={16}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
