"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Plus,
  BarChart3,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/native/platform";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleTabClick = (href: string) => {
    triggerHaptic("selection");
  };

  const handleLogClick = () => {
    triggerHaptic("medium");
    if (pathname === "/") {
      // Scroll to the Quick Logger bar smoothly
      const input = document.querySelector('input[placeholder="0.00"]') as HTMLElement;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    // Otherwise open home page with add action
    router.push("/?action=quick-add");
  };

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md pb-safe md:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {/* Tab 1: Overview */}
        <Link
          href="/"
          onClick={() => handleTabClick("/")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors duration-150 min-h-[48px]",
            isTabActive("/") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          aria-current={isTabActive("/") ? "page" : undefined}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          <span className="truncate">Overview</span>
        </Link>

        {/* Tab 2: Calendar */}
        <Link
          href="/calendar"
          onClick={() => handleTabClick("/calendar")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors duration-150 min-h-[48px]",
            isTabActive("/calendar") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          aria-current={isTabActive("/calendar") ? "page" : undefined}
        >
          <Calendar className="h-5 w-5 shrink-0" />
          <span className="truncate">Calendar</span>
        </Link>

        {/* Center Prominent Quick Add Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleLogClick}
            aria-label="Quick Add Entry"
            className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Insights */}
        <Link
          href="/insights"
          onClick={() => handleTabClick("/insights")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors duration-150 min-h-[48px]",
            isTabActive("/insights") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          aria-current={isTabActive("/insights") ? "page" : undefined}
        >
          <BarChart3 className="h-5 w-5 shrink-0" />
          <span className="truncate">Insights</span>
        </Link>

        {/* Tab 4: Settings */}
        <Link
          href="/settings"
          onClick={() => handleTabClick("/settings")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors duration-150 min-h-[48px]",
            isTabActive("/settings") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          aria-current={isTabActive("/settings") ? "page" : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
