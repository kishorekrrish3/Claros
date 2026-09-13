"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mobileTabs: TabItem[] = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Insights", href: "/insights", icon: BarChart3 },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 h-16 border-t border-border/50 bg-background/95 backdrop-blur-sm pb-safe md:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="grid h-full grid-cols-5 items-center">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors duration-150",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
