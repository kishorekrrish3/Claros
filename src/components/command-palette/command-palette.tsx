"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Settings, 
  PieChart, 
  Target, 
  LayoutDashboard,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Database
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onQuickAdd: () => void;
}

export function CommandPalette({ open, setOpen, onQuickAdd }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
            <CommandShortcut>t</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/insights"))}>
            <PieChart className="mr-2 h-4 w-4" />
            <span>Insights</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/goals"))}>
            <Target className="mr-2 h-4 w-4" />
            <span>Goals</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => onQuickAdd())}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Add transaction</span>
            <CommandShortcut>n</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Data">
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Download className="mr-2 h-4 w-4" />
            <span>Export CSV</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Database className="mr-2 h-4 w-4" />
            <span>Backup data</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
