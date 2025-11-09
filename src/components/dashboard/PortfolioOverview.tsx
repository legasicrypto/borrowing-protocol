import { Wallet, TrendingUp, DollarSign, Activity } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

interface PortfolioOverviewProps {
  totalCollateral: number;
  totalBorrowed: number;
  avgLtv: number;
  activeLoans: number;
}

export function PortfolioOverview({
  totalCollateral,
  totalBorrowed,
  avgLtv,
  activeLoans,
}: PortfolioOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Collateral"
        value={totalCollateral}
        prefix="$"
        decimals={2}
        icon={Wallet}
      />
      <StatCard
        title="Total Borrowed"
        value={totalBorrowed}
        prefix="$"
        decimals={2}
        icon={DollarSign}
      />
      <StatCard
        title="Average LTV"
        value={avgLtv}
        suffix="%"
        decimals={1}
        icon={TrendingUp}
      />
      <StatCard
        title="Active Loans"
        value={activeLoans}
        icon={Activity}
      />
    </div>
  );
}
