"use client";

import { useState } from "react";
import { Plus, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTransaction } from "@/actions/transactions";
import { toast } from "sonner";

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

export function QuickEntryBar({ categories, currency }: QuickEntryBarProps) {
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!merchant.trim()) {
      toast.error("Please enter what you spent on");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        amount: Number(amount),
        merchant: merchant.trim(),
        categoryId: selectedCategoryId || (categories[0]?.id ?? ""),
        date: new Date(),
        essential: false,
        type: "expense",
      });

      toast.success(`Logged ${currency} ${amount} for ${merchant.trim()}`);
      setAmount("");
      setMerchant("");
    } catch (err) {
      toast.error("Failed to log entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-6 p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Instant Quick Logger
        </h3>
      </div>

      <form onSubmit={handleQuickLog} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount (e.g. 250)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="sm:w-36 tabular-nums font-semibold text-base"
            disabled={isSubmitting}
          />
          <Input
            type="text"
            placeholder="Merchant / Item (e.g. Lunch, Coffee, Petrol)"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="flex-1 text-sm"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !amount || !merchant}
            className="sm:w-28 gap-1.5 font-medium"
          >
            <Plus className="w-4 h-4" />
            {isSubmitting ? "Logging..." : "Log Entry"}
          </Button>
        </div>

        {/* Quick Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
            <span className="text-[11px] text-muted-foreground shrink-0 mr-1">Category:</span>
            {categories.slice(0, 7).map((c) => {
              const isSelected = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
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
      </form>
    </div>
  );
}
