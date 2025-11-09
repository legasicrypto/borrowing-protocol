import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Transaction {
  id: string;
  type: "borrow" | "repay" | "add_collateral" | "withdraw_collateral" | "liquidation" | "transfer" | "swap";
  amount: number;
  currency: string;
  date: Date;
  status: "success" | "pending" | "failed" | "completed";
}

export const useRealtimeTransactions = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!userId) return;

    // Fetch initial transactions
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch wire transfers
    const { data: wireData, error: wireError } = await supabase
      .from("wire_transfers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!txError && txData) {
      const formattedTransactions: Transaction[] = txData.map((tx) => ({
        id: tx.id,
        type: tx.type as Transaction["type"],
        amount: Number(tx.amount),
        currency: tx.currency,
        date: new Date(tx.created_at),
        status: tx.status as Transaction["status"],
      }));

      // Add wire transfers
      if (!wireError && wireData) {
        const formattedWires: Transaction[] = wireData.map((wire) => ({
          id: wire.id,
          type: "transfer" as const,
          amount: Number(wire.amount_eur),
          currency: "EUR",
          date: new Date(wire.created_at),
          status: wire.status === "completed" ? "success" : wire.status as Transaction["status"],
        }));

        // Merge and sort by date
        const allTransactions = [...formattedTransactions, ...formattedWires]
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        setTransactions(allTransactions);
      } else {
        setTransactions(formattedTransactions);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      await fetchTransactions();

      // Subscribe to realtime updates
      channel = supabase
        .channel(`transactions-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newTx = payload.new;
            console.log("New transaction received via realtime:", newTx);
            setTransactions((prev) => [
              {
                id: newTx.id,
                type: newTx.type as Transaction["type"],
                amount: Number(newTx.amount),
                currency: newTx.currency,
                date: new Date(newTx.created_at),
                status: newTx.status as Transaction["status"],
              },
              ...prev,
            ]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedTx = payload.new;
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === updatedTx.id
                  ? {
                      id: updatedTx.id,
                      type: updatedTx.type as Transaction["type"],
                      amount: Number(updatedTx.amount),
                      currency: updatedTx.currency,
                      date: new Date(updatedTx.created_at),
                      status: updatedTx.status as Transaction["status"],
                    }
                  : tx
              )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "wire_transfers",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newWire = payload.new;
            setTransactions((prev) => [
              {
                id: newWire.id,
                type: "transfer" as const,
                amount: Number(newWire.amount_eur),
                currency: "EUR",
                date: new Date(newWire.created_at),
                status: newWire.status === "completed" ? "success" : newWire.status as Transaction["status"],
              },
              ...prev,
            ].sort((a, b) => b.date.getTime() - a.date.getTime()));
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "wire_transfers",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedWire = payload.new;
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === updatedWire.id
                  ? {
                      id: updatedWire.id,
                      type: "transfer" as const,
                      amount: Number(updatedWire.amount_eur),
                      currency: "EUR",
                      date: new Date(updatedWire.created_at),
                      status: updatedWire.status === "completed" ? "success" : updatedWire.status as Transaction["status"],
                    }
                  : tx
              ).sort((a, b) => b.date.getTime() - a.date.getTime())
            );
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return { transactions, loading, refreshTransactions: fetchTransactions };
};
