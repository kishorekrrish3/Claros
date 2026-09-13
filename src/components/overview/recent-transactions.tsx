"use client";

import { formatCurrency, CurrencyCode } from "@/lib/constants";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  categoryName: string;
  type: "income" | "expense";
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-4">Recent</h3>
        <p className="text-sm text-muted-foreground">No transactions found.</p>
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
      <h3 className="text-sm font-medium mb-4">Recent</h3>
      
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <h4 className="text-xs text-muted-foreground uppercase font-medium tracking-wider mb-3">
              {formatHeader(date)}
            </h4>
            <div className="space-y-3">
              {txs.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center group cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{tx.merchant}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {tx.type === "income" ? (
                         <span className="flex items-center text-positive/80"><ArrowDownRight className="h-3 w-3 mr-0.5" /> Income</span>
                      ) : (
                        <span className="flex items-center"><Minus className="h-3 w-3 mr-0.5" /> {tx.categoryName}</span>
                      )}
                    </span>
                  </div>
                  <span className={tx.type === "income" ? "text-positive text-sm tabular-nums font-medium" : "text-sm tabular-nums font-medium"}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <Link href="/transactions" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 w-fit">
          View all transactions <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
