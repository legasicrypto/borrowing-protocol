import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { ArrowRightLeft, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface SwapEurcToEurModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  eurcBalance: number;
  eurBalance: number;
  onSwapComplete?: () => void;
}

export function SwapEurcToEurModal({
  open,
  onClose,
  userId,
  eurcBalance,
  eurBalance,
  onSwapComplete,
}: SwapEurcToEurModalProps) {
  const [eurcAmount, setEurcAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const EXCHANGE_RATE = 1.0; // 1 EURC = 1 EUR (stablecoin parity)
  const SWAP_FEE_PERCENT = 0.5; // 0.5% de frais

  const calculateEurAmount = (eurc: number) => {
    const feeAmount = eurc * (SWAP_FEE_PERCENT / 100);
    const eurcAfterFee = eurc - feeAmount;
    return eurcAfterFee * EXCHANGE_RATE;
  };

  const handleSwap = async () => {
    const swapAmount = parseFloat(eurcAmount);

    if (isNaN(swapAmount) || swapAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (swapAmount > eurcBalance) {
      toast.error("Amount exceeds available EURC balance");
      return;
    }

    setIsProcessing(true);

    try {
      const eurAmount = calculateEurAmount(swapAmount);
      const newEurcBalance = eurcBalance - swapAmount;
      const newEurBalance = eurBalance + eurAmount;

      // Update balances
      const { error: updateError } = await supabase
        .from("user_bank_accounts")
        .update({
          eurc_balance: newEurcBalance,
          eur_balance: newEurBalance,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "swap",
        amount: swapAmount,
        currency: "EURC",
        status: "success",
      });

      if (onSwapComplete) {
        await onSwapComplete();
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(`${swapAmount} EURC swapped to €${eurAmount.toFixed(2)}!`, {
        description: `Fee: ${(swapAmount * (SWAP_FEE_PERCENT / 100)).toFixed(2)} EURC (${SWAP_FEE_PERCENT}%)`,
      });

      setEurcAmount("");
      onClose();
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Swap failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const eurAmount = eurcAmount ? calculateEurAmount(parseFloat(eurcAmount)) : 0;
  const feeAmount = eurcAmount ? parseFloat(eurcAmount) * (SWAP_FEE_PERCENT / 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-legasi-orange" />
            Swap EURC to EUR
          </DialogTitle>
          <DialogDescription>
            Convert your borrowed EURC to EUR before making a bank transfer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-background rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available EURC balance:</span>
              <span className="font-semibold">{eurcBalance.toFixed(2)} EURC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange rate:</span>
              <span className="font-semibold">1 EURC = €{EXCHANGE_RATE}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Swap fee:</span>
              <span className="font-semibold text-orange-500">{SWAP_FEE_PERCENT}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eurc-amount">Amount to swap (EURC)</Label>
            <div className="flex gap-2">
              <Input
                id="eurc-amount"
                type="number"
                placeholder="0.00"
                value={eurcAmount}
                onChange={(e) => setEurcAmount(e.target.value)}
                max={eurcBalance}
                step="0.01"
                className="font-mono flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => setEurcAmount(eurcBalance.toString())}
                disabled={eurcBalance <= 0}
              >
                Max
              </Button>
            </div>
            <Slider
              value={[parseFloat(eurcAmount) || 0]}
              min={0}
              max={eurcBalance}
              step={0.01}
              onValueChange={(value) => setEurcAmount(value[0].toString())}
              className="w-full"
              disabled={eurcBalance <= 0}
            />
          </div>

          {eurcAmount && parseFloat(eurcAmount) > 0 && (
            <div className="p-4 bg-legasi-orange/10 border border-legasi-orange/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">EURC to swap:</span>
                <span className="font-semibold">{parseFloat(eurcAmount).toFixed(2)} EURC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Swap fee ({SWAP_FEE_PERCENT}%):</span>
                <span className="font-semibold text-orange-500">-{feeAmount.toFixed(2)} EURC</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-legasi-orange/20 pt-2">
                <span>You will receive:</span>
                <span className="text-legasi-green">€{eurAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New EUR balance:</span>
                <span className="font-semibold text-legasi-green">
                  €{(eurBalance + eurAmount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {eurcBalance <= 0 && (
            <div className="flex items-start gap-2 text-orange-500 text-sm p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>No EURC available to swap. Create a loan with EURC first.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSwap}
            disabled={
              isProcessing ||
              !eurcAmount ||
              parseFloat(eurcAmount) <= 0 ||
              parseFloat(eurcAmount) > eurcBalance ||
              eurcBalance <= 0
            }
          >
            {isProcessing ? "Processing..." : "Confirm Swap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}