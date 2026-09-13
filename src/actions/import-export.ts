"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import Papa from "papaparse";
import { db } from "@/lib/db";

export interface CSVTransactionRow {
  date: string;
  merchant: string;
  amount: number;
  type?: string;
  categoryId?: string | null;
  note?: string | null;
  essential?: boolean;
}

export interface FullBackupData {
  version: string;
  exportedAt: string;
  settings: any;
  incomeSources: any[];
  fixedExpenses: any[];
  savingsAllocations: any[];
  categories: any[];
  transactions: any[];
  goals: any[];
  contributions: any[];
  overrides: any[];
  dayMetadata: any[];
  snapshots: any[];
}

/**
 * Export transactions as CSV string. Columns: date, merchant, amount, type, category, note, essential.
 * If month provided (YYYY-MM), filter by month.
 */
export async function exportTransactionsCSV(month?: string): Promise<string> {
  try {
    let where = {};

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthNumStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthNumStr, 10);
      const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

      where = {
        date: {
          gte: start,
          lte: end,
        },
      };
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

    const rows = transactions.map((t) => ({
      date: format(t.date, "yyyy-MM-dd"),
      merchant: t.merchant,
      amount: t.amount,
      type: t.type,
      category: t.category?.name || "",
      note: t.note || "",
      essential: t.essential ? "true" : "false",
    }));

    return Papa.unparse(rows, {
      columns: ["date", "merchant", "amount", "type", "category", "note", "essential"],
      header: true,
    });
  } catch (error) {
    console.error("Failed to export transactions CSV:", error);
    return "date,merchant,amount,type,category,note,essential\n";
  }
}

/**
 * Export entire database as JSON string:
 * { version: "1.0", exportedAt, settings, incomeSources, fixedExpenses, savingsAllocations, categories, transactions, goals, contributions, overrides, dayMetadata, snapshots }
 */
export async function exportFullBackup(): Promise<string> {
  try {
    const [
      settings,
      incomeSources,
      fixedExpenses,
      savingsAllocations,
      categories,
      transactions,
      goals,
      contributions,
      overrides,
      dayMetadata,
      snapshots,
    ] = await Promise.all([
      db.userSettings.findFirst(),
      db.incomeSource.findMany({ orderBy: { createdAt: "asc" } }),
      db.fixedExpense.findMany({ orderBy: { createdAt: "asc" } }),
      db.savingsAllocation.findMany({ orderBy: { createdAt: "asc" } }),
      db.category.findMany({ orderBy: { sortOrder: "asc" } }),
      db.transaction.findMany({ orderBy: { date: "desc" } }),
      db.savingsGoal.findMany({ orderBy: { createdAt: "asc" } }),
      db.savingsContribution.findMany({ orderBy: { date: "desc" } }),
      db.monthlyOverride.findMany({ orderBy: { createdAt: "asc" } }),
      db.dayMetadata.findMany({ orderBy: { date: "asc" } }),
      db.monthlySnapshot.findMany({ orderBy: { month: "asc" } }),
    ]);

    const backup: FullBackupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      settings,
      incomeSources,
      fixedExpenses,
      savingsAllocations,
      categories,
      transactions,
      goals,
      contributions,
      overrides,
      dayMetadata,
      snapshots,
    };

    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error("Failed to export full backup:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to export backup");
  }
}

/**
 * Parse JSON backup, validate structure, clear existing data, and import all records.
 * Uses a transaction to guarantee atomicity.
 */
export async function importFullBackup(data: string | FullBackupData) {
  try {
    let backup: FullBackupData;
    if (typeof data === "string") {
      try {
        backup = JSON.parse(data);
      } catch {
        return { success: false, error: "Invalid JSON format" };
      }
    } else {
      backup = data;
    }

    if (!backup || typeof backup !== "object") {
      return { success: false, error: "Invalid backup file structure" };
    }

    if (!backup.version) {
      return { success: false, error: "Missing backup version" };
    }

    await db.$transaction(
      async (tx) => {
        // 1. Delete all existing records in reverse dependency order
        await tx.savingsContribution.deleteMany();
        await tx.savingsGoal.deleteMany();
        await tx.transaction.deleteMany();
        await tx.category.deleteMany();
        await tx.monthlyOverride.deleteMany();
        await tx.dayMetadata.deleteMany();
        await tx.monthlySnapshot.deleteMany();
        await tx.savingsAllocation.deleteMany();
        await tx.fixedExpense.deleteMany();
        await tx.incomeSource.deleteMany();
        await tx.userSettings.deleteMany();

        // 2. Restore User Settings
        if (backup.settings) {
          await tx.userSettings.create({
            data: {
              id: backup.settings.id || "default",
              currency: backup.settings.currency ?? "INR",
              theme: backup.settings.theme ?? "system",
              monthlyBudget: backup.settings.monthlyBudget ?? 0,
              rolloverEnabled: backup.settings.rolloverEnabled ?? false,
              rolloverAmount: backup.settings.rolloverAmount ?? 0,
              includeTodayInDays: backup.settings.includeTodayInDays ?? true,
              receiptStoragePath: backup.settings.receiptStoragePath ?? "./public/receipts",
              createdAt: backup.settings.createdAt ? new Date(backup.settings.createdAt) : undefined,
              updatedAt: backup.settings.updatedAt ? new Date(backup.settings.updatedAt) : undefined,
            },
          });
        }

        // 3. Restore Categories
        if (Array.isArray(backup.categories) && backup.categories.length > 0) {
          for (const cat of backup.categories) {
            await tx.category.create({
              data: {
                id: cat.id,
                name: cat.name,
                icon: cat.icon ?? null,
                color: cat.color ?? "#6366f1",
                type: cat.type ?? "expense",
                sortOrder: cat.sortOrder ?? 0,
                active: cat.active ?? true,
                createdAt: cat.createdAt ? new Date(cat.createdAt) : undefined,
                updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : undefined,
              },
            });
          }
        }

        // 4. Restore Income Sources
        if (Array.isArray(backup.incomeSources) && backup.incomeSources.length > 0) {
          for (const s of backup.incomeSources) {
            await tx.incomeSource.create({
              data: {
                id: s.id,
                name: s.name,
                amount: s.amount,
                category: s.category ?? "Salary",
                startDate: s.startDate ? new Date(s.startDate) : new Date(),
                endDate: s.endDate ? new Date(s.endDate) : null,
                active: s.active ?? true,
                notes: s.notes ?? null,
                createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
                updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
              },
            });
          }
        }

        // 5. Restore Fixed Expenses
        if (Array.isArray(backup.fixedExpenses) && backup.fixedExpenses.length > 0) {
          for (const e of backup.fixedExpenses) {
            await tx.fixedExpense.create({
              data: {
                id: e.id,
                name: e.name,
                amount: e.amount,
                category: e.category ?? "Bills",
                dayOfMonth: e.dayOfMonth ?? 1,
                startDate: e.startDate ? new Date(e.startDate) : new Date(),
                endDate: e.endDate ? new Date(e.endDate) : null,
                active: e.active ?? true,
                notes: e.notes ?? null,
                createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
                updatedAt: e.updatedAt ? new Date(e.updatedAt) : undefined,
              },
            });
          }
        }

        // 6. Restore Savings Allocations
        if (Array.isArray(backup.savingsAllocations) && backup.savingsAllocations.length > 0) {
          for (const a of backup.savingsAllocations) {
            await tx.savingsAllocation.create({
              data: {
                id: a.id,
                name: a.name,
                amount: a.amount,
                type: a.type ?? "fixed",
                active: a.active ?? true,
                notes: a.notes ?? null,
                createdAt: a.createdAt ? new Date(a.createdAt) : undefined,
                updatedAt: a.updatedAt ? new Date(a.updatedAt) : undefined,
              },
            });
          }
        }

        // 7. Restore Transactions
        if (Array.isArray(backup.transactions) && backup.transactions.length > 0) {
          for (const t of backup.transactions) {
            await tx.transaction.create({
              data: {
                id: t.id,
                date: new Date(t.date),
                amount: t.amount,
                type: t.type ?? "expense",
                categoryId: t.categoryId ?? null,
                merchant: t.merchant,
                note: t.note ?? null,
                essential: t.essential ?? false,
                satisfaction: t.satisfaction ?? null,
                receiptPath: t.receiptPath ?? null,
                createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
                updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
              },
            });
          }
        }

        // 8. Restore Savings Goals
        if (Array.isArray(backup.goals) && backup.goals.length > 0) {
          for (const g of backup.goals) {
            await tx.savingsGoal.create({
              data: {
                id: g.id,
                name: g.name,
                targetAmount: g.targetAmount,
                currentAmount: g.currentAmount ?? 0,
                targetDate: g.targetDate ? new Date(g.targetDate) : null,
                monthlyContribution: g.monthlyContribution ?? 0,
                status: g.status ?? "active",
                color: g.color ?? "#6366f1",
                notes: g.notes ?? null,
                createdAt: g.createdAt ? new Date(g.createdAt) : undefined,
                updatedAt: g.updatedAt ? new Date(g.updatedAt) : undefined,
              },
            });
          }
        }

        // 9. Restore Savings Contributions
        if (Array.isArray(backup.contributions) && backup.contributions.length > 0) {
          for (const c of backup.contributions) {
            await tx.savingsContribution.create({
              data: {
                id: c.id,
                goalId: c.goalId,
                amount: c.amount,
                date: c.date ? new Date(c.date) : new Date(),
                note: c.note ?? null,
                createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
              },
            });
          }
        }

        // 10. Restore Monthly Overrides
        if (Array.isArray(backup.overrides) && backup.overrides.length > 0) {
          for (const o of backup.overrides) {
            await tx.monthlyOverride.create({
              data: {
                id: o.id,
                sourceType: o.sourceType,
                sourceId: o.sourceId,
                month: o.month,
                amount: o.amount,
                note: o.note ?? null,
                createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
              },
            });
          }
        }

        // 11. Restore Day Metadata
        if (Array.isArray(backup.dayMetadata) && backup.dayMetadata.length > 0) {
          for (const d of backup.dayMetadata) {
            await tx.dayMetadata.create({
              data: {
                id: d.id,
                date: new Date(d.date),
                emoji: d.emoji ?? null,
                note: d.note ?? null,
              },
            });
          }
        }

        // 12. Restore Snapshots
        if (Array.isArray(backup.snapshots) && backup.snapshots.length > 0) {
          for (const s of backup.snapshots) {
            await tx.monthlySnapshot.create({
              data: {
                id: s.id,
                month: s.month,
                totalIncome: s.totalIncome,
                totalExpenses: s.totalExpenses,
                totalSavings: s.totalSavings,
                rollover: s.rollover ?? 0,
                endBalance: s.endBalance ?? 0,
                calculatedAt: s.calculatedAt ? new Date(s.calculatedAt) : undefined,
              },
            });
          }
        }
      },
      {
        timeout: 30000,
      }
    );

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/insights");
    revalidatePath("/goals");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to import full backup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import backup",
    };
  }
}

/**
 * Bulk create transactions from mapped CSV rows.
 */
export async function importTransactionsFromCSV(rows: CSVTransactionRow[]) {
  try {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: "No transactions to import" };
    }

    const validRows: Array<{
      date: Date;
      merchant: string;
      amount: number;
      type: string;
      categoryId: string | null;
      note: string | null;
      essential: boolean;
    }> = [];

    for (const row of rows) {
      const parsedDate = new Date(row.date);
      if (isNaN(parsedDate.getTime())) {
        continue; // Skip invalid date row
      }

      const rawAmount = Number(row.amount);
      if (isNaN(rawAmount) || rawAmount === 0) {
        continue; // Skip invalid amount row
      }

      const merchant = String(row.merchant || "").trim() || "Unknown";
      const type = row.type && ["expense", "income", "transfer"].includes(row.type)
        ? row.type
        : "expense";

      validRows.push({
        date: parsedDate,
        merchant,
        amount: Math.abs(rawAmount),
        type,
        categoryId: row.categoryId || null,
        note: row.note ? String(row.note).trim() : null,
        essential: Boolean(row.essential),
      });
    }

    if (validRows.length === 0) {
      return { success: false, error: "No valid transaction rows found in data" };
    }

    // Insert transactions
    await db.transaction.createMany({
      data: validRows,
    });

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/insights");

    return { success: true, count: validRows.length };
  } catch (error) {
    console.error("Failed to import transactions from CSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import transactions from CSV",
    };
  }
}

export async function clearAllData() {
  try {
    await db.$transaction([
      db.savingsContribution.deleteMany(),
      db.savingsGoal.deleteMany(),
      db.transaction.deleteMany(),
      db.category.deleteMany(),
      db.monthlyOverride.deleteMany(),
      db.dayMetadata.deleteMany(),
      db.monthlySnapshot.deleteMany(),
      db.savingsAllocation.deleteMany(),
      db.fixedExpense.deleteMany(),
      db.incomeSource.deleteMany(),
      db.userSettings.deleteMany(),
    ]);

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear all data:", error);
    return { success: false, error: "Failed to clear all data" };
  }
}

export async function resetToDemoData() {
  try {
    // This is basically clearing data then relying on seed to run later or just clearing.
    // Given seed requires executing a script, we'll just clear data for now.
    return clearAllData();
  } catch (error) {
    console.error("Failed to reset to demo data:", error);
    return { success: false, error: "Failed to reset to demo data" };
  }
}
