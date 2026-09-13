// ─── Finance Calculation Types ───────────────────────────────────────────────
// Pure type definitions for the finance calculation engine.
// No runtime dependencies — used by both server and client code.

export interface DateRange {
  start: Date;
  end: Date;
}

// ─── Budget Inputs ───────────────────────────────────────────────────────────

export interface IncomeSourceData {
  id: string;
  name: string;
  amount: number;
  active: boolean;
}

export interface FixedExpenseData {
  id: string;
  name: string;
  amount: number;
  active: boolean;
}

export interface SavingsAllocationData {
  id: string;
  name: string;
  amount: number;
  type: "fixed" | "percentage";
  active: boolean;
}

export interface TransactionData {
  id: string;
  date: Date;
  amount: number;
  type: "expense" | "income" | "transfer";
  categoryId: string | null;
  merchant: string;
  essential: boolean;
}

// ─── Budget Calculation ──────────────────────────────────────────────────────

export interface MonthlyBudgetParams {
  incomeSources: IncomeSourceData[];
  fixedExpenses: FixedExpenseData[];
  savingsAllocations: SavingsAllocationData[];
  rolloverAmount: number;
  rolloverEnabled: boolean;
}

export interface MonthlyBudget {
  totalIncome: number;
  totalFixedExpenses: number;
  totalSavingsAllocations: number;
  rollover: number;
  discretionaryBudget: number;
  incomeBreakdown: Array<{ name: string; amount: number }>;
  expenseBreakdown: Array<{ name: string; amount: number }>;
  savingsBreakdown: Array<{ name: string; amount: number }>;
}

// ─── Spending Summary ────────────────────────────────────────────────────────

export interface SpentSummary {
  total: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  essential: number;
  nonEssential: number;
  transactionCount: number;
}

// ─── Safe-to-Spend ──────────────────────────────────────────────────────────

export interface SafeToSpendParams {
  monthlyBudget: MonthlyBudget;
  spentThisMonth: number;
  spentToday: number;
  currentDate: Date;
  includeTodayInDays: boolean;
}

export interface SafeToSpendResult {
  /** The primary metric — how much you can safely spend today */
  amount: number;
  /** Total remaining discretionary budget for the month */
  remaining: number;
  /** Days left in the month (including or excluding today based on settings) */
  daysRemaining: number;
  /** Target daily spending to stay on budget */
  dailyPace: number;
  /** Projected balance at month end if current pace continues */
  projectedMonthEnd: number;
  /** Percentage of budget used (0-100+) */
  budgetUsagePercent: number;
  /** Budget health status */
  status: "healthy" | "caution" | "over";
  /** Human-readable explanation of the calculation */
  explanation: string;
}

// ─── Daily Pace ──────────────────────────────────────────────────────────────

export interface DailyPaceData {
  date: string; // YYYY-MM-DD
  spent: number;
  pace: number;
  cumulative: number;
  cumulativePace: number;
}

// ─── Category Distribution ───────────────────────────────────────────────────

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

// ─── Month Comparison ────────────────────────────────────────────────────────

export interface MonthComparison {
  currentTotal: number;
  previousTotal: number;
  difference: number;
  percentChange: number;
  direction: "up" | "down" | "flat";
}

// ─── Savings Goals ───────────────────────────────────────────────────────────

export interface GoalProjection {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  monthlyContribution: number;
  /** Months remaining at current contribution rate */
  monthsRemaining: number;
  /** Projected completion date */
  projectedCompletionDate: Date | null;
  /** Target date from goal settings */
  targetDate: Date | null;
  /** Whether on track to meet target date */
  onTrack: boolean;
  /** Required monthly contribution to meet target date */
  requiredMonthly: number;
  /** Progress percentage (0-100) */
  progressPercent: number;
}

// ─── What-If Simulation ─────────────────────────────────────────────────────

export interface WhatIfParams {
  currentMonthlySpending: number;
  proposedMonthlySpending: number;
  monthlyIncome: number;
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
  }>;
}

export interface WhatIfResult {
  monthlySavingsIncrease: number;
  goals: Array<{
    id: string;
    name: string;
    originalMonths: number;
    newMonths: number;
    monthsSaved: number;
    originalDate: Date | null;
    newDate: Date | null;
  }>;
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface InsightsSummary {
  totalSpent: number;
  remainingBudget: number;
  savingsRate: number;
  averageDailySpending: number;
  largestExpense: TransactionData | null;
  noSpendDays: number;
  activeDays: number;
  totalDays: number;
}

export interface MoneyLeak {
  merchant: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  frequency: string; // e.g., "3x per week"
}

export interface WeekdaySpending {
  dayName: string;
  dayIndex: number;
  total: number;
  average: number;
  transactionCount: number;
}
