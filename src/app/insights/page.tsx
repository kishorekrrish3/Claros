import { Suspense } from "react";
import { redirect } from "next/navigation";
import { format, subMonths, getDaysInMonth, getDate } from "date-fns";

import { getUserSettings, getMonthlyBudgetData, getCategories } from "@/actions/budget";
import { getTransactions, getMonthlyTransactionTotals } from "@/actions/transactions";
import {
  calculateMonthlyBudget,
  calculateSpent,
  calculateInsightsSummary,
  calculateCategorySpending,
  calculateDailyPace,
  calculateMonthComparison,
  calculateWeekdaySpending,
  findMoneyLeaks,
  calculateSavingsRate,
  projectBudgetRunout,
} from "@/lib/finance/calculations";
import type { TransactionData } from "@/lib/finance/types";
import InsightsContent from "@/components/insights/insights-content";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightsPageProps {
  searchParams: { month?: string };
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const currentMonth = format(new Date(), "yyyy-MM");
  const month = searchParams.month || currentMonth;
  const monthDate = new Date(`${month}-01T00:00:00`);

  // Previous month for comparison
  const prevDate = subMonths(monthDate, 1);
  const prevMonth = format(prevDate, "yyyy-MM");

  const last6Months = Array.from({ length: 6 }).map((_, i) => 
    format(subMonths(monthDate, i), "yyyy-MM")
  );

  // Fetch all required data
  const [
    settings,
    budgetData,
    rawTransactions,
    rawPrevTransactions,
    categories,
    monthlyTotalsData
  ] = await Promise.all([
    getUserSettings(),
    getMonthlyBudgetData(month),
    getTransactions({ month }),
    getTransactions({ month: prevMonth }),
    getCategories(),
    getMonthlyTransactionTotals(last6Months)
  ]);

  if (!settings) {
    redirect("/onboarding");
  }

  // Map transactions to TransactionData
  const transactions: TransactionData[] = (rawTransactions || []).map((t) => ({
    id: t.id,
    date: new Date(t.date),
    amount: t.amount,
    type: t.type as "expense" | "income" | "transfer",
    categoryId: t.categoryId,
    merchant: t.merchant,
    essential: t.essential,
  }));

  const prevTransactions: TransactionData[] = (rawPrevTransactions || []).map((t) => ({
    id: t.id,
    date: new Date(t.date),
    amount: t.amount,
    type: t.type as "expense" | "income" | "transfer",
    categoryId: t.categoryId,
    merchant: t.merchant,
    essential: t.essential,
  }));

  // Perform calculations
  const totalBudget = calculateMonthlyBudget({
    incomeSources: budgetData.incomeSources,
    fixedExpenses: budgetData.fixedExpenses,
    savingsAllocations: budgetData.savingsAllocations,
    rolloverAmount: settings.rolloverAmount || 0,
    rolloverEnabled: settings.rolloverEnabled || false,
  });

  const totalSpent = calculateSpent(transactions);
  const prevTotalSpent = calculateSpent(prevTransactions);
  
  const baseSummary = calculateInsightsSummary(
    transactions,
    totalBudget.discretionaryBudget,
    totalBudget.totalIncome,
    monthDate
  );

  const monthComparison = calculateMonthComparison(
    totalSpent.total,
    prevTotalSpent.total
  );

  const summary = {
    ...baseSummary,
    avgDailySpending: baseSummary.averageDailySpending,
    spendTrend: monthComparison.percentChange,
  };

  const mappedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon,
  }));

  const categorySpendingRaw = calculateCategorySpending(transactions, mappedCategories);
  const categorySpending = categorySpendingRaw.map((c) => ({
    id: c.categoryId,
    name: c.categoryName,
    amount: c.amount,
    color: c.categoryColor,
    percentage: c.percentage,
    transactionCount: c.transactionCount,
  }));

  // Category changes vs previous month
  const prevCategorySpending = calculateCategorySpending(prevTransactions, mappedCategories);
  const prevCatMap = new Map(prevCategorySpending.map((c) => [c.categoryId, c.amount]));
  const categoryChanges = categorySpendingRaw.map((curr) => {
    const prevAmount = prevCatMap.get(curr.categoryId) || 0;
    return {
      category: curr.categoryName,
      diff: curr.amount - prevAmount,
      currentAmount: curr.amount,
      prevAmount,
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const monthComparisonWithCats = {
    ...monthComparison,
    totalDiff: monthComparison.difference,
    categoryChanges,
  };

  const dailyPaceRaw = calculateDailyPace(
    transactions,
    totalBudget.discretionaryBudget,
    monthDate
  );
  const dailyPace = dailyPaceRaw.map((d) => ({
    ...d,
    amount: d.spent,
  }));

  const weekdayDataRaw = calculateWeekdaySpending(transactions);
  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayData = weekdayDataRaw.map((w) => ({
    ...w,
    day: shortDays[w.dayIndex],
    dayName: w.dayName,
  }));

  const rawMoneyLeaks = findMoneyLeaks(transactions);
  const moneyLeaks = rawMoneyLeaks.map((l) => ({
    ...l,
    count: l.transactionCount,
  }));

  const savingsRate = calculateSavingsRate(totalBudget.totalIncome, totalSpent.total);
  
  const essentialSpending = totalSpent.essential;
  const nonEssentialSpending = totalSpent.nonEssential;

  // Project budget runout day
  const today = new Date();
  const isCurrentMonth = format(today, "yyyy-MM") === month;
  const daysInMonth = getDaysInMonth(monthDate);
  const currentDayOfMonth = isCurrentMonth ? getDate(today) : daysInMonth;
  const runoutDayNumber = projectBudgetRunout(
    totalBudget.discretionaryBudget,
    totalSpent.total,
    currentDayOfMonth,
    daysInMonth
  );

  let budgetRunoutDay: string | null = null;
  if (runoutDayNumber && isCurrentMonth) {
    const runoutDate = new Date(today.getFullYear(), today.getMonth(), Math.min(Math.round(runoutDayNumber), daysInMonth));
    budgetRunoutDay = format(runoutDate, "MMMM d");
  }

  return (
    <div className="container max-w-5xl py-8 space-y-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
        <p className="text-muted-foreground mt-2">
          Deep dive into your spending patterns and habits.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="w-full h-[600px] rounded-lg" />}>
        <InsightsContent
          month={month}
          currency={settings.currency}
          summary={summary}
          categorySpending={categorySpending}
          dailyPace={dailyPace}
          monthComparison={monthComparisonWithCats}
          weekdayData={weekdayData}
          moneyLeaks={moneyLeaks}
          savingsRate={savingsRate}
          essential={essentialSpending}
          nonEssential={nonEssentialSpending}
          monthlyTotals={monthlyTotalsData}
          budgetRunoutDay={budgetRunoutDay}
        />
      </Suspense>
    </div>
  );
}
