"use client";

import { useState } from "react";
import * as React from "react"
import { Plus, GripVertical, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { updateCategory, deleteCategory, createCategory } from "@/actions/budget"
import { Category } from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface CategoryManagerProps {
  categories: Category[];
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
  "#64748b"
];

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    try {
      await createCategory({
        name: newCatName,
        type: newCatType,
        color: newCatColor,
        icon: "circle", sortOrder: 0, active: true,
      });
      toast.success("Category created");
      setNewCatName("");
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Failed to delete category. It might be used in transactions.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 p-4 font-medium text-sm text-muted-foreground border-b border-border/50 bg-muted/20">
          <div>Category</div>
          <div className="w-24 text-center">Type</div>
          <div className="w-12"></div>
        </div>
        
        <div className="divide-y divide-border/50">
          {categories.map((cat) => (
            <div key={cat.id} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 items-center">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: cat.color || "#ccc" }} 
                />
                <span className="font-medium">{cat.name}</span>
              </div>
              <div className="w-24 flex justify-center">
                <Badge variant={cat.type === "income" ? "default" : "secondary"}>
                  {cat.type}
                </Badge>
              </div>
              <div className="w-12 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete '{cat.name}'? This cannot be undone. 
                        If there are transactions using this category, the deletion might fail.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted/10 border-t border-border/50 flex items-center gap-4">
          <Input 
            placeholder="New category name" 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1"
          />
          
          <Select value={newCatType} onValueChange={(val: any) => setNewCatType(val)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>

          <PopoverColorPicker color={newCatColor} onChange={setNewCatColor} />

          <Button onClick={handleAdd} disabled={isSubmitting || !newCatName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
function PopoverColorPicker({ color, onChange }: { color: string, onChange: (c: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="w-10 h-10 rounded-md border shadow-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-5 gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className="w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
