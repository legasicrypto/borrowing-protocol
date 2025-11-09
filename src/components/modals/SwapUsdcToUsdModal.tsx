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

interface SwapUsdcToUsdModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  usdcBalance: number;
  onSwapComplete?: () => void;
}

export function SwapUsdcToUsdModal({
  open,
  onClose,
  userId,
  usdcBalance,
  onSwapComplete,
}: SwapUsdcToUsdModalProps) {
  const [usdcAmount, setUsdcAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const EXCHANGE_RATE = 1.0; // 1 USDC = 1 USD (stablecoin parity)
  const SWAP_FEE_PERCENT = 0.5; // 0.5% de frais

  const calculateUsdAmount = (usdc: number) => {
    const feeAmount = usdc * (SWAP_FEE_PERCENT / 100);
    const usdcAfterFee = usdc - feeAmount;
    return usdcAfterFee * EXCHANGE_RATE;
  };

  const handleSwap = async () => {
    const swapAmount = parseFloat(usdcAmount);

    if (isNaN(swapAmount) || swapAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (swapAmount > usdcBalance) {
      toast.error("Amount exceeds available USDC balance");
      return;
    }

    setIsProcessing(true);

    try {
      const usdAmount = calculateUsdAmount(swapAmount);
      const newUsdcBalance = usdcBalance - swapAmount;

      // Get current USD fiat balance
      const { data: bankData } = await supabase
        .from("user_bank_accounts")
        .select("usd_fiat_balance")
        .eq("user_id", userId)
        .single();

      const currentUsdFiatBalance = Number(bankData?.usd_fiat_balance || 0);
      const newUsdFiatBalance = currentUsdFiatBalance + usdAmount;

      // Update balances: debit USDC stablecoin, credit USD fiat
      const { error: updateError } = await supabase
        .from("user_bank_accounts")
        .update({
          usd_balance: newUsdcBalance,
          usd_fiat_balance: newUsdFiatBalance,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "swap",
        amount: swapAmount,
        currency: "USDC",
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

      toast.success(`${swapAmount} USDC swapped to $${usdAmount.toFixed(2)} USD!`, {
        description: `Fee: ${(swapAmount * (SWAP_FEE_PERCENT / 100)).toFixed(2)} USDC (${SWAP_FEE_PERCENT}%)`,
      });

      setUsdcAmount("");
      onClose();
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Swap failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const usdAmount = usdcAmount ? calculateUsdAmount(parseFloat(usdcAmount)) : 0;
  const feeAmount = usdcAmount ? parseFloat(usdcAmount) * (SWAP_FEE_PERCENT / 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-legasi-orange" />
            Swap USDC to USD
          </DialogTitle>
          <DialogDescription>
            Convert your borrowed USDC to USD fiat currency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-background rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available USDC balance:</span>
              <span className="font-semibold">{usdcBalance.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange rate:</span>
              <span className="font-semibold">1 USDC = ${EXCHANGE_RATE}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Swap fee:</span>
              <span className="font-semibold text-orange-500">{SWAP_FEE_PERCENT}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usdc-amount">Amount to swap (USDC)</Label>
            <div className="flex gap-2">
              <Input
                id="usdc-amount"
                type="number"
                placeholder="0.00"
                value={usdcAmount}
                onChange={(e) => setUsdcAmount(e.target.value)}
                max={usdcBalance}
                step="0.01"
                className="font-mono flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => setUsdcAmount(usdcBalance.toString())}
                disabled={usdcBalance <= 0}
              >
                Max
              </Button>
            </div>
            <Slider
              value={[parseFloat(usdcAmount) || 0]}
              min={0}
              max={usdcBalance}
              step={0.01}
              onValueChange={(value) => setUsdcAmount(value[0].toString())}
              className="w-full"
              disabled={usdcBalance <= 0}
            />
          </div>

          {usdcAmount && parseFloat(usdcAmount) > 0 && (
            <div className="p-4 bg-legasi-orange/10 border border-legasi-orange/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USDC to swap:</span>
                <span className="font-semibold">{parseFloat(usdcAmount).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Swap fee ({SWAP_FEE_PERCENT}%):</span>
                <span className="font-semibold text-orange-500">-{feeAmount.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-legasi-orange/20 pt-2">
                <span>You will receive:</span>
                <span className="text-legasi-green">${usdAmount.toFixed(2)} USD</span>
              </div>
            </div>
          )}

          {usdcBalance <= 0 && (
            <div className="flex items-start gap-2 text-orange-500 text-sm p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>No USDC available to swap. Create a loan with USDC first.</span>
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
              !usdcAmount ||
              parseFloat(usdcAmount) <= 0 ||
              parseFloat(usdcAmount) > usdcBalance ||
              usdcBalance <= 0
            }
          >
            {isProcessing ? "Processing..." : "Confirm Swap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
