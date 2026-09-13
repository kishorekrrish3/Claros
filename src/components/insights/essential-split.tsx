import { formatCurrency } from "@/lib/constants";

interface EssentialSplitProps {
  essential: number;
  nonEssential: number;
  currency: string;
}

export default function EssentialSplit({ essential, nonEssential, currency }: EssentialSplitProps) {
  const total = essential + nonEssential;
  
  if (total === 0) {
    return <div className="text-sm text-muted-foreground">No data available</div>;
  }

  const essentialPct = (essential / total) * 100;
  const nonEssentialPct = (nonEssential / total) * 100;

  return (
    <div className="space-y-4">
      <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted">
        <div 
          className="bg-primary h-full transition-all duration-500" 
          style={{ width: `${essentialPct}%` }}
        />
        <div 
          className="bg-primary/20 h-full transition-all duration-500" 
          style={{ width: `${nonEssentialPct}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground font-medium">Needs</span>
          </div>
          <div className="font-semibold tabular-nums">
            {formatCurrency(essential, currency)} ({essentialPct.toFixed(0)}%)
          </div>
        </div>
        
        <div className="space-y-1 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary/20" />
            <span className="text-muted-foreground font-medium">Wants</span>
          </div>
          <div className="font-semibold tabular-nums">
            {formatCurrency(nonEssential, currency)} ({nonEssentialPct.toFixed(0)}%)
          </div>
        </div>
      </div>
    </div>
  );
}
