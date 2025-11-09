import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import solLogo from "@/assets/sol-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";

interface AddCollateralModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  collateralType: string;
  currentCollateral: number;
  currentLtv: number;
  borrowedAmount: number;
  cryptoPrice: number;
  availableBalance: number;
}

export function AddCollateralModal({
  open,
  onClose,
  onConfirm,
  collateralType,
  currentCollateral,
  currentLtv,
  borrowedAmount,
  cryptoPrice,
  availableBalance,
}: AddCollateralModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const collateralAmount = parseFloat(amount);
    if (isNaN(collateralAmount) || collateralAmount <= 0) {
      return;
    }

    setLoading(true);
    await onConfirm(collateralAmount);
    setLoading(false);
    setAmount("");
    onClose();
  };

  const additionalAmount = parseFloat(amount || "0");
  const newCollateral = currentCollateral + additionalAmount;
  const newCollateralValue = newCollateral * cryptoPrice;
  const newLtv = (borrowedAmount / newCollateralValue) * 100;

  const getCollateralLogo = () => {
    return collateralType === "SOL" ? solLogo : usdcLogo;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-legasi-orange" />
            Add Collateral
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            Enter the amount of 
            <img src={getCollateralLogo()} alt={collateralType} className="w-4 h-4 inline" />
            {collateralType} you want to add
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to add ({collateralType})</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.0000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.0001"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmount(availableBalance.toString())}
                className="px-4"
              >
                Max
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Current collateral: 
              <img src={getCollateralLogo()} alt={collateralType} className="w-3 h-3 inline" />
              {currentCollateral.toFixed(4)} {collateralType}
            </p>
            <p className="text-xs text-legasi-green font-semibold flex items-center gap-1">
              Available: 
              <img src={getCollateralLogo()} alt={collateralType} className="w-3 h-3 inline" />
              {availableBalance.toFixed(4)} {collateralType}
            </p>
          </div>

          {amount && parseFloat(amount) > 0 && (
            <>
              {/* Collateral Increase Progress Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Collateral increase</span>
                  <span className="font-semibold text-legasi-green">
                    +{Math.round((additionalAmount / currentCollateral) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-legasi-green to-green-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (additionalAmount / currentCollateral) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-background rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current LTV</span>
                <span className="font-semibold">{currentLtv.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Collateral</span>
                <span className="font-semibold flex items-center gap-1">
                  <img src={getCollateralLogo()} alt={collateralType} className="w-3 h-3" />
                  {newCollateral.toFixed(4)} {collateralType}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New LTV</span>
                <span className="font-semibold text-legasi-green">{newLtv.toFixed(2)}%</span>
              </div>
            </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? "Processing..." : "Add Collateral"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
