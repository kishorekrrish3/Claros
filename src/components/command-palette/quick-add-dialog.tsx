"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Assume TransactionForm exists and can take a date
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Category } from "@prisma/client";

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
}

export function QuickAddDialog({ open, onOpenChange, categories }: QuickAddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <TransactionForm 
            categories={categories}
            defaultDate={new Date()}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
