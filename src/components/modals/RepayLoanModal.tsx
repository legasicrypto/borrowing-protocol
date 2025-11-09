import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, AlertTriangle } from "lucide-react";
import { calculateAccruedInterest } from "@/lib/calculations";

interface RepayLoanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  maxAmount: number;
  currentLtv: number;
  currentBalance: number;
  interestRate: number;
  createdAt: string;
  borrowCurrency: "USDC" | "EURC";
}

export function RepayLoanModal({ open, onClose, onConfirm, maxAmount, currentLtv, currentBalance, interestRate, createdAt, borrowCurrency }: RepayLoanModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  
  const currencySymbol = borrowCurrency === "USDC" ? "$" : "€";
  const currencyLabel = borrowCurrency;

  const handleConfirm = async () => {
    const repayAmount = parseFloat(amount);
    if (isNaN(repayAmount) || repayAmount <= 0 || repayAmount > maxAmount) {
      return;
    }

    setLoading(true);
    await onConfirm(repayAmount);
    setLoading(false);
    setAmount("");
    onClose();
  };

  const repayAmount = parseFloat(amount || "0");
  
  // Calculate proportional interest
  const totalInterestAccrued = calculateAccruedInterest(maxAmount, interestRate, createdAt);
  const repaymentRatio = maxAmount > 0 ? repayAmount / maxAmount : 0;
  const proportionalInterest = totalInterestAccrued * repaymentRatio;
  const totalToDebit = repayAmount + proportionalInterest;
  const newBorrowedAmount = maxAmount - repayAmount;
  const newLtv = maxAmount > 0 ? (newBorrowedAmount / maxAmount) * currentLtv : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-legasi-orange" />
            Repay Loan
          </DialogTitle>
          <DialogDescription>
            Enter the amount you want to repay in {currencyLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to repay ({currencyLabel})</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={Math.min(maxAmount, currentBalance)}
                step="0.01"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmount(Math.min(maxAmount, currentBalance).toString())}
                className="px-4"
              >
                Max
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum: {currencySymbol}{maxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currencyLabel}
            </p>
            <p className="text-xs text-legasi-green font-semibold">
              Available balance: {currencySymbol}{currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currencyLabel}
            </p>
          </div>

          {amount && parseFloat(amount) > 0 && (
            <>
              {/* Debt Repayment Progress Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Debt repayment</span>
                  <span className="font-semibold text-legasi-green">
                    {Math.round((repayAmount / maxAmount) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-legasi-green to-green-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (repayAmount / maxAmount) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-background rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Principal to repay</span>
                  <span className="font-semibold">{currencySymbol}{repayAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proportional interest ({interestRate}% APY)</span>
                  <span className="font-semibold">{currencySymbol}{proportionalInterest.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>Total to debit:</span>
                  <span className="text-legasi-orange">{currencySymbol}{totalToDebit.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="p-4 bg-background rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current debt</span>
                  <span className="font-semibold">{currencySymbol}{maxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New debt (after repay)</span>
                  <span className="font-semibold text-legasi-green">{currencySymbol}{newBorrowedAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="p-4 bg-background rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current LTV</span>
                  <span className="font-semibold">{currentLtv.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New LTV</span>
                  <span className="font-semibold text-legasi-green">{newLtv.toFixed(2)}%</span>
                </div>
              </div>
              
              {totalToDebit > currentBalance && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg text-red-500 bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Insufficient balance! You need {currencySymbol}{(totalToDebit - currentBalance).toFixed(2)} {currencyLabel} more.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              loading ||
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > maxAmount ||
              totalToDebit > currentBalance
            }
          >
            {loading ? "Processing..." : "Confirm Repayment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
