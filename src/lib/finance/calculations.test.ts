import { describe, it, expect } from "vitest";
import {
  calculateMonthlyBudget,
  calculateSpent,
  calculateRemaining,
  calculateSafeToSpendToday,
  calculateSavingsRate,
  calculateGoalProjection,
  calculateMonthComparison,
  calculateDailyPace,
  findMoneyLeaks,
  projectBudgetRunout,
  calculateWeekdaySpending,
  calculateInsightsSummary,
} from "./calculations";
import type {
  MonthlyBudgetParams,
  TransactionData,
  SafeToSpendParams,
} from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTransaction(
  overrides: Partial<TransactionData> = {}
): TransactionData {
  return {
    id: "t1",
    date: new Date("2026-09-10"),
    amount: 100,
    type: "expense",
    categoryId: "cat-food",
    merchant: "Restaurant",
    essential: false,
    ...overrides,
  };
}

const baseBudgetParams: MonthlyBudgetParams = {
  incomeSources: [
    { id: "i1", name: "Salary", amount: 50000, active: true },
    { id: "i2", name: "Freelance", amount: 10000, active: true },
  ],
  fixedExpenses: [
    { id: "e1", name: "Rent", amount: 15000, active: true },
    { id: "e2", name: "Utilities", amount: 3000, active: true },
  ],
  savingsAllocations: [
    { id: "s1", name: "Emergency", amount: 5000, type: "fixed", active: true },
  ],
  rolloverAmount: 0,
  rolloverEnabled: false,
};

// ─── calculateMonthlyBudget ─────────────────────────────────────────────────

describe("calculateMonthlyBudget", () => {
  it("calculates discretionary budget correctly", () => {
    const result = calculateMonthlyBudget(baseBudgetParams);

    expect(result.totalIncome).toBe(60000);
    expect(result.totalFixedExpenses).toBe(18000);
    expect(result.totalSavingsAllocations).toBe(5000);
    expect(result.discretionaryBudget).toBe(37000);
  });

  it("excludes inactive sources", () => {
    const params = {
      ...baseBudgetParams,
      incomeSources: [
        { id: "i1", name: "Salary", amount: 50000, active: true },
        { id: "i2", name: "Freelance", amount: 10000, active: false },
      ],
    };
    const result = calculateMonthlyBudget(params);
    expect(result.totalIncome).toBe(50000);
  });

  it("handles percentage-based savings", () => {
    const params = {
      ...baseBudgetParams,
      savingsAllocations: [
        { id: "s1", name: "Save 10%", amount: 10, type: "percentage" as const, active: true },
      ],
    };
    const result = calculateMonthlyBudget(params);
    // 10% of 60000 = 6000
    expect(result.totalSavingsAllocations).toBe(6000);
    expect(result.discretionaryBudget).toBe(60000 - 18000 - 6000);
  });

  it("includes rollover when enabled", () => {
    const params = {
      ...baseBudgetParams,
      rolloverAmount: 2000,
      rolloverEnabled: true,
    };
    const result = calculateMonthlyBudget(params);
    expect(result.rollover).toBe(2000);
    expect(result.discretionaryBudget).toBe(39000);
  });

  it("ignores rollover when disabled", () => {
    const params = {
      ...baseBudgetParams,
      rolloverAmount: 2000,
      rolloverEnabled: false,
    };
    const result = calculateMonthlyBudget(params);
    expect(result.rollover).toBe(0);
    expect(result.discretionaryBudget).toBe(37000);
  });

  it("handles zero income", () => {
    const params = {
      ...baseBudgetParams,
      incomeSources: [],
    };
    const result = calculateMonthlyBudget(params);
    expect(result.totalIncome).toBe(0);
    expect(result.discretionaryBudget).toBe(-23000);
  });

  it("returns breakdowns", () => {
    const result = calculateMonthlyBudget(baseBudgetParams);
    expect(result.incomeBreakdown).toHaveLength(2);
    expect(result.expenseBreakdown).toHaveLength(2);
    expect(result.savingsBreakdown).toHaveLength(1);
  });
});

// ─── calculateSpent ──────────────────────────────────────────────────────────

describe("calculateSpent", () => {
  it("sums only expense transactions", () => {
    const transactions = [
      makeTransaction({ amount: 200, type: "expense" }),
      makeTransaction({ id: "t2", amount: 300, type: "expense" }),
      makeTransaction({ id: "t3", amount: 5000, type: "income" }),
    ];
    const result = calculateSpent(transactions);
    expect(result.total).toBe(500);
    expect(result.transactionCount).toBe(2);
  });

  it("filters by date range", () => {
    const transactions = [
      makeTransaction({ date: new Date("2026-09-01"), amount: 100 }),
      makeTransaction({ id: "t2", date: new Date("2026-09-15"), amount: 200 }),
      makeTransaction({ id: "t3", date: new Date("2026-10-01"), amount: 300 }),
    ];
    const result = calculateSpent(transactions, {
      start: new Date("2026-09-01"),
      end: new Date("2026-09-30"),
    });
    expect(result.total).toBe(300);
  });

  it("tracks essential vs non-essential", () => {
    const transactions = [
      makeTransaction({ amount: 200, essential: true }),
      makeTransaction({ id: "t2", amount: 300, essential: false }),
    ];
    const result = calculateSpent(transactions);
    expect(result.essential).toBe(200);
    expect(result.nonEssential).toBe(300);
  });

  it("handles empty transactions", () => {
    const result = calculateSpent([]);
    expect(result.total).toBe(0);
    expect(result.transactionCount).toBe(0);
  });
});

// ─── calculateSafeToSpendToday ──────────────────────────────────────────────

describe("calculateSafeToSpendToday", () => {
  const budget = calculateMonthlyBudget(baseBudgetParams);

  it("distributes remaining budget across remaining days", () => {
    // September 10th, 2026: 21 days remaining (including today)
    const result = calculateSafeToSpendToday({
      monthlyBudget: budget,
      spentThisMonth: 10000,
      spentToday: 0,
      currentDate: new Date("2026-09-10"),
      includeTodayInDays: true,
    });

    // remaining = 37000 - 10000 = 27000
    // daysRemaining = 30 - 10 + 1 = 21
    // safe = 27000 / 21 ≈ 1285.71
    expect(result.remaining).toBe(27000);
    expect(result.daysRemaining).toBe(21);
    expect(result.amount).toBeCloseTo(1285.71, 0);
  });

  it("handles first day of month (full budget)", () => {
    const result = calculateSafeToSpendToday({
      monthlyBudget: budget,
      spentThisMonth: 0,
      spentToday: 0,
      currentDate: new Date("2026-09-01"),
      includeTodayInDays: true,
    });

    // All 37000 spread across 30 days
    expect(result.remaining).toBe(37000);
    expect(result.daysRemaining).toBe(30);
    expect(result.amount).toBeCloseTo(1233.33, 0);
  });

  it("handles last day of month", () => {
    const result = calculateSafeToSpendToday({
      monthlyBudget: budget,
      spentThisMonth: 35000,
      spentToday: 0,
      currentDate: new Date("2026-09-30"),
      includeTodayInDays: true,
    });

    // remaining = 37000 - 35000 = 2000, 1 day left
    expect(result.remaining).toBe(2000);
    expect(result.daysRemaining).toBe(1);
    expect(result.amount).toBe(2000);
  });

  it("handles over-budget scenario (returns 0)", () => {
    const result = calculateSafeToSpendToday({
      monthlyBudget: budget,
      spentThisMonth: 40000,
      spentToday: 0,
      currentDate: new Date("2026-09-15"),
      includeTodayInDays: true,
    });

    expect(result.amount).toBe(0);
    expect(result.remaining).toBe(0);
    expect(result.status).toBe("over");
  });

  it("sets status correctly", () => {
    // Healthy: early in month, low spending
    const healthy = calculateSafeToSpendToday({
      monthlyBudget: budget,
      spentThisMonth: 5000,
      spentToday: 0,
      currentDate: new Date("2026-09-10"),
      includeTodayInDays: true,
    });
    expect(healthy.status).toBe("healthy");

    // Over: late in month, high spending
    const over = calculateSafeToSpendToday({
      monthlyBudget: budget,
      spentThisMonth: 36000,
      spentToday: 0,
      currentDate: new Date("2026-09-15"),
      includeTodayInDays: true,
    });
    expect(over.status).toBe("over");
  });

  it("generates explanation string", () => {
    const result = calculateSafeToSpendToday({
      monthlyBudget: budget,
      spentThisMonth: 10000,
      spentToday: 0,
      currentDate: new Date("2026-09-10"),
      includeTodayInDays: true,
    });

    expect(result.explanation).toContain("Income");
    expect(result.explanation).toContain("Fixed");
    expect(result.explanation).toContain("Spent");
    expect(result.explanation).toContain("days remaining");
  });
});

// ─── calculateSavingsRate ────────────────────────────────────────────────────

describe("calculateSavingsRate", () => {
  it("calculates correct percentage", () => {
    expect(calculateSavingsRate(100000, 70000)).toBe(30);
  });

  it("handles zero income", () => {
    expect(calculateSavingsRate(0, 5000)).toBe(0);
  });

  it("handles negative savings (overspending)", () => {
    expect(calculateSavingsRate(50000, 60000)).toBe(-20);
  });
});

// ─── calculateGoalProjection ─────────────────────────────────────────────────

describe("calculateGoalProjection", () => {
  it("projects completion date correctly", () => {
    const result = calculateGoalProjection(
      {
        id: "g1",
        name: "Emergency Fund",
        targetAmount: 100000,
        currentAmount: 40000,
        monthlyContribution: 5000,
        targetDate: null,
      },
      new Date("2026-09-01")
    );

    // 60000 remaining / 5000 per month = 12 months
    expect(result.remaining).toBe(60000);
    expect(result.monthsRemaining).toBe(12);
    expect(result.progressPercent).toBe(40);
  });

  it("detects off-track goal", () => {
    const result = calculateGoalProjection(
      {
        id: "g1",
        name: "Vacation",
        targetAmount: 50000,
        currentAmount: 10000,
        monthlyContribution: 2000,
        targetDate: new Date("2027-03-01"), // 6 months away
      },
      new Date("2026-09-01")
    );

    // Need 40000 in 6 months = 6667/month, but only contributing 2000
    expect(result.onTrack).toBe(false);
    expect(result.requiredMonthly).toBeCloseTo(6666.67, 0);
  });

  it("handles completed goal", () => {
    const result = calculateGoalProjection({
      id: "g1",
      name: "Done",
      targetAmount: 10000,
      currentAmount: 10000,
      monthlyContribution: 1000,
      targetDate: null,
    });

    expect(result.remaining).toBe(0);
    expect(result.progressPercent).toBe(100);
  });

  it("handles zero contribution", () => {
    const result = calculateGoalProjection({
      id: "g1",
      name: "Stalled",
      targetAmount: 100000,
      currentAmount: 20000,
      monthlyContribution: 0,
      targetDate: null,
    });

    expect(result.monthsRemaining).toBe(-1);
    expect(result.projectedCompletionDate).toBeNull();
  });
});

// ─── calculateMonthComparison ────────────────────────────────────────────────

describe("calculateMonthComparison", () => {
  it("detects increase", () => {
    const result = calculateMonthComparison(15000, 10000);
    expect(result.direction).toBe("up");
    expect(result.percentChange).toBe(50);
  });

  it("detects decrease", () => {
    const result = calculateMonthComparison(8000, 10000);
    expect(result.direction).toBe("down");
    expect(result.percentChange).toBe(-20);
  });

  it("detects flat", () => {
    const result = calculateMonthComparison(10050, 10000);
    expect(result.direction).toBe("flat");
  });
});

// ─── findMoneyLeaks ──────────────────────────────────────────────────────────

describe("findMoneyLeaks", () => {
  it("identifies recurring small purchases", () => {
    const transactions = [
      makeTransaction({ merchant: "Coffee Shop", amount: 150, date: new Date("2026-09-01") }),
      makeTransaction({ id: "t2", merchant: "Coffee Shop", amount: 150, date: new Date("2026-09-03") }),
      makeTransaction({ id: "t3", merchant: "Coffee Shop", amount: 150, date: new Date("2026-09-05") }),
      makeTransaction({ id: "t4", merchant: "Coffee Shop", amount: 150, date: new Date("2026-09-07") }),
    ];

    const leaks = findMoneyLeaks(transactions);
    expect(leaks).toHaveLength(1);
    expect(leaks[0].merchant).toBe("Coffee shop");
    expect(leaks[0].totalAmount).toBe(600);
    expect(leaks[0].transactionCount).toBe(4);
  });

  it("excludes large recurring expenses", () => {
    const transactions = [
      makeTransaction({ merchant: "Fancy Restaurant", amount: 2000, date: new Date("2026-09-01") }),
      makeTransaction({ id: "t2", merchant: "Fancy Restaurant", amount: 2000, date: new Date("2026-09-10") }),
      makeTransaction({ id: "t3", merchant: "Fancy Restaurant", amount: 2000, date: new Date("2026-09-20") }),
    ];

    const leaks = findMoneyLeaks(transactions, 500);
    expect(leaks).toHaveLength(0);
  });
});

// ─── projectBudgetRunout ─────────────────────────────────────────────────────

describe("projectBudgetRunout", () => {
  it("projects runout day", () => {
    // Budget: 30000, spent 15000 in 10 days = 1500/day
    // Runout at day 20 (30000 / 1500)
    const day = projectBudgetRunout(30000, 15000, 10, 30);
    expect(day).toBe(20);
  });

  it("returns null when budget won't run out", () => {
    // Budget: 30000, spent 5000 in 10 days = 500/day
    // Would run out at day 60, beyond month
    const day = projectBudgetRunout(30000, 5000, 10, 30);
    expect(day).toBeNull();
  });

  it("handles no spending", () => {
    const day = projectBudgetRunout(30000, 0, 10, 30);
    expect(day).toBeNull();
  });
});

// ─── calculateDailyPace ─────────────────────────────────────────────────────

describe("calculateDailyPace", () => {
  it("generates data for all days in month", () => {
    const result = calculateDailyPace([], 30000, new Date("2026-09-15"));
    expect(result).toHaveLength(30); // September has 30 days
    expect(result[0].pace).toBe(1000); // 30000 / 30
  });

  it("tracks cumulative spending", () => {
    const transactions = [
      makeTransaction({ date: new Date("2026-09-01"), amount: 500 }),
      makeTransaction({ id: "t2", date: new Date("2026-09-01"), amount: 300 }),
      makeTransaction({ id: "t3", date: new Date("2026-09-02"), amount: 200 }),
    ];

    const result = calculateDailyPace(transactions, 30000, new Date("2026-09-15"));
    expect(result[0].spent).toBe(800); // Day 1
    expect(result[0].cumulative).toBe(800);
    expect(result[1].spent).toBe(200); // Day 2
    expect(result[1].cumulative).toBe(1000);
    expect(result[2].spent).toBe(0); // Day 3
    expect(result[2].cumulative).toBe(1000);
  });
});
