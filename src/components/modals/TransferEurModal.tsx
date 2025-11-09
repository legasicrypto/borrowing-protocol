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
import { Send, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface TransferEurModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  ibanPersonal: string;
  eurBalance: number;
  onTransferComplete?: () => void;
}

export function TransferEurModal({
  open,
  onClose,
  userId,
  ibanPersonal,
  eurBalance,
  onTransferComplete,
}: TransferEurModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const FEES = 2; // Frais fixes de 2€
  const maxTransferable = Math.max(0, eurBalance - FEES);

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (transferAmount > maxTransferable) {
      toast.error(`Amount exceeds available balance. Maximum: €${maxTransferable.toFixed(2)} (after €${FEES} fees)`);
      return;
    }

    const totalCost = transferAmount + FEES;

    setIsProcessing(true);

    try {
      // Get user's IBAN Legasi
      const { data: bankData, error: bankError } = await supabase
        .from("user_bank_accounts")
        .select("iban_legasi")
        .eq("user_id", userId)
        .single();

      if (bankError) throw bankError;

      // Créer le virement
      const { data: transfer, error: transferError } = await supabase
        .from("wire_transfers")
        .insert({
          user_id: userId,
          from_iban: bankData.iban_legasi,
          to_iban: ibanPersonal,
          amount_eur: transferAmount,
          fees_eur: FEES,
          status: "pending",
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Débiter le compte
      const { error: updateError } = await supabase
        .from("user_bank_accounts")
        .update({
          eur_balance: eurBalance - totalCost,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // ✅ Refresh immédiat du solde
      if (onTransferComplete) {
        await onTransferComplete();
      }

      toast.info("Transfer in progress...", {
        duration: 3000,
      });

      // Simulate processing (3 seconds)
      setTimeout(async () => {
        await supabase
          .from("wire_transfers")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", transfer.id);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success(`€${transferAmount} transferred successfully!`, {
          description: `Fees: €${FEES}`,
        });

        setAmount("");
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Transfer error");
      setIsProcessing(false);
    }
  };

  const totalCost = amount ? parseFloat(amount) + FEES : FEES;
  const remainingBalance = eurBalance - totalCost;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-legasi-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-legasi-orange" />
            EUR Transfer to your IBAN
          </DialogTitle>
          <DialogDescription>
            Transfer EUR from your Legasi account to your personal IBAN
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-background rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available EUR balance:</span>
              <span className="font-semibold">€{eurBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer fees:</span>
              <span className="font-semibold text-red-500">€{FEES.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span>Maximum transferable:</span>
              <span className="text-legasi-green">€{maxTransferable.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to transfer (EUR)</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={maxTransferable}
                step="0.01"
                className="font-mono flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => setAmount(maxTransferable.toString())}
                disabled={maxTransferable <= 0}
              >
                Max
              </Button>
            </div>
            <Slider
              value={[parseFloat(amount) || 0]}
              min={0}
              max={maxTransferable}
              step={0.01}
              onValueChange={(value) => setAmount(value[0].toString())}
              className="w-full"
              disabled={maxTransferable <= 0}
            />
            <p className="text-xs text-muted-foreground">
              Maximum: €{maxTransferable.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Destination IBAN</Label>
            <Input value={ibanPersonal} readOnly className="font-mono bg-background" />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="p-4 bg-legasi-orange/10 border border-legasi-orange/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">€{parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fees:</span>
                <span className="font-semibold">€{FEES.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-legasi-orange/20 pt-2">
                <span>Total debited:</span>
                <span className="text-legasi-orange">€{totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance after transfer:</span>
                <span className={`font-semibold ${remainingBalance >= 0 ? "text-legasi-green" : "text-red-500"}`}>
                  €{remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {maxTransferable <= 0 && (
            <div className="flex items-start gap-2 text-red-500 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Insufficient balance to make a transfer (minimum €{FEES} in fees)</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={
              isProcessing || 
              !amount || 
              parseFloat(amount) <= 0 || 
              parseFloat(amount) > maxTransferable ||
              maxTransferable <= 0
            }
          >
            {isProcessing ? "Processing..." : "Confirm Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
