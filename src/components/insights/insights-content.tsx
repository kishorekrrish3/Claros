"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthNavigator } from "@/components/overview/month-navigator";
import InsightsSummary from "./insights-summary";
import EssentialSplit from "./essential-split";
import WeekdayChart from "./weekday-chart";
import AdvancedInsights from "./advanced-insights";

const DailySpendingChart = dynamic(() => import("./daily-spending-chart"), { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> });
const CategoryPieChart = dynamic(() => import("./category-pie-chart"), { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> });
const SpendingTrendChart = dynamic(() => import("./spending-trend-chart"), { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> });

interface InsightsContentProps {
  month: string;
  currency: string;
  summary: any;
  categorySpending: any[];
  dailyPace: any[];
  monthComparison: any;
  weekdayData: any[];
  moneyLeaks: any[];
  savingsRate: number;
  essential: number;
  nonEssential: number;
  monthlyTotals: any[];
  budgetRunoutDay: string | null;
}

export default function InsightsContent({
  month,
  currency,
  summary,
  categorySpending,
  dailyPace,
  monthComparison,
  weekdayData,
  moneyLeaks,
  savingsRate,
  essential,
  nonEssential,
  monthlyTotals,
  budgetRunoutDay
}: InsightsContentProps) {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <MonthNavigator currentMonth={month} />
      </div>

      <InsightsSummary summary={summary} savingsRate={savingsRate} currency={currency} />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Daily Pace</h3>
        <DailySpendingChart dailyPaceData={dailyPace} currency={currency} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border/50">
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Top Categories</h3>
          <CategoryPieChart categories={categorySpending} currency={currency} />
        </div>
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Needs vs Wants</h3>
          <EssentialSplit essential={essential} nonEssential={nonEssential} currency={currency} />
          
          <div className="pt-6">
            <h3 className="text-lg font-medium mb-4">Typical Week</h3>
            <WeekdayChart weekdayData={weekdayData} currency={currency} />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-8 border-t border-border/50">
        <h3 className="text-lg font-medium">6-Month Trend</h3>
        <SpendingTrendChart monthlyTotals={monthlyTotals} currency={currency} />
      </div>

      <div className="pt-8 border-t border-border/50">
        <AdvancedInsights 
          moneyLeaks={moneyLeaks}
          monthComparison={monthComparison}
          weekdayData={weekdayData}
          budgetRunoutDay={budgetRunoutDay}
          currency={currency}
        />
      </div>
    </div>
  );
}
