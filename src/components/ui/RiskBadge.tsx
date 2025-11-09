import * as React from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  status: "healthy" | "warning" | "critical" | "active" | "pending" | "verified" | "rejected" | "closed";
  className?: string;
}

export function RiskBadge({ status, className }: RiskBadgeProps) {
  const variants = {
    healthy: { label: "Healthy", color: "bg-legasi-green/20 text-legasi-green border-legasi-green/30" },
    warning: { label: "Warning", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
    critical: { label: "Critical", color: "bg-red-500/20 text-red-500 border-red-500/30" },
    active: { label: "Active", color: "bg-legasi-green/20 text-legasi-green border-legasi-green/30" },
    pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
    verified: { label: "Verified", color: "bg-legasi-green/20 text-legasi-green border-legasi-green/30" },
    rejected: { label: "Rejected", color: "bg-red-500/20 text-red-500 border-red-500/30" },
    closed: { label: "Closed", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
  };

  const variant = variants[status];

  return (
    <Badge className={cn("border", variant.color, className)}>
      {variant.label}
    </Badge>
  );
}
