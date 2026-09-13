import { z } from "zod";

export const createTransactionSchema = z.object({
  date: z.coerce.date(),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["expense", "income", "transfer"]),
  categoryId: z.string().nullable().optional(),
  merchant: z.string().min(1, "Merchant name is required").max(200),
  note: z.string().max(500).optional().nullable(),
  essential: z.boolean().default(false),
  satisfaction: z.enum(["love", "fine", "regret"]).nullable().optional(),
  receiptPath: z.string().nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  type: z.enum(["expense", "income", "transfer"]).optional(),
  categoryId: z.string().optional(),
  essential: z.boolean().optional(),
  satisfaction: z.enum(["love", "fine", "regret"]).optional(),
  search: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
