"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, CurrencyCode } from "@/lib/constants";

interface SafeToSpendHeroProps {
  amount: number;
  remaining: number;
  explanation: string;
  status: "healthy" | "caution" | "over";
  currency: CurrencyCode;
}

export function SafeToSpendHero({ amount, remaining, explanation, status, currency }: SafeToSpendHeroProps) {
  return (
    <div className="flex flex-col animate-fade-in py-8">
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">
        Safe to spend today
      </h2>
      
      {amount > 0 ? (
        <>
          <div 
            className={cn(
              "text-display-lg tabular-nums font-medium tracking-tight mb-4 text-5xl",
              status === "healthy" && "text-foreground",
              status === "caution" && "text-warning",
              status === "over" && "text-negative"
            )}
          >
            {formatCurrency(amount, currency)}
          </div>
          <p className="text-sm text-muted-foreground">
            {explanation}
          </p>
        </>
      ) : (
        <>
          <div className="text-display-lg tabular-nums font-medium tracking-tight text-negative mb-4 text-5xl">
            {formatCurrency(0, currency)}
          </div>
          <p className="text-sm text-muted-foreground">
            You&apos;ve exceeded your daily budget. Try to hold off on spending today.
          </p>
        </>
      )}
    </div>
  );
}
