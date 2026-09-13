"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { db } from "@/lib/db";
import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "@/lib/validators/transactions";
import type { Prisma } from "@prisma/client";

export interface TransactionFilters {
  month?: string;
  type?: string;
  categoryId?: string;
  search?: string;
}

export interface MonthSummary {
  total: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  count: number;
}

export interface MonthlyTotal {
  month: string;
  total: number;
}

function getMonthDateRange(monthStr?: string): { start: Date; end: Date; month: string } {
  const targetMonth = monthStr && /^\d{4}-\d{2}$/.test(monthStr)
    ? monthStr
    : format(new Date(), "yyyy-MM");

  const [yearStr, monthNumStr] = targetMonth.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthNumStr, 10);

  const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

  return { start, end, month: targetMonth };
}

/**
 * Returns transactions for a month (default current), filtered.
 * Returns with category relation included, sorted by date DESC.
 */
export async function getTransactions(params?: TransactionFilters) {
  try {
    const { start, end } = getMonthDateRange(params?.month);

    const where: Prisma.TransactionWhereInput = {
      date: {
        gte: start,
        lte: end,
      },
    };

    if (params?.type && params.type !== "all") {
      where.type = params.type;
    }

    if (params?.categoryId && params.categoryId !== "all") {
      if (params.categoryId === "uncategorized") {
        where.categoryId = null;
      } else {
        where.categoryId = params.categoryId;
      }
    }

    if (params?.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      where.OR = [
        { merchant: { contains: searchTerm } },
        { note: { contains: searchTerm } },
      ];
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

/**
 * Get all transactions for a specific date (YYYY-MM-DD). Include category.
 * Also augments the return object with day metadata emoji for drawer views.
 */
export async function getTransactionsByDate(dateStr: string) {
  try {
    const [yearStr, monthNumStr, dayStr] = dateStr.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);
    const day = parseInt(dayStr, 10);

    const start = new Date(year, monthNum - 1, day, 0, 0, 0, 0);
    const end = new Date(year, monthNum - 1, day, 23, 59, 59, 999);

    const [transactions, dayMeta] = await Promise.all([
      db.transaction.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        include: {
          category: true,
        },
        orderBy: [
          { date: "desc" },
          { createdAt: "desc" },
        ],
      }),
      db.dayMetadata.findFirst({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);

    return Object.assign(transactions, {
      transactions,
      emoji: dayMeta?.emoji ?? null,
    });
  } catch (error) {
    console.error("Error fetching transactions by date:", error);
    const emptyList: any[] = [];
    return Object.assign(emptyList, {
      transactions: emptyList,
      emoji: null,
    });
  }
}

/**
 * Returns { total, byCategory, byType, count } aggregated data for a month. Month is YYYY-MM.
 */
export async function getTransactionsSummaryByMonth(month: string): Promise<MonthSummary> {
  try {
    const { start, end } = getMonthDateRange(month);

    const transactions = await db.transaction.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    let total = 0;
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const t of transactions) {
      if (t.type === "expense") {
        total += t.amount;
      }
      const catKey = t.categoryId || "uncategorized";
      byCategory[catKey] = (byCategory[catKey] || 0) + t.amount;
      byType[t.type] = (byType[t.type] || 0) + t.amount;
    }

    return {
      total,
      byCategory,
      byType,
      count: transactions.length,
    };
  } catch (error) {
    console.error("Error fetching monthly transaction summary:", error);
    return {
      total: 0,
      byCategory: {},
      byType: {},
      count: 0,
    };
  }
}

/**
 * Validate with createTransactionSchema, create in DB, revalidate paths.
 */
export async function createTransaction(input: CreateTransactionInput) {
  try {
    const validated = createTransactionSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const transaction = await db.transaction.create({
      data: validated.data,
      include: {
        category: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/insights");

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create transaction",
    };
  }
}

/**
 * Validate with updateTransactionSchema, update in DB, revalidate paths.
 */
export async function updateTransaction(id: string, input: UpdateTransactionInput) {
  try {
    const validated = updateTransactionSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: validated.data,
      include: {
        category: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/insights");

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update transaction",
    };
  }
}

/**
 * Delete by ID, revalidate paths.
 */
export async function deleteTransaction(id: string) {
  try {
    await db.transaction.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/insights");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete transaction",
    };
  }
}

/**
 * For each month (YYYY-MM), return total expense amount. Used for trend charts.
 */
export async function getMonthlyTransactionTotals(months: string[]): Promise<MonthlyTotal[]> {
  try {
    const results: MonthlyTotal[] = [];

    for (const monthStr of months) {
      const { start, end } = getMonthDateRange(monthStr);

      const aggregate = await db.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: "expense",
          date: {
            gte: start,
            lte: end,
          },
        },
      });

      results.push({
        month: monthStr,
        total: aggregate._sum.amount ?? 0,
      });
    }

    return results;
  } catch (error) {
    console.error("Failed to get monthly transaction totals:", error);
    return months.map((m) => ({ month: m, total: 0 }));
  }
}
