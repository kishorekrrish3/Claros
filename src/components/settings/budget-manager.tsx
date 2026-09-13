"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createIncomeSource,
  deleteIncomeSource,
  createFixedExpense,
  deleteFixedExpense,
  createSavingsAllocation,
  deleteSavingsAllocation,
} from "@/actions/budget";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/constants";

interface BudgetManagerProps {
  incomeSources: any[];
  fixedExpenses: any[];
  savingsAllocations: any[];
  currency: string;
}

export function BudgetManager({
  incomeSources,
  fixedExpenses,
  savingsAllocations,
  currency,
}: BudgetManagerProps) {

  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");

  const [newFixedName, setNewFixedName] = useState("");
  const [newFixedAmount, setNewFixedAmount] = useState("");

  const [newSavingsName, setNewSavingsName] = useState("");
  const [newSavingsAmount, setNewSavingsAmount] = useState("");
  const [newSavingsType, setNewSavingsType] = useState<"fixed" | "percentage">("fixed");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers ---

  const handleAddIncome = async () => {
    if (!newIncomeName.trim() || !newIncomeAmount) return;
    setIsSubmitting(true);
    try {
      await createIncomeSource({
        name: newIncomeName,
        amount: Number(newIncomeAmount),
        category: "Salary",
        active: true,
      });
      toast.success("Income source added");
      setNewIncomeName("");
      setNewIncomeAmount("");
    } catch (error) {
      toast.error("Failed to add income source");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await deleteIncomeSource(id);
      toast.success("Income source removed");
    } catch (error) {
      toast.error("Failed to remove income source");
    }
  };

  const handleAddFixed = async () => {
    if (!newFixedName.trim() || !newFixedAmount) return;
    setIsSubmitting(true);
    try {
      await createFixedExpense({
        name: newFixedName,
        amount: Number(newFixedAmount),
        category: "Bills",
        dayOfMonth: 1,
        active: true,
      });
      toast.success("Fixed expense added");
      setNewFixedName("");
      setNewFixedAmount("");
    } catch (error) {
      toast.error("Failed to add fixed expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFixed = async (id: string) => {
    try {
      await deleteFixedExpense(id);
      toast.success("Fixed expense removed");
    } catch (error) {
      toast.error("Failed to remove fixed expense");
    }
  };

  const handleAddSavings = async () => {
    if (!newSavingsName.trim() || !newSavingsAmount) return;
    setIsSubmitting(true);
    try {
      await createSavingsAllocation({
        name: newSavingsName,
        amount: Number(newSavingsAmount),
        type: newSavingsType,
        active: true,
      });
      toast.success("Savings allocation added");
      setNewSavingsName("");
      setNewSavingsAmount("");
    } catch (error) {
      toast.error("Failed to add savings allocation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSavings = async (id: string) => {
    try {
      await deleteSavingsAllocation(id);
      toast.success("Savings allocation removed");
    } catch (error) {
      toast.error("Failed to remove savings allocation");
    }
  };

  return (
    <div className="space-y-12 max-w-3xl">
      {/* INCOME SOURCES */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Income Sources</h3>
          <p className="text-sm text-muted-foreground">Add your salary, side hustles, or any regular monthly income.</p>
        </div>
        <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 font-medium text-sm text-muted-foreground border-b border-border/50 bg-muted/20">
            <div>Name</div>
            <div className="w-32 text-right">Amount</div>
            <div className="w-12"></div>
          </div>
          <div className="divide-y divide-border/50">
            {incomeSources.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 items-center">
                <span className="font-medium">{item.name}</span>
                <span className="w-32 text-right font-medium tabular-nums">{formatCurrency(item.amount, currency)}</span>
                <div className="w-12 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Income Source</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to remove '{item.name}'?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteIncome(item.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-muted/10 border-t border-border/50 flex flex-col sm:flex-row items-center gap-4">
            <Input placeholder="e.g. Primary Salary" value={newIncomeName} onChange={(e) => setNewIncomeName(e.target.value)} className="flex-1" />
            <Input type="number" placeholder="Amount" value={newIncomeAmount} onChange={(e) => setNewIncomeAmount(e.target.value)} className="w-full sm:w-32" />
            <Button onClick={handleAddIncome} disabled={isSubmitting || !newIncomeName.trim() || !newIncomeAmount} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </section>

      {/* FIXED EXPENSES */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Fixed Expenses</h3>
          <p className="text-sm text-muted-foreground">Add your rent, subscriptions, and any guaranteed bills.</p>
        </div>
        <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 font-medium text-sm text-muted-foreground border-b border-border/50 bg-muted/20">
            <div>Name</div>
            <div className="w-32 text-right">Amount</div>
            <div className="w-12"></div>
          </div>
          <div className="divide-y divide-border/50">
            {fixedExpenses.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 items-center">
                <span className="font-medium">{item.name}</span>
                <span className="w-32 text-right font-medium tabular-nums">{formatCurrency(item.amount, currency)}</span>
                <div className="w-12 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Fixed Expense</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to remove '{item.name}'?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteFixed(item.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-muted/10 border-t border-border/50 flex flex-col sm:flex-row items-center gap-4">
            <Input placeholder="e.g. Rent" value={newFixedName} onChange={(e) => setNewFixedName(e.target.value)} className="flex-1" />
            <Input type="number" placeholder="Amount" value={newFixedAmount} onChange={(e) => setNewFixedAmount(e.target.value)} className="w-full sm:w-32" />
            <Button onClick={handleAddFixed} disabled={isSubmitting || !newFixedName.trim() || !newFixedAmount} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </section>

      {/* SAVINGS ALLOCATIONS */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Savings Allocations</h3>
          <p className="text-sm text-muted-foreground">Money automatically set aside for investments or savings goals.</p>
        </div>
        <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 font-medium text-sm text-muted-foreground border-b border-border/50 bg-muted/20">
            <div>Name</div>
            <div className="w-32 text-right">Value</div>
            <div className="w-12"></div>
          </div>
          <div className="divide-y divide-border/50">
            {savingsAllocations.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 items-center">
                <span className="font-medium">{item.name}</span>
                <span className="w-32 text-right font-medium tabular-nums">
                  {item.type === "percentage" ? `${item.amount}%` : formatCurrency(item.amount, currency)}
                </span>
                <div className="w-12 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Savings Allocation</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to remove '{item.name}'?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSavings(item.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-muted/10 border-t border-border/50 flex flex-col sm:flex-row items-center gap-4">
            <Input placeholder="e.g. Emergency Fund" value={newSavingsName} onChange={(e) => setNewSavingsName(e.target.value)} className="flex-1" />
            
            <Select value={newSavingsType} onValueChange={(val: any) => setNewSavingsType(val)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="percentage">% of Income</SelectItem>
              </SelectContent>
            </Select>

            <Input type="number" placeholder={newSavingsType === "percentage" ? "%" : "Amount"} value={newSavingsAmount} onChange={(e) => setNewSavingsAmount(e.target.value)} className="w-full sm:w-24" />
            
            <Button onClick={handleAddSavings} disabled={isSubmitting || !newSavingsName.trim() || !newSavingsAmount} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
