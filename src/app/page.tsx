import { OverviewContent } from "@/components/overview/overview-content";
import { format, parseISO, endOfMonth, getDaysInMonth, differenceInDays } from "date-fns";
import { DailySpending } from "@/components/overview/week-mini-chart";
import { Transaction } from "@/components/overview/recent-transactions";
import { CurrencyCode } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { getUserSettings, getMonthlyBudgetData, getCategories } from "@/actions/budget";
import { getTransactions } from "@/actions/transactions";
import { getGoals } from "@/actions/goals";
import { getConnectedBankAccounts } from "@/actions/bank-sync";
import { 
  calculateMonthlyBudget, 
  calculateSpent, 
  calculateSafeToSpendToday, 
  calculateCategorySpending, 
  calculateGoalProjection,
  calculateDailyPace,
  calculateProjectedMonthEnd
} from "@/lib/finance/calculations";
import type { CategorySpending, GoalProjection, TransactionData } from "@/lib/finance/types";

interface PageProps {
  searchParams: { month?: string };
}

export default async function OverviewPage({ searchParams }: PageProps) {
  // Determine current month from params or default to current date
  const monthParam = searchParams.month;
  const currentMonth = monthParam || format(new Date(), "yyyy-MM");
  
  const [settings, monthlyBudgetData, rawTransactions, categories, goalsData, bankAccounts] = await Promise.all([
    getUserSettings(),
    getMonthlyBudgetData(currentMonth),
    getTransactions({ month: currentMonth }),
    getCategories(),
    getGoals(),
    getConnectedBankAccounts(),
  ]);

  const currency: CurrencyCode = (settings?.currency as CurrencyCode) || "INR";
  
  let date;
  try {
    date = parseISO(`${currentMonth}-01`);
  } catch {
    date = new Date();
  }
  
  const daysInMonth = getDaysInMonth(date);
  const today = new Date();
  
  // Convert DB transactions to the format expected by calculations
  const transactions: TransactionData[] = rawTransactions.map(t => ({
    id: t.id,
    date: t.date,
    amount: t.amount,
    type: t.type as "expense" | "income" | "transfer",
    categoryId: t.categoryId,
    merchant: t.merchant,
    essential: t.essential
  }));
  
  // 1. Calculate Monthly Budget
  const monthlyBudget = calculateMonthlyBudget({
    incomeSources: monthlyBudgetData.incomeSources,
    fixedExpenses: monthlyBudgetData.fixedExpenses,
    savingsAllocations: monthlyBudgetData.savingsAllocations,
    rolloverAmount: settings?.rolloverAmount || 0,
    rolloverEnabled: settings?.rolloverEnabled || false,
  });

  // 2. Calculate Spent Summary
  const spentSummary = calculateSpent(transactions);

  // 3. Calculate Safe To Spend
  const safeToSpendResult = calculateSafeToSpendToday({
    monthlyBudget,
    spentThisMonth: spentSummary.total,
    spentToday: transactions.filter(t => t.date.toISOString().startsWith(format(today, "yyyy-MM-dd"))).reduce((sum, t) => sum + (t.type === "expense" ? t.amount : 0), 0),
    currentDate: today,
    includeTodayInDays: settings?.includeTodayInDays ?? true,
  });

  // 4. Calculate Category Spending
  const mappedCategories = categories.map(c => ({ id: c.id, name: c.name, color: c.color, icon: c.icon }));
  const categorySpendingRaw = calculateCategorySpending(transactions, mappedCategories);
  
  // Format for component
  const categorySpending = categorySpendingRaw.map(c => ({
    id: c.categoryId,
    name: c.categoryName,
    spent: c.amount,
    budget: 0, // Assuming we don't have per-category budgets yet
    color: c.categoryColor,
    percentUsed: 0, 
    status: "healthy" as const
  }));

  // 5. Recent Transactions
  const recentTransactions: Transaction[] = rawTransactions.slice(0, 5).map(t => ({
    id: t.id,
    date: format(t.date, "yyyy-MM-dd"),
    amount: t.amount,
    merchant: t.merchant,
    categoryName: t.category?.name || "Uncategorized",
    type: t.type as "expense" | "income" | "transfer",
  }));

  // 6. Goal Projections
  const goals: GoalProjection[] = goalsData.map(g => calculateGoalProjection({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    monthlyContribution: g.monthlyContribution,
    targetDate: g.targetDate,
  }));

  // 7. Daily Pace Data
  const dailyPaceDataRaw = calculateDailyPace(transactions, monthlyBudget.discretionaryBudget, date);
  const last7Days = dailyPaceDataRaw.filter(d => new Date(d.date) <= today).slice(-7);
  const dailyData: DailySpending[] = last7Days.map(d => ({
    date: d.date,
    amount: d.spent,
    dayName: format(parseISO(d.date), "E").charAt(0) // "M", "T", etc.
  }));

  const spentToday = transactions
    .filter(t => t.type === 'expense' && format(t.date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <OverviewContent
      currentMonth={currentMonth}
      currency={currency}
      categories={categories}
      bankAccounts={bankAccounts}
      
      safeToSpendAmount={safeToSpendResult.amount}
      safeToSpendRemaining={safeToSpendResult.remaining}
      safeToSpendExplanation={safeToSpendResult.explanation}
      safeToSpendStatus={safeToSpendResult.status}
      
      budgetRemaining={safeToSpendResult.remaining}
      spentToday={spentToday}
      daysRemaining={safeToSpendResult.daysRemaining}
      daysInMonth={daysInMonth}
      dailyPace={safeToSpendResult.dailyPace}
      projectedMonthEnd={safeToSpendResult.projectedMonthEnd}
      budgetUsagePercent={safeToSpendResult.budgetUsagePercent}
      budgetStatus={safeToSpendResult.status}
      
      dailyData={dailyData}
      categorySpending={categorySpending}
      recentTransactions={recentTransactions}
      goals={goals}
    />
  );
}
