"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { UserSettings, Category } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { CategoryManager } from "./category-manager";
import { ImportWizard } from "./import-wizard";
import { PdfReport } from "./pdf-report";
import { Button } from "@/components/ui/button";
import { updateUserSettings } from "@/actions/budget";
import { resetToDemoData, clearAllData } from "@/actions/import-export";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CURRENCIES, CurrencyCode } from "@/lib/constants";

interface SettingsContentProps {
  settings: UserSettings | null;
  categories: Category[];
}

export function SettingsContent({ settings, categories }: SettingsContentProps) {
  const { theme, setTheme } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    setIsUpdating(true);
    try {
      await updateUserSettings({ [key]: value });
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async (type: 'demo' | 'clear') => {
    try {
      if (type === 'demo') {
        await resetToDemoData();
        toast.success("Reset to demo data successfully");
      } else {
        await clearAllData();
        toast.success("All data cleared");
      }
      window.location.reload();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-display-lg font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your app preferences, categories, and data.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="data">Data & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8">
          <div className="space-y-6 max-w-2xl">
            <section className="space-y-4">
              <h3 className="text-lg font-medium">Currency</h3>
              <RadioGroup
                defaultValue={settings?.currency || "INR"}
                onValueChange={(val) => handleSettingChange("currency", val)}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3"
              >
                {Object.values(CURRENCIES).map((curr) => (
                  <div key={curr.code}>
                    <RadioGroupItem
                      value={curr.code}
                      id={curr.code}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={curr.code}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <span className="text-xl font-bold mb-2">{curr.symbol}</span>
                      <span className="text-sm font-medium">{curr.code}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="text-lg font-medium">Appearance</h3>
              <RadioGroup
                defaultValue={theme || "system"}
                onValueChange={(val) => setTheme(val)}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="light" id="light" className="peer sr-only" />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Light
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Dark
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="system" id="system" className="peer sr-only" />
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    System
                  </Label>
                </div>
              </RadioGroup>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="text-lg font-medium">Budget Rules</h3>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="include-today" className="flex flex-col space-y-1">
                  <span>Include Today in Days Remaining</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Whether the current day counts towards daily budget calculations
                  </span>
                </Label>
                <Switch
                  id="include-today"
                  checked={settings?.includeTodayInDays ?? true}
                  onCheckedChange={(val) => handleSettingChange("includeTodayInDays", val)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="rollover" className="flex flex-col space-y-1">
                  <span>Rollover Budget</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Carry over unspent budget to the next month
                  </span>
                </Label>
                <Switch
                  id="rollover"
                  checked={settings?.rolloverEnabled ?? false}
                  onCheckedChange={(val) => handleSettingChange("rolloverEnabled", val)}
                  disabled={isUpdating}
                />
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="text-lg font-medium">Security & Session</h3>
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <h4 className="text-sm font-medium">Dashboard Access</h4>
                  <p className="text-xs text-muted-foreground">
                    Lock the dashboard and terminate your active browser session.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const { logoutAction } = await import("@/actions/auth");
                    await logoutAction();
                  }}
                >
                  Lock Dashboard
                </Button>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager categories={categories} />
        </TabsContent>

        <TabsContent value="data" className="space-y-8">
          <ImportWizard categories={categories} />
          
          <div className="pt-8 border-t border-border/50">
            <h3 className="text-lg font-medium mb-4">Export Reports</h3>
            <PdfReport />
          </div>

          <div className="pt-8 border-t border-border/50">
            <h3 className="text-lg font-medium text-red-500 mb-4">Danger Zone</h3>
            <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Reset to Demo Data</h4>
                  <p className="text-sm text-muted-foreground">Fills your account with realistic demo data for testing.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50">
                      Load Demo Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete ALL your current data and replace it with demo data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleReset('demo')} className="bg-red-600 hover:bg-red-700">
                        Yes, load demo data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-red-200/50">
                <div>
                  <h4 className="font-medium">Clear All Data</h4>
                  <p className="text-sm text-muted-foreground">Permanently removes all your data from the database.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Clear All Data</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete ALL your transactions, goals, and categories. Your settings will be reset to default. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleReset('clear')} className="bg-red-600 hover:bg-red-700">
                        Yes, delete everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
