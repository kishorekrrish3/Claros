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
  Search,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMonth } from "@/lib/constants";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Insights", href: "/insights", icon: BarChart3 },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function TopNav() {
  const pathname = usePathname();
  const [currentMonthText, setCurrentMonthText] = React.useState<string>("");

  React.useEffect(() => {
    setCurrentMonthText(formatMonth(new Date()));
  }, []);

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 hidden h-14 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm md:flex">
      <div className="content-width flex h-full w-full items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            Claros
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-14 items-center gap-1.5 border-b-2 px-3 text-sm transition-colors duration-150",
                    active
                      ? "border-primary font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Current Month Display */}
          {currentMonthText && (
            <span className="text-xs font-medium text-muted-foreground tabular-nums px-1">
              {currentMonthText}
            </span>
          )}

          {/* Command Palette Trigger Button (⌘K) */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              );
            }}
            className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:border-border hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Search or open command palette"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden lg:inline">Search...</span>
            <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </kbd>
          </button>

          {/* Settings Gear Icon */}
          <Link
            href="/settings"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isLinkActive("/settings") && "text-foreground bg-muted/40"
            )}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
