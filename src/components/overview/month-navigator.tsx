"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { format, addMonths, subMonths, parse } from "date-fns";

interface MonthNavigatorProps {
  currentMonth?: string | number;
  currentYear?: number;
  onChange?: (year: number, month: number) => void;
}

export function MonthNavigator({ currentMonth, currentYear, onChange }: MonthNavigatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Safely derive YYYY-MM string
  let monthStr = format(new Date(), "yyyy-MM");
  if (typeof currentMonth === "string" && /^\d{4}-\d{2}$/.test(currentMonth)) {
    monthStr = currentMonth;
  } else if (typeof currentMonth === "number" && typeof currentYear === "number") {
    monthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  } else if (typeof currentMonth === "number") {
    const y = currentYear || new Date().getFullYear();
    monthStr = `${y}-${String(currentMonth).padStart(2, "0")}`;
  }

  const navigateToMonth = (targetMonthStr: string) => {
    if (onChange) {
      const [y, m] = targetMonthStr.split("-").map(Number);
      onChange(y, m);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", targetMonthStr);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handlePrevious = () => {
    const date = parse(monthStr, "yyyy-MM", new Date());
    const prev = format(subMonths(date, 1), "yyyy-MM");
    navigateToMonth(prev);
  };

  const handleNext = () => {
    const date = parse(monthStr, "yyyy-MM", new Date());
    const next = format(addMonths(date, 1), "yyyy-MM");
    navigateToMonth(next);
  };

  const handleToday = () => {
    const todayStr = format(new Date(), "yyyy-MM");
    navigateToMonth(todayStr);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [monthStr, searchParams, router, pathname]);

  const displayDate = parse(monthStr, "yyyy-MM", new Date());
  
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/30 mb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Previous month</span>
        </Button>
        <span className="text-lg font-semibold tracking-tight">
          {format(displayDate, "MMMM yyyy")}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={handleToday}>
        Today
      </Button>
    </div>
  );
}
