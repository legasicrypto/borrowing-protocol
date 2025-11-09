import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBarLtv } from "@/components/ui/ProgressBarLtv";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import solLogo from "@/assets/sol-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import eurcLogo from "@/assets/eurc-logo.png";

interface LoanCardProps {
  collateralType: string;
  collateralAmount: number;
  borrowedEur: number;
  borrowCurrency: "USDC" | "EURC";
  ltvRatio: number;
  healthFactor: number;
  interestRate: number;
  autoTopUpEnabled?: boolean;
  onRepay: () => void;
  onAddCollateral: () => void;
  onCloseLoan?: () => void;
}

export function LoanCard({
  collateralType,
  collateralAmount,
  borrowedEur,
  borrowCurrency,
  ltvRatio,
  healthFactor,
  interestRate,
  autoTopUpEnabled,
  onRepay,
  onAddCollateral,
  onCloseLoan,
}: LoanCardProps) {
  const getHealthStatus = () => {
    if (healthFactor >= 1.5) return "healthy";
    if (healthFactor >= 1.2) return "warning";
    return "critical";
  };

  const getLogo = () => {
    return collateralType === "SOL" ? solLogo : usdcLogo;
  };

  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <img src={getLogo()} alt={collateralType} className="h-5 w-5" />
            {collateralType} Loan
          </CardTitle>
          <div className="flex items-center gap-2">
            <RiskBadge status={getHealthStatus()} />
            {autoTopUpEnabled && (
              <div className="flex items-center gap-1.5 bg-legasi-green/20 border border-legasi-green/40 rounded-full px-3 py-1">
                <div className="h-1.5 w-1.5 bg-legasi-green rounded-full animate-pulse" />
                <span className="text-xs font-medium text-legasi-green">
                  Auto-Top-Up
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Collateral</p>
            <p className="text-2xl font-bold text-foreground">
              {collateralAmount.toFixed(4)} {collateralType}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Borrowed</p>
            <p className="text-2xl font-bold text-foreground flex items-center gap-2">
              <img src={borrowCurrency === "USDC" ? usdcLogo : eurcLogo} alt={borrowCurrency} className="h-5 w-5" />
              {borrowedEur.toLocaleString()} {borrowCurrency}
            </p>
          </div>
        </div>

        <ProgressBarLtv value={ltvRatio} />

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Health Factor</p>
            <p className="text-lg font-semibold text-foreground flex items-center gap-1">
              {healthFactor.toFixed(2)}
              {healthFactor >= 1.5 ? (
                <TrendingUp className="h-4 w-4 text-legasi-green" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Interest Rate</p>
            <p className="text-lg font-semibold text-foreground">{interestRate}%</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={onRepay} variant="default" className="flex-1">
            <DollarSign className="h-4 w-4 mr-2" />
            Repay
          </Button>
          <Button onClick={onAddCollateral} variant="outline" className="flex-1">
            Add Collateral
          </Button>
          {onCloseLoan && (
            <Button onClick={onCloseLoan} variant="destructive" className="flex-1">
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
