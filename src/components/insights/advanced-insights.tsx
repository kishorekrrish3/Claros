"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/constants";
import { AlertCircleIcon, TrendingUpIcon, CalendarIcon, LightbulbIcon } from "lucide-react";

interface AdvancedInsightsProps {
  moneyLeaks: any[];
  monthComparison: any;
  weekdayData: any[];
  budgetRunoutDay: string | null;
  currency: string;
}

export default function AdvancedInsights({
  moneyLeaks,
  monthComparison,
  weekdayData,
  budgetRunoutDay,
  currency
}: AdvancedInsightsProps) {
  
  const highestSpendDay = weekdayData?.reduce((max, curr) => curr.average > max.average ? curr : max, weekdayData[0]);
  
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="advanced-insights" className="border-none">
        <AccordionTrigger className="text-lg font-medium hover:no-underline py-4">
          Advanced Insights
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-6 space-y-8">
          
          {/* AI-like Summary */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
            <h4 className="flex items-center gap-2 font-medium mb-2">
              <LightbulbIcon className="h-4 w-4 text-primary" />
              What Changed
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {monthComparison?.totalDiff > 0 
                ? `You spent ${formatCurrency(monthComparison.totalDiff, currency)} more than last month. `
                : `Great job! You spent ${formatCurrency(Math.abs(monthComparison?.totalDiff || 0), currency)} less than last month. `}
              {highestSpendDay && `Your most expensive day is typically ${highestSpendDay.day} at ${formatCurrency(highestSpendDay.average, currency)} on average. `}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Money Leaks */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-medium">
                <AlertCircleIcon className="h-4 w-4 text-destructive" />
                Potential Money Leaks
              </h4>
              {moneyLeaks?.length > 0 ? (
                <div className="space-y-3">
                  {moneyLeaks.map((leak, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <div className="font-medium">{leak.merchant}</div>
                        <div className="text-muted-foreground text-xs">{leak.count} transactions</div>
                      </div>
                      <div className="font-semibold tabular-nums text-right">
                        {formatCurrency(leak.totalAmount, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recurring small expenses found.</p>
              )}
            </div>

            {/* Biggest Changes */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-medium">
                <TrendingUpIcon className="h-4 w-4 text-primary" />
                Biggest Changes vs Last Month
              </h4>
              {monthComparison?.categoryChanges?.length > 0 ? (
                <div className="space-y-3">
                  {monthComparison.categoryChanges.slice(0, 4).map((change: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="font-medium">{change.category}</div>
                      <div className={`font-semibold tabular-nums text-right ${change.diff > 0 ? "text-destructive" : "text-positive"}`}>
                        {change.diff > 0 ? "+" : ""}{formatCurrency(change.diff, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not enough data to compare with last month.</p>
              )}
            </div>
            
            {/* Spending Pace */}
            {budgetRunoutDay && (
              <div className="space-y-4 md:col-span-2">
                <h4 className="flex items-center gap-2 font-medium">
                  <CalendarIcon className="h-4 w-4 text-warning" />
                  Budget Projection
                </h4>
                <p className="text-sm text-muted-foreground">
                  Based on your current daily spending pace, you are projected to run out of budget on <strong className="text-foreground">{budgetRunoutDay}</strong>.
                </p>
              </div>
            )}
          </div>

        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
