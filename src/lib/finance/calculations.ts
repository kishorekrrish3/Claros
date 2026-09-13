// ─── Finance Calculation Engine ──────────────────────────────────────────────
// Pure functions — no database calls, no side effects.
// All calculations are deterministic given the same inputs.

import {
  getDaysInMonth,
  getDate,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  differenceInMonths,
  addMonths,
  isWeekend,
  getDay,
  isSameDay,
} from "date-fns";

import type {
  MonthlyBudgetParams,
  MonthlyBudget,
  TransactionData,
  SpentSummary,
  SafeToSpendParams,
  SafeToSpendResult,
  DailyPaceData,
  CategorySpending,
  MonthComparison,
  GoalProjection,
  WhatIfParams,
  WhatIfResult,
  InsightsSummary,
  MoneyLeak,
  WeekdaySpending,
  DateRange,
} from "./types";

// ─── Monthly Budget ──────────────────────────────────────────────────────────

/**
 * Calculate the monthly discretionary budget.
 *
 * Formula:
 *   discretionary = totalIncome + rollover - fixedExpenses - savingsAllocations
 *
 * Savings allocations of type "percentage" are calculated as a % of totalIncome.
 */
export function calculateMonthlyBudget(
  params: MonthlyBudgetParams
): MonthlyBudget {
  const { incomeSources, fixedExpenses, savingsAllocations, rolloverAmount, rolloverEnabled } = params;

  const activeIncome = incomeSources.filter((s) => s.active);
  const activeExpenses = fixedExpenses.filter((e) => e.active);
  const activeSavings = savingsAllocations.filter((s) => s.active);

  const totalIncome = activeIncome.reduce((sum, s) => sum + s.amount, 0);
  const totalFixedExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalSavingsAllocations = activeSavings.reduce((sum, s) => {
    if (s.type === "percentage") {
      return sum + (totalIncome * s.amount) / 100;
    }
    return sum + s.amount;
  }, 0);

  const rollover = rolloverEnabled ? rolloverAmount : 0;

  const discretionaryBudget =
    totalIncome + rollover - totalFixedExpenses - totalSavingsAllocations;

  return {
    totalIncome,
    totalFixedExpenses,
    totalSavingsAllocations,
    rollover,
    discretionaryBudget,
    incomeBreakdown: activeIncome.map((s) => ({ name: s.name, amount: s.amount })),
    expenseBreakdown: activeExpenses.map((e) => ({ name: e.name, amount: e.amount })),
    savingsBreakdown: activeSavings.map((s) => ({
      name: s.name,
      amount: s.type === "percentage" ? (totalIncome * s.amount) / 100 : s.amount,
    })),
  };
}

// ─── Spending Summary ────────────────────────────────────────────────────────

/**
 * Summarize spending from a list of transactions within a date range.
 * Only counts transactions with type === "expense".
 */
export function calculateSpent(
  transactions: TransactionData[],
  dateRange?: DateRange
): SpentSummary {
  let filtered = transactions;

  if (dateRange) {
    filtered = transactions.filter(
      (t) => t.date >= dateRange.start && t.date <= dateRange.end
    );
  }

  const expenses = filtered.filter((t) => t.type === "expense");

  const total = expenses.reduce((sum, t) => sum + t.amount, 0);

  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const t of filtered) {
    const catKey = t.categoryId || "uncategorized";
    byCategory[catKey] = (byCategory[catKey] || 0) + t.amount;
    byType[t.type] = (byType[t.type] || 0) + t.amount;
  }

  const essential = expenses
    .filter((t) => t.essential)
    .reduce((sum, t) => sum + t.amount, 0);

  const nonEssential = expenses
    .filter((t) => !t.essential)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    total,
    byCategory,
    byType,
    essential,
    nonEssential,
    transactionCount: expenses.length,
  };
}

// ─── Remaining ───────────────────────────────────────────────────────────────

/**
 * Simple remaining = discretionary budget - total spent.
 */
export function calculateRemaining(
  discretionaryBudget: number,
  totalSpent: number
): number {
  return discretionaryBudget - totalSpent;
}

// ─── Safe to Spend Today ─────────────────────────────────────────────────────

/**
 * The primary metric.
 *
 * Formula:
 *   remaining = discretionaryBudget - spentThisMonth
 *   daysRemaining = daysInMonth - dayOfMonth + (includeTodayInDays ? 1 : 0)
 *   safeToSpend = remaining / daysRemaining
 *
 * If daysRemaining is 0 (last day and not including today), all remaining
 * goes to today.
 *
 * Returns a comprehensive result object with status and explanation.
 */
export function calculateSafeToSpendToday(
  params: SafeToSpendParams
): SafeToSpendResult {
  const { monthlyBudget, spentThisMonth, spentToday, currentDate, includeTodayInDays } = params;

  const { discretionaryBudget, totalIncome, totalFixedExpenses, totalSavingsAllocations, rollover } = monthlyBudget;

  const daysInMonth = getDaysInMonth(currentDate);
  const dayOfMonth = getDate(currentDate);

  // Days remaining including or excluding today
  let daysRemaining = daysInMonth - dayOfMonth + (includeTodayInDays ? 1 : 0);
  if (daysRemaining <= 0) daysRemaining = 1; // Minimum 1 day to avoid division by zero

  const remaining = discretionaryBudget - spentThisMonth;
  const safeToSpend = remaining / daysRemaining;
  const dailyPace = discretionaryBudget / daysInMonth;

  // Project month-end: if current daily spending rate continues
  const daysElapsed = dayOfMonth;
  const avgDailySpending = daysElapsed > 0 ? spentThisMonth / daysElapsed : 0;
  const projectedTotalSpending = avgDailySpending * daysInMonth;
  const projectedMonthEnd = discretionaryBudget - projectedTotalSpending;

  const budgetUsagePercent =
    discretionaryBudget > 0
      ? (spentThisMonth / discretionaryBudget) * 100
      : spentThisMonth > 0
        ? 100
        : 0;

  // Expected usage at this point in the month
  const expectedUsagePercent = (dayOfMonth / daysInMonth) * 100;

  let status: SafeToSpendResult["status"];
  if (budgetUsagePercent > expectedUsagePercent * 1.15) {
    status = "over";
  } else if (budgetUsagePercent > expectedUsagePercent * 0.95) {
    status = "caution";
  } else {
    status = "healthy";
  }

  // Build explanation
  const parts: string[] = [];
  if (totalIncome > 0) parts.push(`Income ${formatNum(totalIncome)}`);
  if (rollover > 0) parts.push(`+ Rollover ${formatNum(rollover)}`);
  if (totalFixedExpenses > 0) parts.push(`− Fixed ${formatNum(totalFixedExpenses)}`);
  if (totalSavingsAllocations > 0) parts.push(`− Savings ${formatNum(totalSavingsAllocations)}`);
  if (spentThisMonth > 0) parts.push(`− Spent ${formatNum(spentThisMonth)}`);
  parts.push(`÷ ${daysRemaining} days remaining`);

  return {
    amount: Math.max(safeToSpend, 0),
    remaining: Math.max(remaining, 0),
    daysRemaining,
    dailyPace,
    projectedMonthEnd,
    budgetUsagePercent: Math.round(budgetUsagePercent * 10) / 10,
    status,
    explanation: parts.join(" "),
  };
}

function formatNum(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// ─── Daily Pace ──────────────────────────────────────────────────────────────

/**
 * Generate daily pace data for a month — actual vs expected spending per day.
 */
export function calculateDailyPace(
  transactions: TransactionData[],
  discretionaryBudget: number,
  monthDate: Date
): DailyPaceData[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const daysInMonth = getDaysInMonth(monthDate);
  const dailyPace = discretionaryBudget / daysInMonth;

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group expenses by day
  const spendingByDay: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const key = format(t.date, "yyyy-MM-dd");
    spendingByDay[key] = (spendingByDay[key] || 0) + t.amount;
  }

  let cumulative = 0;
  return days.map((day, index) => {
    const key = format(day, "yyyy-MM-dd");
    const spent = spendingByDay[key] || 0;
    cumulative += spent;

    return {
      date: key,
      spent,
      pace: dailyPace,
      cumulative,
      cumulativePace: dailyPace * (index + 1),
    };
  });
}

// ─── Category Distribution ───────────────────────────────────────────────────

/**
 * Calculate spending distribution across categories.
 */
export function calculateCategorySpending(
  transactions: TransactionData[],
  categories: Array<{ id: string; name: string; color: string; icon: string | null }>
): CategorySpending[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

  const byCategoryId: Record<
    string,
    { amount: number; count: number }
  > = {};

  for (const t of expenses) {
    const key = t.categoryId || "uncategorized";
    if (!byCategoryId[key]) {
      byCategoryId[key] = { amount: 0, count: 0 };
    }
    byCategoryId[key].amount += t.amount;
    byCategoryId[key].count += 1;
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return Object.entries(byCategoryId)
    .map(([categoryId, data]) => {
      const cat = categoryMap.get(categoryId);
      return {
        categoryId,
        categoryName: cat?.name || "Other",
        categoryColor: cat?.color || "#6b7280",
        categoryIcon: cat?.icon || "📦",
        amount: data.amount,
        percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
        transactionCount: data.count,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

// ─── Month Comparison ────────────────────────────────────────────────────────

/**
 * Compare spending between two periods.
 */
export function calculateMonthComparison(
  currentTotal: number,
  previousTotal: number
): MonthComparison {
  const difference = currentTotal - previousTotal;
  const percentChange =
    previousTotal > 0 ? ((difference / previousTotal) * 100) : 0;

  let direction: MonthComparison["direction"] = "flat";
  if (Math.abs(percentChange) > 1) {
    direction = difference > 0 ? "up" : "down";
  }

  return {
    currentTotal,
    previousTotal,
    difference,
    percentChange: Math.round(percentChange * 10) / 10,
    direction,
  };
}

// ─── Savings Rate ────────────────────────────────────────────────────────────

/**
 * Calculate savings rate as percentage of income.
 * savingsRate = (income - totalSpent) / income * 100
 */
export function calculateSavingsRate(
  totalIncome: number,
  totalSpent: number
): number {
  if (totalIncome <= 0) return 0;
  const saved = totalIncome - totalSpent;
  return Math.round((saved / totalIncome) * 1000) / 10;
}

// ─── Projected Month End ─────────────────────────────────────────────────────

/**
 * Project the month-end balance based on current spending pace.
 */
export function calculateProjectedMonthEnd(
  discretionaryBudget: number,
  spentSoFar: number,
  daysElapsed: number,
  daysInMonth: number
): number {
  if (daysElapsed <= 0) return discretionaryBudget;
  const dailyRate = spentSoFar / daysElapsed;
  const projectedTotal = dailyRate * daysInMonth;
  return discretionaryBudget - projectedTotal;
}

// ─── Goal Projection ─────────────────────────────────────────────────────────

/**
 * Calculate projection for a savings goal.
 */
export function calculateGoalProjection(
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
    targetDate: Date | null;
  },
  currentDate: Date = new Date()
): GoalProjection {
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const progressPercent =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  // Months remaining at current contribution rate
  const monthsRemaining =
    goal.monthlyContribution > 0
      ? Math.ceil(remaining / goal.monthlyContribution)
      : Infinity;

  // Projected completion date
  const projectedCompletionDate =
    monthsRemaining !== Infinity
      ? addMonths(currentDate, monthsRemaining)
      : null;

  // Required monthly to hit target date
  let requiredMonthly = 0;
  let onTrack = true;

  if (goal.targetDate) {
    const monthsToTarget = differenceInMonths(goal.targetDate, currentDate);
    if (monthsToTarget > 0) {
      requiredMonthly = remaining / monthsToTarget;
      onTrack = goal.monthlyContribution >= requiredMonthly * 0.95;
    } else {
      // Target date has passed
      onTrack = remaining <= 0;
      requiredMonthly = remaining; // Need it all now
    }
  }

  return {
    goalId: goal.id,
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    remaining,
    monthlyContribution: goal.monthlyContribution,
    monthsRemaining: monthsRemaining === Infinity ? -1 : monthsRemaining,
    projectedCompletionDate,
    targetDate: goal.targetDate,
    onTrack,
    requiredMonthly: Math.round(requiredMonthly * 100) / 100,
    progressPercent: Math.round(progressPercent * 10) / 10,
  };
}

// ─── What-If Simulation ─────────────────────────────────────────────────────

/**
 * Simulate: "If I spend less per month, how does it affect my goals?"
 */
export function calculateWhatIf(params: WhatIfParams): WhatIfResult {
  const { currentMonthlySpending, proposedMonthlySpending, monthlyIncome, goals } = params;

  const monthlySavingsIncrease = currentMonthlySpending - proposedMonthlySpending;
  const now = new Date();

  const goalResults = goals.map((goal) => {
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

    // Original timeline
    const originalMonths =
      goal.monthlyContribution > 0
        ? Math.ceil(remaining / goal.monthlyContribution)
        : -1;

    // New timeline with increased savings distributed proportionally
    const newContribution = goal.monthlyContribution + monthlySavingsIncrease / goals.length;
    const newMonths =
      newContribution > 0 ? Math.ceil(remaining / newContribution) : -1;

    return {
      id: goal.id,
      name: goal.name,
      originalMonths,
      newMonths,
      monthsSaved: originalMonths > 0 && newMonths > 0 ? originalMonths - newMonths : 0,
      originalDate:
        originalMonths > 0 ? addMonths(now, originalMonths) : null,
      newDate: newMonths > 0 ? addMonths(now, newMonths) : null,
    };
  });

  return {
    monthlySavingsIncrease,
    goals: goalResults,
  };
}

// ─── Insights Summary ────────────────────────────────────────────────────────

/**
 * Calculate the primary insights metrics for a month.
 */
export function calculateInsightsSummary(
  transactions: TransactionData[],
  discretionaryBudget: number,
  totalIncome: number,
  monthDate: Date
): InsightsSummary {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Count unique spending days
  const spendingDays = new Set(
    expenses.map((t) => format(t.date, "yyyy-MM-dd"))
  );

  const today = new Date();
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const lastDay = today < monthEnd ? today : monthEnd;

  const allDays = eachDayOfInterval({ start: monthStart, end: lastDay });
  const totalDays = allDays.length;
  const activeDays = spendingDays.size;
  const noSpendDays = totalDays - activeDays;

  // Average daily spending (active days only, more meaningful)
  const averageDailySpending = activeDays > 0 ? totalSpent / activeDays : 0;

  // Largest single expense
  const largestExpense =
    expenses.length > 0
      ? expenses.reduce((max, t) => (t.amount > max.amount ? t : max))
      : null;

  const savingsRate = calculateSavingsRate(totalIncome, totalSpent);

  return {
    totalSpent,
    remainingBudget: discretionaryBudget - totalSpent,
    savingsRate,
    averageDailySpending,
    largestExpense,
    noSpendDays,
    activeDays,
    totalDays,
  };
}

// ─── Money Leaks ─────────────────────────────────────────────────────────────

/**
 * Find recurring small expenses that add up — "money leaks".
 * A leak is defined as: same merchant, ≥3 transactions, average under a threshold.
 */
export function findMoneyLeaks(
  transactions: TransactionData[],
  maxAvgAmount: number = 500
): MoneyLeak[] {
  const expenses = transactions.filter((t) => t.type === "expense");

  const byMerchant: Record<string, { amounts: number[]; dates: Date[] }> = {};
  for (const t of expenses) {
    const key = t.merchant.toLowerCase().trim();
    if (!byMerchant[key]) {
      byMerchant[key] = { amounts: [], dates: [] };
    }
    byMerchant[key].amounts.push(t.amount);
    byMerchant[key].dates.push(t.date);
  }

  return Object.entries(byMerchant)
    .filter(([, data]) => {
      const avg = data.amounts.reduce((s, a) => s + a, 0) / data.amounts.length;
      return data.amounts.length >= 3 && avg <= maxAvgAmount;
    })
    .map(([merchant, data]) => {
      const total = data.amounts.reduce((s, a) => s + a, 0);
      const count = data.amounts.length;
      const avg = total / count;

      // Calculate frequency
      const weeks = 4; // Approximate month
      const perWeek = count / weeks;
      let frequency: string;
      if (perWeek >= 5) frequency = "daily";
      else if (perWeek >= 2) frequency = `${Math.round(perWeek)}x/week`;
      else frequency = `${count}x/month`;

      return {
        merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
        totalAmount: total,
        transactionCount: count,
        averageAmount: Math.round(avg * 100) / 100,
        frequency,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

// ─── Weekday Spending ────────────────────────────────────────────────────────

/**
 * Analyze spending patterns by day of week.
 */
export function calculateWeekdaySpending(
  transactions: TransactionData[]
): WeekdaySpending[] {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const expenses = transactions.filter((t) => t.type === "expense");
  const byDay: Record<number, { total: number; count: number }> = {};

  for (let i = 0; i < 7; i++) {
    byDay[i] = { total: 0, count: 0 };
  }

  for (const t of expenses) {
    const day = getDay(t.date);
    byDay[day].total += t.amount;
    byDay[day].count += 1;
  }

  // Count occurrences of each weekday in the data range
  const uniqueWeeks = new Set(
    expenses.map((t) => format(t.date, "yyyy-'W'II"))
  );
  const weekCount = Math.max(uniqueWeeks.size, 1);

  return dayNames.map((name, index) => ({
    dayName: name,
    dayIndex: index,
    total: byDay[index].total,
    average: byDay[index].total / weekCount,
    transactionCount: byDay[index].count,
  }));
}

// ─── Budget Runout Projection ────────────────────────────────────────────────

/**
 * Project when the budget will run out at the current pace.
 * Returns the day of month (1-indexed) or null if budget won't run out.
 */
export function projectBudgetRunout(
  discretionaryBudget: number,
  spentSoFar: number,
  dayOfMonth: number,
  daysInMonth: number
): number | null {
  if (dayOfMonth <= 0) return null;
  const dailyRate = spentSoFar / dayOfMonth;
  if (dailyRate <= 0) return null;

  const runoutDay = discretionaryBudget / dailyRate;
  if (runoutDay > daysInMonth) return null;

  return Math.ceil(runoutDay);
}
