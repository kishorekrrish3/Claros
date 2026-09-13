"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/constants";
import { format, parseISO } from "date-fns";

interface SpendingTrendChartProps {
  monthlyTotals: any[];
  currency: string;
}

export default function SpendingTrendChart({ monthlyTotals, currency }: SpendingTrendChartProps) {
  if (!monthlyTotals || monthlyTotals.length < 2) {
    return <div className="h-[250px] flex items-center justify-center text-muted-foreground">Not enough data to show trend</div>;
  }

  // Format month labels
  const data = monthlyTotals.map(item => ({
    ...item,
    formattedMonth: format(new Date(`${item.month}-01T00:00:00`), "MMM")
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="formattedMonth" 
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
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border border-border/50 rounded-md p-3 shadow-sm text-sm">
                    <div className="font-medium mb-1">{format(new Date(`${data.month}-01T00:00:00`), "MMMM yyyy")}</div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Total Spent:</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(data.total, currency)}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
            activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
