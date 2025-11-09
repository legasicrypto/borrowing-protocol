import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarLtvProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBarLtv({ value, max = 100, showLabel = true, className }: ProgressBarLtvProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColorClass = () => {
    if (percentage < 60) return "from-legasi-green to-green-400";
    if (percentage < 75) return "from-yellow-500 to-yellow-400";
    return "from-red-500 to-red-400";
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-muted-foreground">LTV Ratio</span>
          <span className="font-semibold text-foreground">{value}%</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full bg-gradient-to-r transition-all duration-500", getColorClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
