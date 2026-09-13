"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, CurrencyCode } from "@/lib/constants";

interface BudgetPaceProps {
  budgetUsagePercent: number;
  status: "healthy" | "caution" | "over";
  projectedMonthEnd: number;
  daysRemaining: number;
  daysInMonth: number;
  currency: CurrencyCode;
}

export function BudgetPace({
  budgetUsagePercent,
  status,
  projectedMonthEnd,
  daysRemaining,
  daysInMonth,
  currency
}: BudgetPaceProps) {
  const daysElapsed = daysInMonth - daysRemaining;
  const expectedPacePercent = (daysElapsed / daysInMonth) * 100;
  
  // Cap at 100% for display purposes
  const displayPercent = Math.min(budgetUsagePercent, 100);

  return (
    <div className="py-8">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-sm font-medium">Budget pace</h3>
        <span className="text-sm font-medium tabular-nums">{Math.round(budgetUsagePercent)}%</span>
      </div>
      
      <div className="relative h-2 rounded-full bg-secondary w-full overflow-hidden mb-3">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-in-out",
            status === "healthy" && "bg-primary",
            status === "caution" && "bg-warning",
            status === "over" && "bg-destructive"
          )}
          style={{ width: `${displayPercent}%` }}
        />
        
        {/* Expected pace marker */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-foreground z-10"
          style={{ left: `${expectedPacePercent}%` }}
          title={`Expected pace: ${Math.round(expectedPacePercent)}%`}
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {status === "healthy" && "On track"}
          {status === "caution" && "Spending fast"}
          {status === "over" && "Over budget"}
        </span>
        <span>
          Expected: {projectedMonthEnd > 0 ? "+" : ""}{formatCurrency(projectedMonthEnd, currency)} by month end
        </span>
      </div>
    </div>
  );
}
