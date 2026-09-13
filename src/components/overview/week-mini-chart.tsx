"use client";

import { formatCurrency, CurrencyCode } from "@/lib/constants";

export interface DailySpending {
  date: string;
  amount: number;
  dayName: string; // 'M', 'T', 'W', etc.
}

interface WeekMiniChartProps {
  dailyData: DailySpending[];
  dailyPace: number;
  currency: CurrencyCode;
}

export function WeekMiniChart({ dailyData, dailyPace, currency }: WeekMiniChartProps) {
  const maxAmount = Math.max(
    ...dailyData.map(d => d.amount),
    dailyPace * 1.5 // Ensure the pace line is visible even if spending is low
  );

  return (
    <div className="flex flex-col h-full justify-between">
      <h3 className="text-sm font-medium mb-6">This week</h3>
      
      <div className="relative h-24 flex items-end justify-between gap-1 mt-auto">
        {/* Pace line */}
        {maxAmount > 0 && (
          <div 
            className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/40 z-0 pointer-events-none"
            style={{ 
              bottom: `${(dailyPace / maxAmount) * 100}%`,
            }}
            title={`Daily budget: ${formatCurrency(dailyPace, currency)}`}
          />
        )}
        
        {dailyData.map((day, i) => {
          const heightPercent = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
          
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-2 z-10 group relative">
              <div className="w-full max-w-[24px] h-full flex items-end">
                <div 
                  className="w-full bg-primary/20 group-hover:bg-primary/40 rounded-t-sm transition-colors"
                  style={{ height: `${heightPercent}%`, minHeight: day.amount > 0 ? '4px' : '0' }}
                />
              </div>
              
              <span className="text-xs text-muted-foreground font-medium">
                {day.dayName}
              </span>
              
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                {formatCurrency(day.amount, currency)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
