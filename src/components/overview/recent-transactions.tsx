"use client";

import * as React from "react";
import { formatCurrency, CurrencyCode } from "@/lib/constants";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus, Repeat, Trash2, Loader2 } from "lucide-react";
import { deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { triggerHaptic } from "@/lib/native/platform";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  categoryName: string;
  type: "income" | "expense" | "transfer";
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (tx: Transaction) => {
    const confirmed = window.confirm(`Delete ${tx.merchant} (${formatCurrency(tx.amount, currency)})?`);
    if (!confirmed) return;

    setDeletingId(tx.id);
    triggerHaptic("medium");
    try {
      const res = await deleteTransaction(tx.id);
      if (res.success) {
        triggerHaptic("success");
        toast.success(`Deleted ${tx.merchant}`);
      } else {
        toast.error(res.error || "Failed to delete transaction");
      }
    } catch (err) {
      toast.error("Failed to delete transaction");
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-4">Daily Entries</h3>
        <p className="text-sm text-muted-foreground">No entries logged yet for this month.</p>
      </div>
    );
  }

  // Group transactions by date
  const grouped = transactions.reduce((acc, tx) => {
    if (!acc[tx.date]) {
      acc[tx.date] = [];
    }
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const formatHeader = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return "TODAY";
      if (isYesterday(date)) return "YESTERDAY";
      return format(date, "MMM d, yyyy").toUpperCase();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Daily Entries Log</h3>
        <span className="text-xs text-muted-foreground">{transactions.length} items logged</span>
      </div>
      
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <h4 className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-3">
              {formatHeader(date)}
            </h4>
            <div className="space-y-2.5">
              {txs.map((tx) => {
                const isThisDeleting = deletingId === tx.id;
                return (
                  <div
                    key={tx.id}
                    className={`flex justify-between items-center p-2.5 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors group ${
                      isThisDeleting ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-sm font-medium text-foreground truncate">{tx.merchant}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        {tx.type === "income" ? (
                          <span className="flex items-center text-emerald-600 font-medium">
                            <ArrowDownRight className="h-3 w-3 mr-0.5 shrink-0" /> Income
                          </span>
                        ) : tx.type === "transfer" ? (
                          <span className="flex items-center text-blue-600 font-medium">
                            <Repeat className="h-3 w-3 mr-0.5 shrink-0" /> Transfer
                          </span>
                        ) : (
                          <span className="flex items-center truncate">
                            <Minus className="h-3 w-3 mr-0.5 shrink-0" /> {tx.categoryName}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={
                          tx.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400 text-sm tabular-nums font-semibold"
                            : tx.type === "transfer"
                            ? "text-blue-600 dark:text-blue-400 text-sm tabular-nums font-medium"
                            : "text-sm tabular-nums font-semibold"
                        }
                      >
                        {tx.type === "income" ? "+" : tx.type === "transfer" ? "↔ " : "-"}
                        {formatCurrency(tx.amount, currency)}
                      </span>

                      {/* Delete button (visible on hover on desktop, always accessible on touch/mobile) */}
                      <button
                        type="button"
                        onClick={() => handleDelete(tx)}
                        disabled={isThisDeleting}
                        aria-label={`Delete ${tx.merchant}`}
                        className="p-1.5 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                      >
                        {isThisDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <Link href="/calendar" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 w-fit">
          View full entries calendar <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}


