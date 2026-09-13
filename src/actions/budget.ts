"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import {
  updateSettingsSchema,
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
  createFixedExpenseSchema,
  updateFixedExpenseSchema,
  createSavingsAllocationSchema,
  updateSavingsAllocationSchema,
  monthlyOverrideSchema,
  createCategorySchema,
  updateCategorySchema,
  type UpdateSettingsInput,
  type CreateIncomeSourceInput,
  type UpdateIncomeSourceInput,
  type CreateFixedExpenseInput,
  type UpdateFixedExpenseInput,
  type CreateSavingsAllocationInput,
  type UpdateSavingsAllocationInput,
  type MonthlyOverrideInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/validators/budget";

// ─── User Settings ───────────────────────────────────────────────────────────

/**
 * Get or create default user settings. If no row exists, create one with defaults and seed default categories.
 */
export async function getUserSettings() {
  try {
    let settings = await db.userSettings.findFirst();

    if (!settings) {
      settings = await db.userSettings.create({
        data: {
          id: "default",
          currency: "INR",
          theme: "system",
          monthlyBudget: 0,
          rolloverEnabled: false,
          rolloverAmount: 0,
          includeTodayInDays: true,
          receiptStoragePath: "./public/receipts",
        },
      });

      await ensureDefaultCategories();
    }

    return settings;
  } catch (error) {
    console.error("Failed to get user settings:", error);
    return null;
  }
}

/**
 * Validate and update user settings.
 */
export async function updateUserSettings(input: UpdateSettingsInput) {
  try {
    const validated = updateSettingsSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const settings = await db.userSettings.upsert({
      where: { id: "default" },
      update: validated.data,
      create: {
        id: "default",
        ...validated.data,
      },
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: settings };
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user settings",
    };
  }
}

// ─── Categories ──────────────────────────────────────────────────────────────

/**
 * Check if categories exist, if not create defaults from constants.
 */
export async function ensureDefaultCategories() {
  try {
    const count = await db.category.count();
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await db.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
            sortOrder: cat.sortOrder,
            active: true,
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to ensure default categories:", error);
  }
}

/**
 * All categories ordered by sortOrder ASC.
 */
export async function getCategories() {
  try {
    await ensureDefaultCategories();
    return await db.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Failed to get categories:", error);
    return [];
  }
}

/**
 * Create a new category.
 */
export async function createCategory(input: CreateCategoryInput) {
  try {
    const validated = createCategorySchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const category = await db.category.create({
      data: validated.data,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to create category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

/**
 * Update an existing category.
 */
export async function updateCategory(id: string, input: UpdateCategoryInput) {
  try {
    const validated = updateCategorySchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const category = await db.category.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to update category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

/**
 * Delete category (set transactions to null categoryId first).
 */
export async function deleteCategory(id: string) {
  try {
    await db.$transaction([
      db.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      }),
      db.category.delete({
        where: { id },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

// ─── Income Sources ──────────────────────────────────────────────────────────

/**
 * All income sources, ordered by createdAt ASC.
 */
export async function getIncomeSources() {
  try {
    return await db.incomeSource.findMany({
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Failed to get income sources:", error);
    return [];
  }
}

/**
 * Create income source.
 */
export async function createIncomeSource(input: CreateIncomeSourceInput) {
  try {
    const validated = createIncomeSourceSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const incomeSource = await db.incomeSource.create({
      data: validated.data,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: incomeSource };
  } catch (error) {
    console.error("Failed to create income source:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create income source",
    };
  }
}

/**
 * Update income source.
 */
export async function updateIncomeSource(id: string, input: UpdateIncomeSourceInput) {
  try {
    const validated = updateIncomeSourceSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const incomeSource = await db.incomeSource.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: incomeSource };
  } catch (error) {
    console.error("Failed to update income source:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update income source",
    };
  }
}

/**
 * Delete income source and associated overrides.
 */
export async function deleteIncomeSource(id: string) {
  try {
    await db.$transaction([
      db.monthlyOverride.deleteMany({
        where: { sourceType: "income", sourceId: id },
      }),
      db.incomeSource.delete({
        where: { id },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete income source:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete income source",
    };
  }
}

// ─── Fixed Expenses ──────────────────────────────────────────────────────────

/**
 * All fixed expenses, ordered by dayOfMonth ASC then createdAt ASC.
 */
export async function getFixedExpenses() {
  try {
    return await db.fixedExpense.findMany({
      orderBy: [{ dayOfMonth: "asc" }, { createdAt: "asc" }],
    });
  } catch (error) {
    console.error("Failed to get fixed expenses:", error);
    return [];
  }
}

/**
 * Create fixed expense.
 */
export async function createFixedExpense(input: CreateFixedExpenseInput) {
  try {
    const validated = createFixedExpenseSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const fixedExpense = await db.fixedExpense.create({
      data: validated.data,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: fixedExpense };
  } catch (error) {
    console.error("Failed to create fixed expense:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create fixed expense",
    };
  }
}

/**
 * Update fixed expense.
 */
export async function updateFixedExpense(id: string, input: UpdateFixedExpenseInput) {
  try {
    const validated = updateFixedExpenseSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const fixedExpense = await db.fixedExpense.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: fixedExpense };
  } catch (error) {
    console.error("Failed to update fixed expense:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update fixed expense",
    };
  }
}

/**
 * Delete fixed expense and associated overrides.
 */
export async function deleteFixedExpense(id: string) {
  try {
    await db.$transaction([
      db.monthlyOverride.deleteMany({
        where: { sourceType: "fixedExpense", sourceId: id },
      }),
      db.fixedExpense.delete({
        where: { id },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete fixed expense:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete fixed expense",
    };
  }
}

// ─── Savings Allocations ─────────────────────────────────────────────────────

/**
 * All savings allocations, ordered by createdAt ASC.
 */
export async function getSavingsAllocations() {
  try {
    return await db.savingsAllocation.findMany({
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Failed to get savings allocations:", error);
    return [];
  }
}

/**
 * Create savings allocation.
 */
export async function createSavingsAllocation(input: CreateSavingsAllocationInput) {
  try {
    const validated = createSavingsAllocationSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const savingsAllocation = await db.savingsAllocation.create({
      data: validated.data,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: savingsAllocation };
  } catch (error) {
    console.error("Failed to create savings allocation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create savings allocation",
    };
  }
}

/**
 * Update savings allocation.
 */
export async function updateSavingsAllocation(id: string, input: UpdateSavingsAllocationInput) {
  try {
    const validated = updateSavingsAllocationSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const savingsAllocation = await db.savingsAllocation.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: savingsAllocation };
  } catch (error) {
    console.error("Failed to update savings allocation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update savings allocation",
    };
  }
}

/**
 * Delete savings allocation and associated overrides.
 */
export async function deleteSavingsAllocation(id: string) {
  try {
    await db.$transaction([
      db.monthlyOverride.deleteMany({
        where: { sourceType: "savingsAllocation", sourceId: id },
      }),
      db.savingsAllocation.delete({
        where: { id },
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete savings allocation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete savings allocation",
    };
  }
}

// ─── Monthly Overrides ───────────────────────────────────────────────────────

/**
 * All overrides for a month.
 */
export async function getMonthlyOverrides(month: string) {
  try {
    return await db.monthlyOverride.findMany({
      where: { month },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Failed to get monthly overrides:", error);
    return [];
  }
}

/**
 * Upsert a monthly override.
 */
export async function setMonthlyOverride(input: MonthlyOverrideInput) {
  try {
    const validated = monthlyOverrideSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { sourceType, sourceId, month, amount, note } = validated.data;

    const override = await db.monthlyOverride.upsert({
      where: {
        sourceType_sourceId_month: {
          sourceType,
          sourceId,
          month,
        },
      },
      update: {
        amount,
        note,
      },
      create: {
        sourceType,
        sourceId,
        month,
        amount,
        note,
      },
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, data: override };
  } catch (error) {
    console.error("Failed to set monthly override:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set monthly override",
    };
  }
}

/**
 * Delete a monthly override by ID.
 */
export async function deleteMonthlyOverride(id: string) {
  try {
    await db.monthlyOverride.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete monthly override:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete monthly override",
    };
  }
}

// ─── Monthly Budget Data Resolution ──────────────────────────────────────────

export interface ResolvedBudgetItem<T> {
  item: T;
  effectiveAmount: number;
  originalAmount: number;
  isOverridden: boolean;
}

export interface MonthlyBudgetData {
  month: string;
  incomeSources: Array<{
    id: string;
    name: string;
    amount: number;
    category: string;
    active: boolean;
    originalAmount: number;
    isOverridden: boolean;
  }>;
  fixedExpenses: Array<{
    id: string;
    name: string;
    amount: number;
    category: string;
    dayOfMonth: number;
    active: boolean;
    originalAmount: number;
    isOverridden: boolean;
  }>;
  savingsAllocations: Array<{
    id: string;
    name: string;
    amount: number;
    type: "fixed" | "percentage";
    active: boolean;
    originalAmount: number;
    isOverridden: boolean;
  }>;
  overrides: Array<{
    id: string;
    sourceType: string;
    sourceId: string;
    month: string;
    amount: number;
    note: string | null;
  }>;
}

/**
 * Returns income sources, fixed expenses, savings allocations with overrides resolved for the given month.
 * This is the main data-fetching function for budget calculations.
 *
 * Filter criteria:
 * - active status === true
 * - date range: startDate <= monthEnd, endDate null or >= monthStart
 * - overrides replace base amount when present
 */
export async function getMonthlyBudgetData(month: string): Promise<MonthlyBudgetData> {
  try {
    const targetMonth = month && /^\d{4}-\d{2}$/.test(month)
      ? month
      : format(new Date(), "yyyy-MM");

    const [yearStr, monthNumStr] = targetMonth.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);

    const startOfMonthDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const endOfMonthDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const [rawIncome, rawFixed, rawSavings, overrides] = await Promise.all([
      db.incomeSource.findMany({
        where: {
          active: true,
          startDate: { lte: endOfMonthDate },
          OR: [{ endDate: null }, { endDate: { gte: startOfMonthDate } }],
        },
        orderBy: { createdAt: "asc" },
      }),
      db.fixedExpense.findMany({
        where: {
          active: true,
          startDate: { lte: endOfMonthDate },
          OR: [{ endDate: null }, { endDate: { gte: startOfMonthDate } }],
        },
        orderBy: [{ dayOfMonth: "asc" }, { createdAt: "asc" }],
      }),
      db.savingsAllocation.findMany({
        where: {
          active: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      db.monthlyOverride.findMany({
        where: { month: targetMonth },
      }),
    ]);

    const overrideMap = new Map<string, number>();
    for (const ov of overrides) {
      overrideMap.set(`${ov.sourceType}:${ov.sourceId}`, ov.amount);
    }

    const incomeSources = rawIncome.map((s) => {
      const key = `income:${s.id}`;
      const hasOverride = overrideMap.has(key);
      const effectiveAmount = hasOverride ? overrideMap.get(key)! : s.amount;

      return {
        id: s.id,
        name: s.name,
        amount: effectiveAmount,
        category: s.category,
        active: s.active,
        originalAmount: s.amount,
        isOverridden: hasOverride,
      };
    });

    const fixedExpenses = rawFixed.map((e) => {
      const key = `fixedExpense:${e.id}`;
      const hasOverride = overrideMap.has(key);
      const effectiveAmount = hasOverride ? overrideMap.get(key)! : e.amount;

      return {
        id: e.id,
        name: e.name,
        amount: effectiveAmount,
        category: e.category,
        dayOfMonth: e.dayOfMonth,
        active: e.active,
        originalAmount: e.amount,
        isOverridden: hasOverride,
      };
    });

    const savingsAllocations = rawSavings.map((s) => {
      const key = `savingsAllocation:${s.id}`;
      const hasOverride = overrideMap.has(key);
      const effectiveAmount = hasOverride ? overrideMap.get(key)! : s.amount;

      return {
        id: s.id,
        name: s.name,
        amount: effectiveAmount,
        type: (s.type === "percentage" ? "percentage" : "fixed") as "fixed" | "percentage",
        active: s.active,
        originalAmount: s.amount,
        isOverridden: hasOverride,
      };
    });

    return {
      month: targetMonth,
      incomeSources,
      fixedExpenses,
      savingsAllocations,
      overrides,
    };
  } catch (error) {
    console.error("Failed to get monthly budget data:", error);
    return {
      month,
      incomeSources: [],
      fixedExpenses: [],
      savingsAllocations: [],
      overrides: [],
    };
  }
}
