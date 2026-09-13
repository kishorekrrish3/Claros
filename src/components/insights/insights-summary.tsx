import { formatCurrency } from "@/lib/constants";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

interface InsightsSummaryProps {
  summary: any;
  savingsRate: number;
  currency: string;
}

export default function InsightsSummary({ summary, savingsRate, currency }: InsightsSummaryProps) {
  const { totalSpent, remainingBudget, avgDailySpending, largestExpense, noSpendDays, totalDays, spendTrend } = summary;

  const trendIcon = spendTrend > 0 ? (
    <ArrowUpIcon className="h-4 w-4 text-negative" />
  ) : spendTrend < 0 ? (
    <ArrowDownIcon className="h-4 w-4 text-positive" />
  ) : (
    <MinusIcon className="h-4 w-4 text-muted-foreground" />
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Total Spent</div>
        <div className="text-display-lg tabular-nums">
          {formatCurrency(totalSpent, currency)}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          {trendIcon}
          <span className="ml-1">{Math.abs(spendTrend)}% vs last month</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Remaining Budget</div>
        <div className="text-display-lg tabular-nums">
          {formatCurrency(remainingBudget, currency)}
        </div>
        <div className="text-sm text-muted-foreground">
          For the rest of the month
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Savings Rate</div>
        <div className={`text-display-lg tabular-nums ${savingsRate >= 20 ? "text-positive" : savingsRate > 0 ? "text-primary" : "text-negative"}`}>
          {savingsRate.toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground">
          Of total income/budget
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Avg Daily Spending</div>
        <div className="text-display-lg tabular-nums">
          {formatCurrency(avgDailySpending, currency)}
        </div>
        <div className="text-sm text-muted-foreground">
          Target: {formatCurrency(totalSpent / totalDays, currency)} / day
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">Largest Expense</div>
        <div className="text-display-lg tabular-nums">
          {formatCurrency(largestExpense?.amount || 0, currency)}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {largestExpense?.merchant || "None"}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground">No-Spend Days</div>
        <div className="text-display-lg tabular-nums">
          {noSpendDays} <span className="text-xl text-muted-foreground font-normal">/ {totalDays}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Days with zero transactions
        </div>
      </div>
    </div>
  );
}
