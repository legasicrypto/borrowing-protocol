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

interface SwapEurToEurcModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  eurBalance: number;
  onSwapComplete?: () => void;
}

export function SwapEurToEurcModal({
  open,
  onClose,
  userId,
  eurBalance,
  onSwapComplete,
}: SwapEurToEurcModalProps) {
  const [eurAmount, setEurAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const EXCHANGE_RATE = 1.0; // 1 EUR = 1 EURC (stablecoin parity)
  const SWAP_FEE_PERCENT = 0.5; // 0.5% fee

  const calculateEurcAmount = (eur: number) => {
    const feeAmount = eur * (SWAP_FEE_PERCENT / 100);
    const eurAfterFee = eur - feeAmount;
    return eurAfterFee * EXCHANGE_RATE;
  };

  const handleSwap = async () => {
    const swapAmount = parseFloat(eurAmount);

    if (isNaN(swapAmount) || swapAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (swapAmount > eurBalance) {
      toast.error("Amount exceeds available EUR balance");
      return;
    }

    setIsProcessing(true);

    try {
      const eurcReceived = calculateEurcAmount(swapAmount);
      const newEurBalance = eurBalance - swapAmount;

      // Get current EURC balance
      const { data: bankData } = await supabase
        .from("user_bank_accounts")
        .select("eurc_balance")
        .eq("user_id", userId)
        .single();

      const currentEurcBalance = Number(bankData?.eurc_balance || 0);
      const newEurcBalance = currentEurcBalance + eurcReceived;

      // Update balances: debit EUR fiat, credit EURC stablecoin
      const { error: updateError } = await supabase
        .from("user_bank_accounts")
        .update({
          eur_balance: newEurBalance,
          eurc_balance: newEurcBalance,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "swap",
        amount: swapAmount,
        currency: "EUR",
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

      toast.success(`€${swapAmount} EUR swapped to ${eurcReceived.toFixed(2)} EURC!`, {
        description: `Fee: €${(swapAmount * (SWAP_FEE_PERCENT / 100)).toFixed(2)} (${SWAP_FEE_PERCENT}%)`,
      });

      setEurAmount("");
      onClose();
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Swap failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const eurcAmount = eurAmount ? calculateEurcAmount(parseFloat(eurAmount)) : 0;
  const feeAmount = eurAmount ? parseFloat(eurAmount) * (SWAP_FEE_PERCENT / 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-legasi-orange" />
            Swap EUR to EURC
          </DialogTitle>
          <DialogDescription>
            Convert your EUR fiat back to EURC stablecoin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-background rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available EUR balance:</span>
              <span className="font-semibold">€{eurBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange rate:</span>
              <span className="font-semibold">€1 = {EXCHANGE_RATE} EURC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Swap fee:</span>
              <span className="font-semibold text-orange-500">{SWAP_FEE_PERCENT}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eur-amount">Amount to swap (EUR)</Label>
            <div className="flex gap-2">
              <Input
                id="eur-amount"
                type="number"
                placeholder="0.00"
                value={eurAmount}
                onChange={(e) => setEurAmount(e.target.value)}
                max={eurBalance}
                step="0.01"
                className="font-mono flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => setEurAmount(eurBalance.toString())}
                disabled={eurBalance <= 0}
              >
                Max
              </Button>
            </div>
            <Slider
              value={[parseFloat(eurAmount) || 0]}
              min={0}
              max={eurBalance}
              step={0.01}
              onValueChange={(value) => setEurAmount(value[0].toString())}
              className="w-full"
              disabled={eurBalance <= 0}
            />
          </div>

          {eurAmount && parseFloat(eurAmount) > 0 && (
            <div className="p-4 bg-legasi-orange/10 border border-legasi-orange/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">EUR to swap:</span>
                <span className="font-semibold">€{parseFloat(eurAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Swap fee ({SWAP_FEE_PERCENT}%):</span>
                <span className="font-semibold text-orange-500">-€{feeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-legasi-orange/20 pt-2">
                <span>You will receive:</span>
                <span className="text-legasi-green">{eurcAmount.toFixed(2)} EURC</span>
              </div>
            </div>
          )}

          {eurBalance <= 0 && (
            <div className="flex items-start gap-2 text-orange-500 text-sm p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>No EUR available to swap. Swap EURC to EUR first.</span>
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
              !eurAmount ||
              parseFloat(eurAmount) <= 0 ||
              parseFloat(eurAmount) > eurBalance ||
              eurBalance <= 0
            }
          >
            {isProcessing ? "Processing..." : "Confirm Swap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
