"use client";

import { useState } from "react";
import {
  Plus,
  Check,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createTransaction, deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { triggerHaptic } from "@/lib/native/platform";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

interface QuickEntryBarProps {
  categories: Category[];
  currency: string;
}

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

const PAYMENT_METHODS = [
  { id: "upi", label: "📱 UPI / GPay" },
  { id: "card", label: "💳 Card" },
  { id: "cash", label: "💵 Cash" },
  { id: "netbanking", label: "🏦 NetBank" },
];

export function QuickEntryBar({ categories, currency }: QuickEntryBarProps) {
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isEssential, setIsEssential] = useState(false);
  const [satisfaction, setSatisfaction] = useState<"love" | "fine" | "regret" | null>(null);
  const [dateSelection, setDateSelection] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");

  const [expanded, setExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAmount = (addVal: number) => {
    triggerHaptic("light");
    const current = parseFloat(amount) || 0;
    setAmount((current + addVal).toString());
  };

  const resolvedDate = () => {
    if (dateSelection === "yesterday") {
      return subDays(new Date(), 1);
    }
    if (dateSelection === "custom" && customDate) {
      return new Date(customDate);
    }
    return new Date();
  };

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      triggerHaptic("warning");
      toast.error("Please enter a valid amount");
      return;
    }

    if (!merchant.trim()) {
      triggerHaptic("warning");
      toast.error("Please enter what you spent on");
      return;
    }

    setIsSubmitting(true);
    try {
      const pmLabel = PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label || "";
      const combinedNote = note.trim()
        ? `[${pmLabel}] ${note.trim()}`
        : `[${pmLabel}]`;

      const res = await createTransaction({
        amount: Number(amount),
        merchant: merchant.trim(),
        categoryId: type === "expense" ? (selectedCategoryId || categories[0]?.id || null) : null,
        date: resolvedDate(),
        essential: isEssential,
        satisfaction: satisfaction,
        note: combinedNote,
        type: type,
      });

      if (!res.success) {
        triggerHaptic("error");
        toast.error(res.error || "Failed to log entry");
        return;
      }

      const createdTxId = res.data?.id;
      const loggedMerchant = merchant.trim();
      triggerHaptic("success");
      toast.success(`Logged ${currency} ${amount} for ${loggedMerchant}`, {
        description: `${type.toUpperCase()} · ${pmLabel}`,
        action: createdTxId
          ? {
              label: "Undo",
              onClick: async () => {
                triggerHaptic("medium");
                try {
                  await deleteTransaction(createdTxId);
                  toast.info(`Removed ${loggedMerchant}`);
                } catch {
                  toast.error("Failed to remove entry");
                }
              },
            }
          : undefined,
      });

      // Reset form fields but keep selected category and payment method
      setAmount("");
      setMerchant("");
      setNote("");
      setIsEssential(false);
      setSatisfaction(null);
    } catch (err) {
      triggerHaptic("error");
      toast.error("Failed to log entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-6 p-4 md:p-5 rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-md shadow-xs transition-all">
      {/* Header with Type Selector & Expansion Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Zap className="w-4 h-4 fill-amber-500/20" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Versatile Quick Logger
            </h3>
          </div>
        </div>

        {/* Type Switcher Pills */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setType("expense");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              type === "expense"
                ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Expense
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setType("income");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              type === "income"
                ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Income
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setType("transfer");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              type === "transfer"
                ? "bg-background text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Repeat className="w-3.5 h-3.5" /> Transfer
          </button>
        </div>
      </div>

      <form onSubmit={handleQuickLog} className="space-y-3.5">
        {/* Main Input Row */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative sm:w-44">
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tabular-nums font-bold text-lg pr-8"
              disabled={isSubmitting}
              autoFocus
            />
            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-medium">
              {currency}
            </span>
          </div>

          <Input
            type="text"
            enterKeyHint="next"
            placeholder={
              type === "expense"
                ? "Merchant / Item (e.g. Swiggy, Uber, Supermarket)"
                : type === "income"
                ? "Source (e.g. Salary, Freelance, Dividend)"
                : "Transfer to (e.g. Savings, Investment Account)"
            }
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="flex-1 text-sm font-medium"
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            disabled={isSubmitting || !amount || !merchant}
            className="sm:w-32 gap-1.5 font-semibold text-sm h-10 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {isSubmitting ? "Logging..." : "Log Entry"}
          </Button>
        </div>

        {/* Quick Amount Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[11px] text-muted-foreground shrink-0 mr-1">Quick Add:</span>
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleAddAmount(amt)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold border border-border/50 bg-background/60 hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-muted-foreground transition-all shrink-0"
            >
              +{amt}
            </button>
          ))}
        </div>

        {/* Category Pills (For Expense) */}
        {type === "expense" && categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
            <span className="text-[11px] text-muted-foreground shrink-0 mr-1">Category:</span>
            {categories.map((c) => {
              const isSelected = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedCategoryId(c.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span>{c.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Payment Method Badges & Expand Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-muted-foreground shrink-0 mr-1">Method:</span>
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setPaymentMethod(pm.id);
                }}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium border ${
                  paymentMethod === pm.id
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                    : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setExpanded(!expanded);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {expanded ? "Fewer details" : "More options (Date, Note, Mindful Rating)"}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Versatile Options */}
        {expanded && (
          <div className="space-y-3 pt-3 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Date selection & Mindful rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Date Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs">Entry Date</Label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setDateSelection("today");
                    }}
                    className={`flex-1 text-xs py-1.5 rounded-md border text-center font-medium transition-all ${
                      dateSelection === "today"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/50 bg-background/50 text-muted-foreground"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setDateSelection("yesterday");
                    }}
                    className={`flex-1 text-xs py-1.5 rounded-md border text-center font-medium transition-all ${
                      dateSelection === "yesterday"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/50 bg-background/50 text-muted-foreground"
                    }`}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setDateSelection("custom");
                    }}
                    className={`flex-1 text-xs py-1.5 rounded-md border text-center font-medium transition-all ${
                      dateSelection === "custom"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/50 bg-background/50 text-muted-foreground"
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {dateSelection === "custom" && (
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Mindful Satisfaction Rating */}
              <div className="space-y-1.5">
                <Label className="text-xs">Mindful Spending Rating</Label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setSatisfaction(satisfaction === "love" ? null : "love");
                    }}
                    className={`flex-1 text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 font-medium transition-all ${
                      satisfaction === "love"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 font-semibold"
                        : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    😍 Loved
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setSatisfaction(satisfaction === "fine" ? null : "fine");
                    }}
                    className={`flex-1 text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 font-medium transition-all ${
                      satisfaction === "fine"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 font-semibold"
                        : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🙂 Okay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setSatisfaction(satisfaction === "regret" ? null : "regret");
                    }}
                    className={`flex-1 text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 font-medium transition-all ${
                      satisfaction === "regret"
                        ? "border-rose-500 bg-rose-500/10 text-rose-600 font-semibold"
                        : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    😒 Regret
                  </button>
                </div>
              </div>
            </div>

            {/* Note & Essential Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Input
                type="text"
                enterKeyHint="done"
                placeholder="Notes or tags (e.g. #dining, #groceries, team lunch)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 text-xs"
              />

              <div className="flex items-center justify-between gap-3 px-3 py-2 border border-border/50 rounded-lg bg-background/50 shrink-0">
                <Label htmlFor="essential-toggle-quick" className="text-xs font-medium cursor-pointer">
                  Essential Spend?
                </Label>
                <Switch
                  id="essential-toggle-quick"
                  checked={isEssential}
                  onCheckedChange={(val) => {
                    triggerHaptic("light");
                    setIsEssential(val);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
