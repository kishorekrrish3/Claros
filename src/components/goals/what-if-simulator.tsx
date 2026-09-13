"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Slider } from "@/components/ui/slider";
import { SavingsGoal } from "@prisma/client";
import { GoalProjection } from "@/lib/finance/types";
import { calculateWhatIf } from "@/lib/finance/calculations";
import { Badge } from "@/components/ui/badge";

interface WhatIfSimulatorProps {
  goals: SavingsGoal[];
  projections: GoalProjection[];
  currentMonthlySpending: number;
}

export function WhatIfSimulator({
  goals,
  projections,
  currentMonthlySpending,
}: WhatIfSimulatorProps) {
  const [reduction, setReduction] = useState<number[]>([0]);

  const savingsAmount = reduction[0];
  const whatIfResult = calculateWhatIf({
    currentMonthlySpending,
    proposedMonthlySpending: Math.max(currentMonthlySpending - savingsAmount, 0),
    monthlyIncome: currentMonthlySpending,
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      monthlyContribution: g.monthlyContribution,
    })),
  });

  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card/50">
      <h3 className="text-xl font-medium tracking-tight mb-6">
        What if I spend less?
      </h3>
      
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              Reduce monthly spending by:
            </label>
            <span className="text-lg font-semibold tabular-nums text-primary">
              ₹{savingsAmount.toLocaleString()}
            </span>
          </div>
          <Slider
            defaultValue={[0]}
            max={Math.min(currentMonthlySpending, 50000)}
            step={500}
            onValueChange={setReduction}
            className="w-full"
          />
        </div>

        {savingsAmount > 0 && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium text-muted-foreground">
              Impact on your goals:
            </h4>
            <div className="space-y-3">
              {goals.map((goal, i) => {
                const orig = projections[i];
                const updated = whatIfResult.goals[i];
                const monthsSaved = updated?.monthsSaved ?? 0;

                return (
                  <div key={goal.id} className="flex justify-between items-center text-sm bg-background p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: goal.color || "var(--primary)" }}
                      />
                      <span className="font-medium">{goal.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                        {orig?.projectedCompletionDate
                          ? format(orig.projectedCompletionDate, "MMM yyyy")
                          : "Never"}
                      </span>
                      <span className="font-medium text-foreground">
                        {updated?.newDate
                          ? format(updated.newDate, "MMM yyyy")
                          : "Never"}
                      </span>
                      {monthsSaved > 0 && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-200">
                          {monthsSaved} mo saved
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
