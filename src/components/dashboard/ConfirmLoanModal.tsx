import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProgressBarLtv } from "@/components/ui/ProgressBarLtv";
import solLogo from "@/assets/sol-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import eurcLogo from "@/assets/eurc-logo.png";

interface ConfirmLoanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loanData: {
    collateralType: string;
    collateralAmount: number;
    borrowAmount: number;
    collateralValue: number;
    maxBorrowable: number;
    metrics: {
      ltvRatio: number;
      healthFactor: number;
      liquidationPrice: number;
    };
    cryptoPrices: number;
    borrowCurrency: "USDC" | "EURC";
    autoTopUpEnabled: boolean;
  };
}

export function ConfirmLoanModal({ open, onClose, onConfirm, loanData }: ConfirmLoanModalProps) {
  const { collateralType, collateralAmount, borrowAmount, collateralValue, maxBorrowable, metrics, cryptoPrices, borrowCurrency } = loanData;

  const getHealthColor = () => {
    const utilizationRate = (borrowAmount / maxBorrowable) * 100;
    if (utilizationRate <= 50) return "text-legasi-green";
    if (utilizationRate <= 75) return "text-yellow-500";
    if (utilizationRate <= 90) return "text-orange-500";
    return "text-red-500";
  };

  const getHealthStatus = () => {
    const utilizationRate = (borrowAmount / maxBorrowable) * 100;
    if (utilizationRate <= 50) return "Very Healthy";
    if (utilizationRate <= 75) return "Healthy";
    if (utilizationRate <= 90) return "Warning";
    return "At Risk";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirm Your Loan</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Loan Summary Card */}
          <div className="bg-legasi-dark/30 border border-border/50 rounded-lg p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="text-lg font-semibold">Loan Summary</h3>
            </div>
            
            <div className="border-t border-border/30 pt-4 space-y-4">
              {/* Collateral Section */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">COLLATERAL</p>
                <div className="flex items-center gap-2">
                  <img src={collateralType === "SOL" ? solLogo : usdcLogo} alt={collateralType} className="w-6 h-6" />
                  <div>
                    <p className="text-xl font-bold">
                      {collateralAmount.toFixed(4)} {collateralType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ≈ ${collateralValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="ml-2 text-xs">
                        @ ${cryptoPrices.toLocaleString()}/{collateralType}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Borrow Section */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">YOU WILL RECEIVE</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={borrowCurrency === "USDC" ? usdcLogo : eurcLogo} alt={borrowCurrency} className="w-6 h-6" />
                    <p className="text-xl font-bold text-legasi-orange">
                      {borrowAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {borrowCurrency}
                    </p>
                  </div>
                  {Math.abs(borrowAmount - maxBorrowable) < 1 && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                      Max Loan
                    </span>
                  )}
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="border-t border-border/30 pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">KEY METRICS</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* LTV Ratio */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">LTV Ratio</p>
                    <p className="text-lg font-bold">{metrics.ltvRatio.toFixed(1)}%</p>
                    <div className="mt-1">
                      <ProgressBarLtv value={metrics.ltvRatio} showLabel={false} />
                    </div>
                  </div>

                  {/* Health Factor */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Health Factor</p>
                    <p className={`text-lg font-bold ${getHealthColor()}`}>
                      {metrics.healthFactor.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getHealthStatus()}
                    </p>
                  </div>

                  {/* Liquidation Price */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Liquidation Price</p>
                    <p className="text-lg font-bold">
                      ${metrics.liquidationPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {collateralType} price
                    </p>
                  </div>

                  {/* Loan Utilization */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Loan Utilization</p>
                    <p className={`text-lg font-bold ${getHealthColor()}`}>
                      {Math.round((borrowAmount / maxBorrowable) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of max capacity
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Warning */}
              {borrowAmount / maxBorrowable > 0.75 && (
                <div className={`border-t border-border/30 pt-4 ${
                  borrowAmount / maxBorrowable > 0.9 
                    ? 'bg-red-500/10 border border-red-500/30' 
                    : 'bg-orange-500/10 border border-orange-500/30'
                } rounded-lg p-3`}>
                  <p className={`text-xs ${
                    borrowAmount / maxBorrowable > 0.9 ? 'text-red-400' : 'text-orange-400'
                  }`}>
                    {borrowAmount / maxBorrowable > 0.9 
                      ? '🔴 CRITICAL: You are borrowing at maximum capacity. Any price drop could trigger liquidation.'
                      : '⚠️ You are borrowing at high capacity. Your position may be at risk if prices drop.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Top-Up Status */}
          {loanData.autoTopUpEnabled && (
            <div className="bg-legasi-green/10 border border-legasi-green/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-legasi-green rounded-full animate-pulse" />
                <span className="text-sm font-medium text-legasi-green">
                  🔄 Auto-Top-Up Enabled
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This loan will automatically use available USDC to maintain Health Factor above 1.5
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Back
            </Button>
            <Button onClick={onConfirm} className="flex-1 bg-legasi-orange hover:bg-legasi-orange/80">
              Confirm My Loan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
