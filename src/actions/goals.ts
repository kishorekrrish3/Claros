"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  createGoalSchema,
  updateGoalSchema,
  addContributionSchema,
  type CreateGoalInput,
  type UpdateGoalInput,
  type AddContributionInput,
} from "@/lib/validators/goals";

/**
 * All goals with contributions count and sum. Order by createdAt ASC.
 */
export async function getGoals() {
  try {
    const goals = await db.savingsGoal.findMany({
      include: {
        contributions: {
          select: { amount: true },
        },
        _count: {
          select: { contributions: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return goals.map((goal) => {
      const contributionsSum = goal.contributions.reduce(
        (sum, c) => sum + c.amount,
        0
      );
      const contributionsCount = goal._count.contributions;
      const { contributions, _count, ...rest } = goal;

      return {
        ...rest,
        contributionsSum,
        contributionsCount,
      };
    });
  } catch (error) {
    console.error("Failed to get goals:", error);
    return [];
  }
}

/**
 * Single goal with all contributions, ordered by date DESC.
 */
export async function getGoal(id: string) {
  try {
    const goal = await db.savingsGoal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
        _count: {
          select: { contributions: true },
        },
      },
    });

    if (!goal) return null;

    const contributionsSum = goal.contributions.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    return {
      ...goal,
      contributionsSum,
      contributionsCount: goal._count.contributions,
    };
  } catch (error) {
    console.error("Failed to get goal:", error);
    return null;
  }
}

/**
 * Validate and create goal.
 */
export async function createGoal(input: CreateGoalInput) {
  try {
    const validated = createGoalSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const goal = await db.savingsGoal.create({
      data: validated.data,
    });

    revalidatePath("/goals");
    revalidatePath("/");

    return { success: true, data: goal };
  } catch (error) {
    console.error("Failed to create goal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create goal",
    };
  }
}

/**
 * Validate and update goal.
 */
export async function updateGoal(id: string, input: UpdateGoalInput) {
  try {
    const validated = updateGoalSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const goal = await db.savingsGoal.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath("/goals");
    revalidatePath("/");

    return { success: true, data: goal };
  } catch (error) {
    console.error("Failed to update goal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update goal",
    };
  }
}

/**
 * Delete goal by ID (cascade deletes contributions).
 */
export async function deleteGoal(id: string) {
  try {
    await db.savingsGoal.delete({
      where: { id },
    });

    revalidatePath("/goals");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete goal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete goal",
    };
  }
}

/**
 * Validate, create contribution, and update goal's currentAmount.
 */
export async function addContribution(input: AddContributionInput) {
  try {
    const validated = addContributionSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors.map((e) => e.message).join(", "),
      };
    }

    const { goalId, amount, date, note } = validated.data;

    const result = await db.$transaction(async (tx) => {
      const contribution = await tx.savingsContribution.create({
        data: {
          goalId,
          amount,
          date,
          note,
        },
      });

      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: { increment: amount },
        },
      });

      return { contribution, goal: updatedGoal };
    });

    revalidatePath("/goals");
    revalidatePath("/");

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to add contribution:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add contribution",
    };
  }
}

/**
 * All contributions for a goal, ordered by date DESC.
 */
export async function getContributions(goalId: string) {
  try {
    return await db.savingsContribution.findMany({
      where: { goalId },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error("Failed to get contributions:", error);
    return [];
  }
}
