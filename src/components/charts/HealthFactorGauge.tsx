import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthFactorGaugeProps {
  healthFactor: number;
}

export function HealthFactorGauge({ healthFactor }: HealthFactorGaugeProps) {
  const getHealthStatus = (hf: number) => {
    if (hf >= 2) return { status: "Excellent", color: "text-legasi-green", bg: "bg-legasi-green/20" };
    if (hf >= 1.5) return { status: "Good", color: "text-green-400", bg: "bg-green-400/20" };
    if (hf >= 1.2) return { status: "Average", color: "text-yellow-500", bg: "bg-yellow-500/20" };
    if (hf >= 1.0) return { status: "Risky", color: "text-orange-500", bg: "bg-orange-500/20" };
    return { status: "Critical", color: "text-red-500", bg: "bg-red-500/20" };
  };

  const { status, color, bg } = getHealthStatus(healthFactor);
  
  // Calculate angle for the gauge (0-180 degrees)
  const maxHF = 3;
  const angle = Math.min((healthFactor / maxHF) * 180, 180);
  
  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <CardTitle>Health Factor</CardTitle>
        <CardDescription>Portfolio risk indicator</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-48 h-24 mb-4">
          {/* Background arc */}
          <svg className="w-full h-full" viewBox="0 0 200 100">
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="14"
              strokeLinecap="round"
              opacity={0.3}
            />
            {/* Colored arc */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke={healthFactor >= 1.5 ? '#14F195' : healthFactor >= 1.2 ? '#FFA726' : '#EF5350'}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * 251} 251`}
              style={{
                filter: `drop-shadow(0px 0px 6px ${healthFactor >= 1.5 ? '#14F195' : healthFactor >= 1.2 ? '#FFA726' : '#EF5350'}40)`
              }}
            />
            {/* Needle */}
            <line
              x1="100"
              y1="90"
              x2={100 + Math.cos((angle - 90) * (Math.PI / 180)) * 70}
              y2={90 + Math.sin((angle - 90) * (Math.PI / 180)) * 70}
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Center dot */}
            <circle cx="100" cy="90" r="6" fill="hsl(var(--foreground))" />
          </svg>
        </div>
        
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold">{healthFactor.toFixed(2)}</div>
          <div className={cn("inline-flex px-3 py-1 rounded-full text-sm font-medium", bg, color)}>
            {status}
          </div>
        </div>
        
        <div className="mt-4 w-full space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Critical (&lt; 1.0)</span>
            <span className="text-red-500">●</span>
          </div>
          <div className="flex justify-between">
            <span>Risky (1.0 - 1.2)</span>
            <span className="text-orange-500">●</span>
          </div>
          <div className="flex justify-between">
            <span>Average (1.2 - 1.5)</span>
            <span className="text-yellow-500">●</span>
          </div>
          <div className="flex justify-between">
            <span>Good (1.5 - 2.0)</span>
            <span className="text-green-400">●</span>
          </div>
          <div className="flex justify-between">
            <span>Excellent (&gt; 2.0)</span>
            <span className="text-legasi-green">●</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
