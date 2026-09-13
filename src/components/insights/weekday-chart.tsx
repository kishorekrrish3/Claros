import { formatCurrency } from "@/lib/constants";

interface WeekdayChartProps {
  weekdayData: any[];
  currency: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeekdayChart({ weekdayData, currency }: WeekdayChartProps) {
  if (!weekdayData || weekdayData.length === 0) {
    return <div className="text-sm text-muted-foreground">No data available</div>;
  }

  const maxAmount = Math.max(...weekdayData.map(d => d.average));
  
  // Sort data to match Mon-Sun
  const sortedData = DAYS.map(day => {
    const found = weekdayData.find(d => d.day === day);
    return {
      day,
      average: found ? found.average : 0,
      isWeekend: day === "Sat" || day === "Sun"
    };
  });

  return (
    <div className="flex items-end justify-between h-[120px] gap-2">
      {sortedData.map((data, index) => {
        const height = maxAmount > 0 ? Math.max((data.average / maxAmount) * 100, 4) : 4;
        const isHighest = data.average === maxAmount && maxAmount > 0;
        
        return (
          <div key={data.day} className="flex flex-col items-center gap-2 flex-1 group">
            <div 
              className={`w-full rounded-t-sm transition-all duration-300 relative ${
                isHighest ? "bg-primary" : data.isWeekend ? "bg-muted-foreground/30" : "bg-primary/40"
              }`}
              style={{ height: `${height}%` }}
              title={`${data.day}: ${formatCurrency(data.average, currency)} avg`}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-popover border text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                {formatCurrency(data.average, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className={`text-[10px] uppercase font-medium tracking-wider ${isHighest ? "text-foreground" : "text-muted-foreground"}`}>
              {data.day}
            </div>
          </div>
        );
      })}
    </div>
  );
}
