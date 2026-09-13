"use client";

import { formatCurrency, CurrencyCode } from "@/lib/constants";
import Link from "next/link";
import { CategorySpending } from "@/lib/finance/types";
import { ArrowUpRight } from "lucide-react";

interface CategorySummaryProps {
  categories: CategorySpending[];
  currency: CurrencyCode;
  limit?: number;
}

export function CategorySummary({ categories, currency, limit = 5 }: CategorySummaryProps) {
  const displayCategories = categories.slice(0, limit);
  const maxAmount = Math.max(...categories.map(c => c.amount), 1); // fallback to 1 to avoid /0
  
  if (categories.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-4">Top categories</h3>
        <p className="text-sm text-muted-foreground">No spending yet this month.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-4">Top categories</h3>
      
      <div className="space-y-3">
        {displayCategories.map((category) => {
          const widthPercent = (category.amount / maxAmount) * 100;
          
          return (
            <div key={category.categoryId} className="relative flex items-center justify-between py-1 group">
              {/* Background bar */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-secondary/50 rounded-r-sm -z-10 transition-all duration-300"
                style={{ width: `${widthPercent}%` }}
              />
              
              <div className="flex items-center gap-2 pl-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: category.categoryColor || '#e2e8f0' }}
                />
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {category.categoryName}
                </span>
              </div>
              
              <span className="text-sm tabular-nums font-medium pr-2">
                {formatCurrency(category.amount, currency)}
              </span>
            </div>
          );
        })}
      </div>
      
      {categories.length > limit && (
        <div className="mt-4">
          <Link href="/budget" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 w-fit">
            View all {categories.length} categories <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
