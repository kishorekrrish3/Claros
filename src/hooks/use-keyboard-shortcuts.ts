"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";

export function useKeyboardShortcuts() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K -> Command Palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 't' -> navigate to today (calendar)
      if (e.key === "t" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push("/calendar");
        return;
      }

      // 'n' -> quick add
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setQuickAddOpen(true);
        return;
      }

      // Escape -> close dialogs
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setQuickAddOpen(false);
        return;
      }

      // Arrow navigation for months
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const currentMonthParam = searchParams.get("month");
        const baseDate = currentMonthParam ? new Date(currentMonthParam + "-01") : new Date();
        
        let newDate;
        if (e.key === "ArrowLeft") {
          newDate = subMonths(baseDate, 1);
        } else {
          newDate = addMonths(baseDate, 1);
        }
        
        const monthStr = format(newDate, "yyyy-MM");
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", monthStr);
        router.push(`?${params.toString()}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, searchParams]);

  return {
    commandPaletteOpen,
    setCommandPaletteOpen,
    quickAddOpen,
    setQuickAddOpen
  };
}
