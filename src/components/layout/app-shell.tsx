"use client";

import * as React from "react";
import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="content-width pb-24 pt-16 md:pb-8 md:pt-20">
        {children}
      </main>
      <MobileNav />
      {/* TODO: CommandPalette and KeyboardShortcuts hook will be mounted here */}
    </div>
  );
}
