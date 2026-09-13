"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";

interface DailySpendingChartProps {
  dailyPaceData: any[];
  currency: string;
}

export default function DailySpendingChart({ dailyPaceData, currency }: DailySpendingChartProps) {
  if (!dailyPaceData || dailyPaceData.length === 0) {
    return <div className="h-[220px] flex items-center justify-center text-muted-foreground">Not enough data</div>;
  }

  const avgPace = dailyPaceData.reduce((acc, curr) => acc + curr.amount, 0) / dailyPaceData.length;
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dailyPaceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => {
              const d = new Date(val).getDate();
              return [1, 5, 10, 15, 20, 25, 30].includes(d) ? d.toString() : "";
            }}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            dy={10}
          />
          <YAxis 
            tickFormatter={(val) => formatCurrency(val, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip 
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border border-border/50 rounded-md p-3 shadow-sm text-sm">
                    <div className="font-medium mb-1">{format(new Date(data.date), "MMM d, yyyy")}</div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Spent:</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(data.amount, currency)}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={avgPace} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {dailyPaceData.map((entry, index) => {
              const isToday = entry.date === today;
              const isHigh = entry.amount > avgPace * 1.5;
              
              let fill = "hsl(var(--primary) / 0.7)";
              if (isToday) fill = "hsl(var(--primary))";
              else if (isHigh) fill = "hsl(var(--destructive) / 0.6)";
              
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
