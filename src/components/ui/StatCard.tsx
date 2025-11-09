import * as React from "react";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn("bg-legasi-card border border-border rounded-lg p-6", className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {Icon && <Icon className="h-5 w-5 text-legasi-orange" />}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-foreground">
            {prefix}
            <CountUp end={value} decimals={decimals} duration={1} separator="," />
            {suffix}
          </p>
          {trend && (
            <p className={cn("text-sm mt-1", trend.isPositive ? "text-legasi-green" : "text-red-500")}>
              {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
