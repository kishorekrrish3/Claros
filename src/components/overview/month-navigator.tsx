"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { format, addMonths, subMonths, parse } from "date-fns";

interface MonthNavigatorProps {
  currentMonth: string; // YYYY-MM
}

export function MonthNavigator({ currentMonth }: MonthNavigatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePrevious = () => {
    const date = parse(currentMonth, "yyyy-MM", new Date());
    const prev = format(subMonths(date, 1), "yyyy-MM");
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", prev);
    router.push(`/?${params.toString()}`);
  };

  const handleNext = () => {
    const date = parse(currentMonth, "yyyy-MM", new Date());
    const next = format(addMonths(date, 1), "yyyy-MM");
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", next);
    router.push(`/?${params.toString()}`);
  };

  const handleToday = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(new Date(), "yyyy-MM"));
    router.push(`/?${params.toString()}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
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
  }, [currentMonth, searchParams, router]);

  const displayDate = parse(currentMonth, "yyyy-MM", new Date());
  
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
