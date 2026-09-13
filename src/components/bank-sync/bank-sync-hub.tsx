"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, Building2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { triggerLiveBankSync, toggleBankConnection, BankAccount } from "@/actions/bank-sync";
import { formatCurrency, CurrencyCode } from "@/lib/constants";

interface BankSyncHubProps {
  initialAccounts: BankAccount[];
  currency?: CurrencyCode;
}

export function BankSyncHub({ initialAccounts, currency = "INR" }: BankSyncHubProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [syncingBankId, setSyncingBankId] = useState<string | null>(null);

  const handleSync = async (bankId: string, bankName: string) => {
    setSyncingBankId(bankId);
    try {
      const res = await triggerLiveBankSync(bankId);
      toast.success(`Synced live entries from ${bankName}`, {
        description: `Logged: ${res.syncedTransaction.merchant} (${currency} ${res.syncedTransaction.amount})`,
      });

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === bankId ? { ...acc, lastSynced: res.lastSynced, connected: true } : acc
        )
      );
    } catch (err) {
      toast.error(`Failed to sync ${bankName}`);
    } finally {
      setSyncingBankId(null);
    }
  };

  const handleToggleConnect = async (bankId: string, currentStatus: boolean, bankName: string) => {
    try {
      const res = await toggleBankConnection(bankId, !currentStatus);
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === bankId ? { ...acc, connected: res.connected } : acc))
      );
      toast.success(`${bankName} ${res.connected ? "Connected" : "Disconnected"}`);
    } catch (err) {
      toast.error("Failed to update bank connection");
    }
  };

  return (
    <div className="my-8 p-5 rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/50 to-muted/20 backdrop-blur-md shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-semibold">Live Bank Sync & Accounts</h3>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-medium">
              RBI AA Compatible
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time automated transaction updates from State Bank of India (SBI) & ICICI Bank via Account Aggregator
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>256-bit Encrypted</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => {
          const isSyncing = syncingBankId === acc.id;
          return (
            <div
              key={acc.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                acc.connected
                  ? "border-border/60 bg-background/60 shadow-xs"
                  : "border-border/30 bg-muted/20 opacity-75"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{acc.logo}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{acc.bankName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {acc.accountType} · {acc.accountNumber}
                      </p>
                    </div>
                  </div>

                  {acc.connected ? (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Not Linked
                    </Badge>
                  )}
                </div>

                {acc.connected && acc.balance > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30 flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Available Balance:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(acc.balance, currency)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/30">
                <span className="text-[11px] text-muted-foreground truncate">
                  {acc.lastSynced
                    ? `Synced ${new Date(acc.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "Never synced"}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleConnect(acc.id, acc.connected, acc.bankName)}
                    className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    {acc.connected ? "Disconnect" : "Link"}
                  </Button>

                  {acc.connected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(acc.id, acc.bankName)}
                      disabled={isSyncing}
                      className="text-xs h-8 gap-1.5 font-medium border-primary/30 hover:bg-primary/5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-primary ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing ? "Syncing..." : "Sync Live"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
