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

interface SwapUsdToUsdcModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  usdBalance: number;
  onSwapComplete?: () => void;
}

export function SwapUsdToUsdcModal({
  open,
  onClose,
  userId,
  usdBalance,
  onSwapComplete,
}: SwapUsdToUsdcModalProps) {
  const [usdAmount, setUsdAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const EXCHANGE_RATE = 1.0; // 1 USD = 1 USDC (stablecoin parity)
  const SWAP_FEE_PERCENT = 0.5; // 0.5% fee

  const calculateUsdcAmount = (usd: number) => {
    const feeAmount = usd * (SWAP_FEE_PERCENT / 100);
    const usdAfterFee = usd - feeAmount;
    return usdAfterFee * EXCHANGE_RATE;
  };

  const handleSwap = async () => {
    const swapAmount = parseFloat(usdAmount);

    if (isNaN(swapAmount) || swapAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (swapAmount > usdBalance) {
      toast.error("Amount exceeds available USD balance");
      return;
    }

    setIsProcessing(true);

    try {
      const usdcReceived = calculateUsdcAmount(swapAmount);
      const newUsdBalance = usdBalance - swapAmount;

      // Get current USDC balance
      const { data: bankData } = await supabase
        .from("user_bank_accounts")
        .select("usd_balance")
        .eq("user_id", userId)
        .single();

      const currentUsdcBalance = Number(bankData?.usd_balance || 0);
      const newUsdcBalance = currentUsdcBalance + usdcReceived;

      // Update balances: debit USD fiat, credit USDC stablecoin
      const { error: updateError } = await supabase
        .from("user_bank_accounts")
        .update({
          usd_fiat_balance: newUsdBalance,
          usd_balance: newUsdcBalance,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "swap",
        amount: swapAmount,
        currency: "USD",
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

      toast.success(`$${swapAmount} USD swapped to ${usdcReceived.toFixed(2)} USDC!`, {
        description: `Fee: $${(swapAmount * (SWAP_FEE_PERCENT / 100)).toFixed(2)} (${SWAP_FEE_PERCENT}%)`,
      });

      setUsdAmount("");
      onClose();
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Swap failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const usdcAmount = usdAmount ? calculateUsdcAmount(parseFloat(usdAmount)) : 0;
  const feeAmount = usdAmount ? parseFloat(usdAmount) * (SWAP_FEE_PERCENT / 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-legasi-orange" />
            Swap USD to USDC
          </DialogTitle>
          <DialogDescription>
            Convert your USD fiat back to USDC stablecoin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-background rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available USD balance:</span>
              <span className="font-semibold">${usdBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange rate:</span>
              <span className="font-semibold">$1 = {EXCHANGE_RATE} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Swap fee:</span>
              <span className="font-semibold text-orange-500">{SWAP_FEE_PERCENT}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usd-amount">Amount to swap (USD)</Label>
            <div className="flex gap-2">
              <Input
                id="usd-amount"
                type="number"
                placeholder="0.00"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                max={usdBalance}
                step="0.01"
                className="font-mono flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => setUsdAmount(usdBalance.toString())}
                disabled={usdBalance <= 0}
              >
                Max
              </Button>
            </div>
            <Slider
              value={[parseFloat(usdAmount) || 0]}
              min={0}
              max={usdBalance}
              step={0.01}
              onValueChange={(value) => setUsdAmount(value[0].toString())}
              className="w-full"
              disabled={usdBalance <= 0}
            />
          </div>

          {usdAmount && parseFloat(usdAmount) > 0 && (
            <div className="p-4 bg-legasi-orange/10 border border-legasi-orange/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USD to swap:</span>
                <span className="font-semibold">${parseFloat(usdAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Swap fee ({SWAP_FEE_PERCENT}%):</span>
                <span className="font-semibold text-orange-500">-${feeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-legasi-orange/20 pt-2">
                <span>You will receive:</span>
                <span className="text-legasi-green">{usdcAmount.toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          {usdBalance <= 0 && (
            <div className="flex items-start gap-2 text-orange-500 text-sm p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>No USD available to swap. Swap USDC to USD first.</span>
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
              !usdAmount ||
              parseFloat(usdAmount) <= 0 ||
              parseFloat(usdAmount) > usdBalance ||
              usdBalance <= 0
            }
          >
            {isProcessing ? "Processing..." : "Confirm Swap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
