"use client";

import { CurrencyCode } from "@/lib/constants";
import { MonthNavigator } from "./month-navigator";
import { SafeToSpendHero } from "./safe-to-spend-hero";
import { QuickEntryBar } from "./quick-entry-bar";
import { MetricGrid } from "./metric-grid";
import { BudgetPace } from "./budget-pace";
import { WeekMiniChart, DailySpending } from "./week-mini-chart";
import { CategorySummary } from "./category-summary";
import { RecentTransactions, Transaction } from "./recent-transactions";
import { GoalPreview } from "./goal-preview";
import { CategorySpending, GoalProjection } from "@/lib/finance/types";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

interface OverviewContentProps {
  currentMonth: string;
  currency: CurrencyCode;
  categories?: Category[];
  
  // Calculated metrics
  safeToSpendAmount: number;
  safeToSpendRemaining: number;
  safeToSpendExplanation: string;
  safeToSpendStatus: "healthy" | "caution" | "over";
  
  budgetRemaining: number;
  spentToday: number;
  daysRemaining: number;
  daysInMonth: number;
  dailyPace: number;
  projectedMonthEnd: number;
  budgetUsagePercent: number;
  budgetStatus: "healthy" | "caution" | "over";
  
  dailyData: DailySpending[];
  categorySpending: CategorySpending[];
  recentTransactions: Transaction[];
  goals: GoalProjection[];
}

export function OverviewContent({
  currentMonth,
  currency,
  categories = [],
  safeToSpendAmount,
  safeToSpendRemaining,
  safeToSpendExplanation,
  safeToSpendStatus,
  budgetRemaining,
  spentToday,
  daysRemaining,
  daysInMonth,
  dailyPace,
  projectedMonthEnd,
  budgetUsagePercent,
  budgetStatus,
  dailyData,
  categorySpending,
  recentTransactions,
  goals
}: OverviewContentProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pb-24">
      <MonthNavigator currentMonth={currentMonth} />
      
      <main className="flex flex-col animate-fade-in">
        <SafeToSpendHero 
          amount={safeToSpendAmount}
          remaining={safeToSpendRemaining}
          explanation={safeToSpendExplanation}
          status={safeToSpendStatus}
          currency={currency}
        />

        <QuickEntryBar 
          categories={categories}
          currency={currency}
        />
        
        <MetricGrid 
          remaining={budgetRemaining}
          spentToday={spentToday}
          daysRemaining={daysRemaining}
          dailyPace={dailyPace}
          projectedMonthEnd={projectedMonthEnd}
          budgetUsagePercent={budgetUsagePercent}
          currency={currency}
        />
        
        <BudgetPace 
          budgetUsagePercent={budgetUsagePercent}
          status={budgetStatus}
          projectedMonthEnd={projectedMonthEnd}
          daysRemaining={daysRemaining}
          daysInMonth={daysInMonth}
          currency={currency}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 py-8 border-t border-border/30">
          <WeekMiniChart 
            dailyData={dailyData}
            dailyPace={dailyPace}
            currency={currency}
          />
          
          <CategorySummary 
            categories={categorySpending}
            currency={currency}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 py-8 border-t border-border/30">
          <RecentTransactions 
            transactions={recentTransactions}
            currency={currency}
          />
          
          <GoalPreview 
            goals={goals}
            currency={currency}
          />
        </div>
      </main>
    </div>
  );
}



