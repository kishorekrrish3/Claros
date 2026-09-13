import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().positive("Target must be positive"),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.coerce.date().nullable().optional(),
  monthlyContribution: z.number().min(0).default(0),
  status: z.enum(["active", "paused", "completed"]).default("active"),
  color: z.string().default("#6366f1"),
  notes: z.string().max(500).nullable().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const addContributionSchema = z.object({
  goalId: z.string(),
  amount: z.number().positive("Amount must be positive"),
  date: z.coerce.date().optional(),
  note: z.string().max(500).nullable().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type AddContributionInput = z.infer<typeof addContributionSchema>;
