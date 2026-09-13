"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/constants";

interface CategoryPieChartProps {
  categories: any[];
  currency: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.8)",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--primary) / 0.4)",
  "hsl(var(--secondary))",
  "hsl(var(--muted-foreground) / 0.8)",
  "hsl(var(--muted-foreground) / 0.5)",
  "hsl(var(--muted-foreground) / 0.3)",
];

export default function CategoryPieChart({ categories, currency }: CategoryPieChartProps) {
  if (!categories || categories.length === 0) {
    return <div className="h-[250px] flex items-center justify-center text-muted-foreground">Not enough data</div>;
  }

  // Take top 7 and group the rest into "Other"
  let displayData = [...categories].sort((a, b) => b.amount - a.amount);
  if (displayData.length > 8) {
    const top7 = displayData.slice(0, 7);
    const others = displayData.slice(7).reduce((acc, curr) => acc + curr.amount, 0);
    displayData = [...top7, { name: "Other", amount: others }];
  }

  const total = displayData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="h-[250px] w-[250px] shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={100}
              paddingAngle={2}
              dataKey="amount"
              stroke="none"
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatCurrency(value, currency)}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatCurrency(total, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        {displayData.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="truncate max-w-[120px]" title={item.name}>{item.name}</span>
            </div>
            <div className="flex gap-3 tabular-nums">
              <span className="text-muted-foreground">{((item.amount / total) * 100).toFixed(1)}%</span>
              <span className="font-medium w-[70px] text-right">{formatCurrency(item.amount, currency)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
