import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import solLogo from "@/assets/sol-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import { calculateAccruedInterest } from "@/lib/calculations";

interface Loan {
  id: string;
  collateralType: string;
  collateralAmount: number;
  borrowedEur: number;
  borrowCurrency: "USDC" | "EURC";
  interestRate: number;
  createdAt: string;
}

interface CloseLoanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loan: Loan | null;
  currentBalance: number;
}

export function CloseLoanModal({
  open,
  onClose,
  onConfirm,
  loan,
  currentBalance,
}: CloseLoanModalProps) {
  if (!loan) return null;

  const currencySymbol = loan.borrowCurrency === "USDC" ? "$" : "€";
  const currencyLabel = loan.borrowCurrency;

  const interestAccrued = calculateAccruedInterest(
    loan.borrowedEur,
    loan.interestRate,
    loan.createdAt
  );
  const totalToRepay = loan.borrowedEur + interestAccrued;
  const hasEnoughBalance = currentBalance >= totalToRepay;
  const missingAmount = hasEnoughBalance ? 0 : totalToRepay - currentBalance;

  // Calculate days elapsed
  const now = Date.now();
  const created = new Date(loan.createdAt).getTime();
  const daysElapsed = Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)));

  const getCollateralLogo = () => {
    return loan.collateralType === "SOL" ? solLogo : usdcLogo;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Close Loan
          </DialogTitle>
          <DialogDescription>
            This action will fully repay the loan and return your collateral
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-background rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Borrowed amount:</span>
              <span className="font-semibold">{currencySymbol}{loan.borrowedEur.toFixed(2)} {currencyLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Loan duration:</span>
              <span className="font-semibold">{daysElapsed} day{daysElapsed > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Accrued interest ({loan.interestRate}% APY):</span>
              <span className="font-semibold">{currencySymbol}{interestAccrued.toFixed(2)} {currencyLabel}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total to repay:</span>
              <span className="text-legasi-orange">{currencySymbol}{totalToRepay.toFixed(2)} {currencyLabel}</span>
            </div>
          </div>

          <div className="p-4 bg-background rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your {currencyLabel} balance:</span>
              <span className={`font-semibold ${hasEnoughBalance ? 'text-legasi-green' : 'text-red-500'}`}>
                {currencySymbol}{currentBalance.toFixed(2)} {currencyLabel}
              </span>
            </div>
            {!hasEnoughBalance && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Missing amount:</span>
                <span className="font-bold">{currencySymbol}{missingAmount.toFixed(2)} {currencyLabel}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-legasi-green/10 border border-legasi-green/20 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Collateral returned:
            </p>
            <p className="text-lg font-bold text-legasi-green flex items-center gap-2">
              <img src={getCollateralLogo()} alt={loan.collateralType} className="w-5 h-5" />
              {loan.collateralAmount} {loan.collateralType}
            </p>
          </div>

          <div className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
            hasEnoughBalance 
              ? 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/20'
              : 'text-red-500 bg-red-500/10 border border-red-500/20'
          }`}>
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {hasEnoughBalance 
                ? `Make sure you have enough ${currencyLabel} in your balance to close this loan`
                : `You need ${currencySymbol}${missingAmount.toFixed(2)} ${currencyLabel} more to close this loan`
              }
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={!hasEnoughBalance}
          >
            Confirm Closure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
