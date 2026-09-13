"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavingsGoal } from "@prisma/client";
import { GoalProjection } from "@/lib/finance/types";
import { formatCurrency, CurrencyCode } from "@/lib/constants";
import { addContribution } from "@/actions/goals";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: SavingsGoal;
  projection: GoalProjection;
  currency: CurrencyCode;
  onEdit: () => void;
}

export function GoalCard({ goal, projection, currency, onEdit }: GoalCardProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

  const handleAddContribution = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await addContribution({ goalId: goal.id, amount: numAmount, note });
      toast.success("Contribution added");
      setAmount("");
      setNote("");
      setIsPopoverOpen(false);
    } catch (error) {
      toast.error("Failed to add contribution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColor = projection?.onTrack ? "bg-emerald-500" : (projection?.monthsRemaining ?? 0) > 24 ? "bg-red-500" : "bg-amber-500";

  return (
    <div className="border border-border/50 rounded-xl p-5 bg-card flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: goal.color || "var(--primary)" }}
              />
              <h3 className="text-lg font-medium tracking-tight text-foreground">
                {goal.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={cn("w-2 h-2 rounded-full", statusColor)} />
              <span>
                {projection?.onTrack
                  ? "On track"
                  : "Behind schedule"}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-sm">
            <span className="font-medium tabular-nums">
              {formatCurrency(goal.currentAmount, currency)}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatCurrency(goal.targetAmount, currency)}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-right text-xs text-muted-foreground font-medium">
            {percentage.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-muted-foreground mb-1">Monthly</p>
            <p className="font-medium tabular-nums">
              {formatCurrency(goal.monthlyContribution, currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Completion</p>
            <p className="font-medium">
              {projection.projectedCompletionDate
                ? format(projection.projectedCompletionDate, "MMM yyyy")
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add contribution
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Add Contribution</h4>
              <p className="text-xs text-muted-foreground">
                Add funds directly to this goal.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="E.g., Bonus"
              />
            </div>
            <Button
              className="w-full"
              disabled={isSubmitting || !amount}
              onClick={handleAddContribution}
            >
              {isSubmitting ? "Saving..." : "Save contribution"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
