import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Repeat, Send, ArrowRightLeft } from "lucide-react";
import solLogo from "@/assets/sol-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import eurcLogo from "@/assets/eurc-logo.png";

interface Transaction {
  id: string;
  type: "borrow" | "repay" | "add_collateral" | "withdraw_collateral" | "liquidation" | "transfer" | "swap";
  amount: number;
  currency: string;
  date: Date;
  status: "success" | "pending" | "failed" | "completed";
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "add_collateral":
        return <ArrowDownLeft className="h-4 w-4 text-legasi-green" />;
      case "withdraw_collateral":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "liquidation":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "transfer":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "swap":
        return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      default:
        return <Repeat className="h-4 w-4 text-legasi-orange" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "add_collateral":
        return "Add Collateral";
      case "withdraw_collateral":
        return "Withdraw Collateral";
      case "liquidation":
        return "Liquidation";
      case "borrow":
        return "Borrow";
      case "repay":
        return "Repay";
      case "transfer":
        return "Wire Transfer";
      case "swap":
        return "Swap";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getCurrencyLogo = (currency: string) => {
    if (currency === "SOL") return solLogo;
    if (currency === "USDC") return usdcLogo;
    if (currency === "EURC") return eurcLogo;
    if (currency === "EUR") return null;
    if (currency === "USD") return null;
    return null;
  };

  return (
    <Card className="bg-legasi-card border-border">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-legasi-dark/50 rounded-lg hover:bg-legasi-dark/70 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-legasi-card rounded-full">
                    {getIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-semibold">{getTypeLabel(tx.type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {getCurrencyLogo(tx.currency) && (
                      <img src={getCurrencyLogo(tx.currency)!} alt={tx.currency} className="w-4 h-4" />
                    )}
                    <p className="font-semibold">
                      {tx.amount} {tx.currency}
                    </p>
                  </div>
                  <p className={`text-sm ${
                    tx.status === "success" || tx.status === "completed" ? "text-legasi-green" : 
                    tx.status === "pending" ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {tx.status === "completed" ? "success" : tx.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
