"use client";

import { formatCurrency, CurrencyCode } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MetricGridProps {
  remaining: number;
  spentToday: number;
  daysRemaining: number;
  dailyPace: number;
  projectedMonthEnd: number;
  budgetUsagePercent: number;
  currency: CurrencyCode;
}

export function MetricGrid({
  remaining,
  spentToday,
  daysRemaining,
  dailyPace,
  projectedMonthEnd,
  budgetUsagePercent,
  currency,
}: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 pt-4 border-t border-border/30">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">Left in budget</span>
        <span className="text-2xl font-bold tabular-nums">
          {formatCurrency(remaining, currency)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">Spent today</span>
        <span className="text-2xl font-bold tabular-nums">
          {formatCurrency(spentToday, currency)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">Pace per day</span>
        <span className="text-2xl font-bold tabular-nums">
          {formatCurrency(dailyPace, currency)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">Projected end</span>
        <span className={cn(
          "text-2xl font-bold tabular-nums",
          projectedMonthEnd >= 0 ? "text-positive" : "text-negative"
        )}>
          {projectedMonthEnd > 0 ? "+" : ""}{formatCurrency(projectedMonthEnd, currency)}
        </span>
      </div>
    </div>
  );
}
