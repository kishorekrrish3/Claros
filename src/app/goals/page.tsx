import { getGoals } from "@/actions/goals";
import { getUserSettings } from "@/actions/budget";
import { GoalsContent } from "@/components/goals/goals-content";
import { calculateGoalProjection } from "@/lib/finance/calculations";
import { GoalProjection } from "@/lib/finance/types";
import { CurrencyCode } from "@/lib/constants";

export default async function GoalsPage() {
  const [goals, settings] = await Promise.all([
    getGoals(),
    getUserSettings(),
  ]);

  const currency = (settings?.currency as CurrencyCode) || "INR";

  const goalProjections: GoalProjection[] = goals.map((goal) =>
    calculateGoalProjection(goal)
  );

  return (
    <GoalsContent
      goals={goals}
      projections={goalProjections}
      currency={currency}
      monthlySpending={settings?.monthlyBudget || 0}
    />
  );
}
