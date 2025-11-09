import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, CreditCard, Send } from "lucide-react";
import { TransferEurModal } from "@/components/modals/TransferEurModal";
import { TransferUsdModal } from "@/components/modals/TransferUsdModal";
import { SwapEurToEurcModal } from "@/components/modals/SwapEurToEurcModal";
import { SwapUsdToUsdcModal } from "@/components/modals/SwapUsdToUsdcModal";
import { useRealtimeBankAccount } from "@/hooks/useRealtimeBankAccount";

interface FiatManagementProps {
  userId: string;
  onTransactionsUpdate?: () => void;
}

export function FiatManagement({ userId, onTransactionsUpdate }: FiatManagementProps) {
  const { bankAccount, loading, refreshBankAccount } = useRealtimeBankAccount(userId);
  const [personalIban, setPersonalIban] = useState("");
  const [showTransferEurModal, setShowTransferEurModal] = useState(false);
  const [showTransferUsdModal, setShowTransferUsdModal] = useState(false);
  const [showSwapEurToEurcModal, setShowSwapEurToEurcModal] = useState(false);
  const [showSwapUsdToUsdcModal, setShowSwapUsdToUsdcModal] = useState(false);

  const handleCopyIban = async (iban: string) => {
    await navigator.clipboard.writeText(iban);
    toast.success("IBAN copied!");
  };

  const handleAddPersonalIban = async () => {
    if (!personalIban.trim()) {
      toast.error("Please enter a valid IBAN");
      return;
    }

    // Simple IBAN validation (format DE + 20 digits)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    if (!ibanRegex.test(personalIban.replace(/\s/g, ""))) {
      toast.error("Invalid IBAN format");
      return;
    }

    const { error } = await supabase
      .from("user_bank_accounts")
      .update({ iban_personal: personalIban.replace(/\s/g, "") })
      .eq("user_id", userId);

    if (error) {
      toast.error("Error adding IBAN");
      return;
    }

    toast.success("Personal IBAN added!");
    setPersonalIban("");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!bankAccount) {
    return (
      <Card className="bg-legasi-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-legasi-orange" />
            Fiat Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete KYC to activate your bank account and start borrowing
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-legasi-orange" />
          Fiat Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* IBAN Legasi */}
        <div>
          <Label className="text-sm text-muted-foreground">Your Legasi IBAN</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={bankAccount.iban_legasi}
              readOnly
              className="font-mono bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopyIban(bankAccount.iban_legasi)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Fiat Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-secondary/10 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">EUR Balance</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">€</span>
              <p className="text-2xl font-bold text-foreground">
                {bankAccount.eur_balance.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-secondary/10 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">USD Balance</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">$</span>
              <p className="text-2xl font-bold text-foreground">
                {bankAccount.usd_fiat_balance.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Swap Back to Stablecoins */}
        <div className="grid grid-cols-2 gap-4">
          {bankAccount.eur_balance > 0 && (
            <Button
              onClick={() => setShowSwapEurToEurcModal(true)}
              variant="outline"
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              EUR → EURC
            </Button>
          )}
          {bankAccount.usd_fiat_balance > 0 && (
            <Button
              onClick={() => setShowSwapUsdToUsdcModal(true)}
              variant="outline"
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              USD → USDC
            </Button>
          )}
        </div>

        {/* IBAN Personnel */}
        {!bankAccount.iban_personal ? (
          <div>
            <Label htmlFor="personal-iban" className="text-sm">
              Add your personal IBAN
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="personal-iban"
                placeholder="DE89 3704 0044 0532 0130 00"
                value={personalIban}
                onChange={(e) => setPersonalIban(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleAddPersonalIban}>
                Add
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Label className="text-sm text-muted-foreground">Your Personal IBAN</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={bankAccount.iban_personal}
                readOnly
                className="font-mono bg-background"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyIban(bankAccount.iban_personal!)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Transfer Buttons */}
        <div className="space-y-2">
          {bankAccount.iban_personal && bankAccount.eur_balance > 0 && (
            <Button
              className="w-full"
              onClick={() => setShowTransferEurModal(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Transfer EUR to your account
            </Button>
          )}
          {bankAccount.iban_personal && bankAccount.usd_fiat_balance > 0 && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setShowTransferUsdModal(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Transfer USD to your account
            </Button>
          )}
        </div>
      </CardContent>

      {/* Transfer Modals */}
      <TransferEurModal
        open={showTransferEurModal}
        onClose={() => setShowTransferEurModal(false)}
        userId={userId}
        ibanPersonal={bankAccount.iban_personal || ""}
        eurBalance={bankAccount.eur_balance}
        onTransferComplete={async () => {
          await refreshBankAccount();
          await onTransactionsUpdate?.();
        }}
      />

      <TransferUsdModal
        open={showTransferUsdModal}
        onClose={() => setShowTransferUsdModal(false)}
        userId={userId}
        ibanPersonal={bankAccount.iban_personal || ""}
        usdBalance={bankAccount.usd_fiat_balance}
        onTransferComplete={async () => {
          await refreshBankAccount();
          await onTransactionsUpdate?.();
        }}
      />

      <SwapEurToEurcModal
        open={showSwapEurToEurcModal}
        onClose={() => setShowSwapEurToEurcModal(false)}
        userId={userId}
        eurBalance={bankAccount.eur_balance}
        onSwapComplete={async () => {
          await refreshBankAccount();
          await onTransactionsUpdate?.();
        }}
      />

      <SwapUsdToUsdcModal
        open={showSwapUsdToUsdcModal}
        onClose={() => setShowSwapUsdToUsdcModal(false)}
        userId={userId}
        usdBalance={bankAccount.usd_fiat_balance}
        onSwapComplete={async () => {
          await refreshBankAccount();
          await onTransactionsUpdate?.();
        }}
      />
    </Card>
  );
}
