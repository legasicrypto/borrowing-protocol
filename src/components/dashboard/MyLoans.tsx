import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { useRealtimeBankAccount } from "@/hooks/useRealtimeBankAccount";
import { SwapUsdcToUsdModal } from "@/components/modals/SwapUsdcToUsdModal";
import { SwapEurcToEurModal } from "@/components/modals/SwapEurcToEurModal";
import usdcLogo from "@/assets/usdc-logo.png";
import eurcLogo from "@/assets/eurc-logo.png";

interface MyLoansProps {
  userId: string;
  onTransactionsUpdate?: () => void;
}

export function MyLoans({ userId, onTransactionsUpdate }: MyLoansProps) {
  const { bankAccount, loading, refreshBankAccount } = useRealtimeBankAccount(userId);
  const [showSwapUsdcModal, setShowSwapUsdcModal] = useState(false);
  const [showSwapEurcModal, setShowSwapEurcModal] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Borrowed Stablecoins</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!bankAccount) return null;

  const handleSwapComplete = async () => {
    await refreshBankAccount();
    onTransactionsUpdate?.();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Borrowed Stablecoins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/10 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">USDC Balance</p>
              <div className="flex items-center gap-2">
                <img src={usdcLogo} alt="USDC" className="w-6 h-6" />
                <p className="text-2xl font-bold text-foreground">
                  {bankAccount.usdc_balance.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
            </div>

            <div className="p-4 bg-secondary/10 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">EURC Balance</p>
              <div className="flex items-center gap-2">
                <img src={eurcLogo} alt="EURC" className="w-6 h-6" />
                <p className="text-2xl font-bold text-foreground">
                  {bankAccount.eurc_balance.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Swap Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {bankAccount.usdc_balance > 0 && (
              <Button 
                onClick={() => setShowSwapUsdcModal(true)}
                className="w-full"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                USDC → USD
              </Button>
            )}
            {bankAccount.eurc_balance > 0 && (
              <Button 
                onClick={() => setShowSwapEurcModal(true)}
                className="w-full"
                variant="outline"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                EURC → EUR
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <SwapUsdcToUsdModal
        open={showSwapUsdcModal}
        onClose={() => setShowSwapUsdcModal(false)}
        userId={userId}
        usdcBalance={bankAccount.usdc_balance}
        onSwapComplete={handleSwapComplete}
      />

      <SwapEurcToEurModal
        open={showSwapEurcModal}
        onClose={() => setShowSwapEurcModal(false)}
        userId={userId}
        eurcBalance={bankAccount.eurc_balance}
        eurBalance={bankAccount.eur_balance}
        onSwapComplete={handleSwapComplete}
      />
    </>
  );
}
