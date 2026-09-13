"use client";

import { formatCurrency, CurrencyCode } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { GoalProjection } from "@/lib/finance/types";
import { ArrowUpRight } from "lucide-react";

interface GoalPreviewProps {
  goals: GoalProjection[];
  currency: CurrencyCode;
  limit?: number;
}

export function GoalPreview({ goals, currency, limit = 3 }: GoalPreviewProps) {
  const displayGoals = goals.slice(0, limit);

  if (goals.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-4">Goals</h3>
        <p className="text-sm text-muted-foreground mb-2">No active goals.</p>
        <Link href="/goals" className="text-xs text-primary hover:underline flex items-center gap-1 w-fit">
          Create a goal <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-4">Goals</h3>
      
      <div className="space-y-5">
        {displayGoals.map((goal) => {
          const isCompleted = goal.progressPercent >= 100;
          
          return (
            <div key={goal.goalId} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isCompleted ? "bg-primary" : goal.onTrack ? "bg-positive" : "bg-warning"
                    )}
                  />
                  <span className="text-sm font-medium truncate">{goal.goalName}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), currency)} left
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-foreground rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums w-8 text-right">
                  {Math.round(goal.progressPercent)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {goals.length > limit && (
        <div className="mt-6">
          <Link href="/goals" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 w-fit">
            View all {goals.length} goals <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
