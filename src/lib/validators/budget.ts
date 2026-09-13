import { z } from "zod";

// ─── Settings ────────────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  currency: z.enum(["INR", "USD", "EUR", "GBP", "JPY", "CAD"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  monthlyBudget: z.coerce.number().min(0).optional(),
  rolloverEnabled: z.boolean().optional(),
  rolloverAmount: z.coerce.number().min(0).optional(),
  includeTodayInDays: z.boolean().optional(),
  receiptStoragePath: z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ─── Income Sources ──────────────────────────────────────────────────────────

export const createIncomeSourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().default("Salary"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  active: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional(),
});

export const updateIncomeSourceSchema = createIncomeSourceSchema.partial();

export type CreateIncomeSourceInput = z.infer<typeof createIncomeSourceSchema>;
export type UpdateIncomeSourceInput = z.infer<typeof updateIncomeSourceSchema>;

// ─── Fixed Expenses ──────────────────────────────────────────────────────────

export const createFixedExpenseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().default("Bills"),
  dayOfMonth: z.coerce.number().int().min(1).max(31).default(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  active: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional(),
});

export const updateFixedExpenseSchema = createFixedExpenseSchema.partial();

export type CreateFixedExpenseInput = z.infer<typeof createFixedExpenseSchema>;
export type UpdateFixedExpenseInput = z.infer<typeof updateFixedExpenseSchema>;

// ─── Savings Allocations ─────────────────────────────────────────────────────

export const createSavingsAllocationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["fixed", "percentage"]).default("fixed"),
  active: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional(),
});

export const updateSavingsAllocationSchema = createSavingsAllocationSchema.partial();

export type CreateSavingsAllocationInput = z.infer<typeof createSavingsAllocationSchema>;
export type UpdateSavingsAllocationInput = z.infer<typeof updateSavingsAllocationSchema>;

// ─── Monthly Overrides ───────────────────────────────────────────────────────

export const monthlyOverrideSchema = z.object({
  sourceType: z.enum(["income", "fixedExpense", "savingsAllocation"]),
  sourceId: z.string().min(1, "Source ID is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM format"),
  amount: z.coerce.number().min(0, "Amount must be greater than or equal to 0"),
  note: z.string().max(500).nullable().optional(),
});

export type MonthlyOverrideInput = z.infer<typeof monthlyOverrideSchema>;

// ─── Categories ──────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  icon: z.string().nullable().optional(),
  color: z.string().default("#6366f1"),
  type: z.enum(["expense", "income"]).default("expense"),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
