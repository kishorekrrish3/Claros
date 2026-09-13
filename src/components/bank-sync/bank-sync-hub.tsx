"use client";

import { useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Smartphone,
  Copy,
  Zap,
  MessageSquareCode,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  requestAccountAggregatorConsent,
  verifyAAConsentAndSync,
  parseAndLogBankSMS,
  toggleBankConnection,
  BankAccount,
} from "@/actions/bank-sync";
import { formatCurrency, CurrencyCode } from "@/lib/constants";

interface BankSyncHubProps {
  initialAccounts: BankAccount[];
  currency?: CurrencyCode;
}

export function BankSyncHub({ initialAccounts, currency = "INR" }: BankSyncHubProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [activeTab, setActiveTab] = useState<"accounts" | "sms" | "webhook">("accounts");

  // AA Consent State
  const [aaModalOpen, setAaModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [consentId, setConsentId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Raw SMS Paste State
  const [rawSMS, setRawSMS] = useState("");
  const [isParsingSMS, setIsParsingSMS] = useState(false);

  // Sample SMS presets for quick testing
  const sampleSMSTemplates = [
    "Dear SBI User, your A/c X4821 debited by Rs 340.00 on 13Sep26 to Swiggy UPI ref 3849120. Avail Bal INR 44,940.00 - SBI",
    "ICICI Bank Acct 9102 debited for Rs 1499.00 on 13-Sep-26; Amazon Pay. Clear Bal: Rs 80,651.00.",
    "SBI: Your A/c X4821 credited by Rs 45000.00 on 13Sep26 by Salary Transfer.",
  ];

  const handleOpenAALink = (bank: BankAccount) => {
    setSelectedBank(bank);
    setPhoneNumber(bank.phoneLinked || "");
    setConsentId(null);
    setOtpCode("");
    setAaModalOpen(true);
  };

  const handleRequestConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;

    setIsSubmitting(true);
    try {
      const res = await requestAccountAggregatorConsent(phoneNumber, selectedBank.id);
      setConsentId(res.consentId);
      toast.success("AA Consent Request Sent", {
        description: res.message,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send consent request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank || !consentId) return;

    setIsSubmitting(true);
    try {
      const res = await verifyAAConsentAndSync(consentId, otpCode, selectedBank.id);
      toast.success(`${selectedBank.bankName} Connected & Synced!`);
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === selectedBank.id ? { ...acc, connected: true, lastSynced: res.lastSynced } : acc
        )
      );
      setAaModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParseAndLogSMS = async () => {
    if (!rawSMS.trim()) {
      toast.error("Please paste an SMS message to parse");
      return;
    }

    setIsParsingSMS(true);
    try {
      const res = await parseAndLogBankSMS(rawSMS.trim());
      toast.success(`Logged ${currency} ${res.parsed.amount} for ${res.parsed.merchant}!`, {
        description: `Source: ${res.parsed.bankName} (${res.parsed.type})`,
      });
      setRawSMS("");
    } catch (err: any) {
      toast.error(err.message || "Failed to parse SMS");
    } finally {
      setIsParsingSMS(false);
    }
  };

  const copyWebhookUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://claros.vercel.app";
    const webhookUrl = `${origin}/api/webhooks/bank-sms`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard!", {
      description: webhookUrl,
    });
  };

  return (
    <div className="my-8 p-5 rounded-2xl border border-border/60 bg-gradient-to-br from-card/90 via-card/60 to-muted/30 backdrop-blur-md shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-semibold">Live Indian Bank Account Sync</h3>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-medium">
              RBI AA & SMS Live
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect SBI YONO & ICICI iMobile live via Account Aggregator or real-time bank SMS notifications
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "accounts"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bank Accounts
          </button>
          <button
            onClick={() => setActiveTab("sms")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
              activeTab === "sms"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" /> SMS Parser
          </button>
          <button
            onClick={() => setActiveTab("webhook")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
              activeTab === "webhook"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="w-3 h-3 text-blue-500" /> Auto-SMS Webhook
          </button>
        </div>
      </div>

      {/* Tab 1: Bank Accounts */}
      {activeTab === "accounts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
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
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Live Sync Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Not Linked
                    </Badge>
                  )}
                </div>

                {acc.connected && acc.balance > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30 flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Live Available Balance:</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(acc.balance, currency)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/30">
                <span className="text-[11px] text-muted-foreground truncate">
                  {acc.lastSynced
                    ? `Synced ${new Date(acc.lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Never synced"}
                </span>

                <Button
                  size="sm"
                  variant={acc.connected ? "outline" : "default"}
                  onClick={() => handleOpenAALink(acc)}
                  className="text-xs h-8 gap-1.5 font-medium"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {acc.connected ? "Re-sync / AA Settings" : "Link Real Account"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Bank SMS Instant Parser */}
      {activeTab === "sms" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquareCode className="w-4 h-4 text-indigo-500" />
              Paste Bank Transaction SMS (SBI, ICICI, HDFC)
            </h4>
            <span className="text-[11px] text-muted-foreground">Auto-detects debit, credit & merchant</span>
          </div>

          <Textarea
            placeholder="Paste raw bank alert SMS here... e.g. 'Dear SBI User, your A/c X4821 debited by Rs 340.00 on 13Sep26 to Swiggy...'"
            value={rawSMS}
            onChange={(e) => setRawSMS(e.target.value)}
            className="font-mono text-xs h-24"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground mr-1">Sample SMS:</span>
              {sampleSMSTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawSMS(tmpl)}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-border/50 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {idx === 0 ? "SBI Swiggy" : idx === 1 ? "ICICI Amazon" : "SBI Salary"}
                </button>
              ))}
            </div>

            <Button
              onClick={handleParseAndLogSMS}
              disabled={isParsingSMS || !rawSMS.trim()}
              className="gap-1.5 font-medium text-xs h-8"
            >
              <Zap className="w-3.5 h-3.5" />
              {isParsingSMS ? "Parsing & Logging..." : "Parse & Log Entry"}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Real-Time Auto SMS Webhook */}
      {activeTab === "webhook" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">Zero-Touch Real-Time Syncing from your Phone</h4>
              <p className="text-xs text-muted-foreground">
                Set up an automated SMS Forwarder / Tasker / Android Notification app on your phone to send bank SMS alerts to your Claros endpoint automatically whenever you spend on SBI or ICICI!
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Your Real-Time Webhook Endpoint URL:</label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/api/webhooks/bank-sms`
                    : "https://claros.vercel.app/api/webhooks/bank-sms"
                }
                className="font-mono text-xs bg-muted/40"
              />
              <Button size="icon" variant="outline" onClick={copyWebhookUrl} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 p-3 rounded-lg border border-border/40">
            <span className="font-medium text-foreground block mb-1">How it works:</span>
            <p>1. Send HTTP POST to the webhook endpoint with JSON body: <code className="text-indigo-600 font-mono">{"{ \"smsText\": \"...\" }"}</code></p>
            <p>2. Claros parses the SBI/ICICI SMS, extracts the exact amount, merchant, and type, and logs it live into your Turso cloud database.</p>
          </div>
        </div>
      )}

      {/* RBI Account Aggregator Link Modal */}
      <Dialog open={aaModalOpen} onOpenChange={setAaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4 text-emerald-500" />
              Link {selectedBank?.bankName} via Account Aggregator
            </DialogTitle>
            <DialogDescription className="text-xs">
              RBI-regulated Account Aggregator consent framework for State Bank of India & ICICI Bank
            </DialogDescription>
          </DialogHeader>

          {!consentId ? (
            <form onSubmit={handleRequestConsent} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Bank Account Mobile Number</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-2 rounded-md border border-border/50">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    maxLength={10}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Must be the registered phone number linked with your {selectedBank?.bankName}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAaModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || phoneNumber.length < 10}>
                  {isSubmitting ? "Connecting..." : "Request AA Consent"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4 pt-2">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-700 dark:text-emerald-300">
                Consent request active for +91 {phoneNumber}. Please enter the 4-digit verification code sent by your bank.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Enter OTP Code</label>
                <Input
                  type="text"
                  placeholder="e.g. 4812"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  required
                  autoFocus
                  disabled={isSubmitting}
                  className="tracking-widest font-mono text-center text-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setConsentId(null)}>
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting || !otpCode}>
                  {isSubmitting ? "Verifying..." : "Verify & Enable Live Sync"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
