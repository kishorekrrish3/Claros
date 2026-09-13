"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalCard } from "./goal-card";
import { GoalFormDialog } from "./goal-form-dialog";
import { WhatIfSimulator } from "./what-if-simulator";
import { GoalProjection } from "@/lib/finance/types";
import { SavingsGoal } from "@prisma/client";
import { CurrencyCode } from "@/lib/constants";

interface GoalsContentProps {
  goals: SavingsGoal[];
  projections: GoalProjection[];
  currency: CurrencyCode;
  monthlySpending: number;
}

export function GoalsContent({
  goals,
  projections,
  currency,
  monthlySpending,
}: GoalsContentProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>();

  const handleAddClick = () => {
    setEditingGoal(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-display-lg font-semibold tracking-tight text-foreground">
          Savings Goals
        </h1>
        <Button onClick={handleAddClick} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="border border-border/50 rounded-xl p-12 text-center flex flex-col items-center justify-center bg-card shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            Set your first savings goal
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Track your progress towards big purchases, emergency funds, or vacations.
          </p>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add your first goal
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              projection={projections[index]}
              currency={currency}
              onEdit={() => handleEditClick(goal)}
            />
          ))}
        </div>
      )}

      {goals.length > 0 && monthlySpending > 0 && (
        <WhatIfSimulator
          goals={goals}
          projections={projections}
          currentMonthlySpending={monthlySpending}
        />
      )}

      <GoalFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        goal={editingGoal}
      />
    </div>
  );
}
