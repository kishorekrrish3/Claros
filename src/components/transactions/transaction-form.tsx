"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTransaction } from "@/actions/transactions"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

interface Category {
  id: string
  name: string
  color: string
  icon: string | null
}

interface TransactionFormProps {
  date?: string // YYYY-MM-DD
  onSuccess?: () => void
  compact?: boolean
  categories: Category[]
  currency: string
}

export function TransactionForm({
  date,
  onSuccess,
  compact = false,
  categories,
  currency,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [expandedOptions, setExpandedOptions] = useState(false)

  // Form state
  const [amount, setAmount] = useState("")
  const [merchant, setMerchant] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isEssential, setIsEssential] = useState(false)
  const [satisfaction, setSatisfaction] = useState<string>("neutral")
  const [note, setNote] = useState("")
  const [txDate, setTxDate] = useState(date || format(new Date(), "yyyy-MM-dd"))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    
    if (!merchant.trim()) {
      toast.error("Please enter a merchant")
      return
    }

    if (!categoryId) {
      toast.error("Please select a category")
      return
    }

    setLoading(true)
    try {
      await createTransaction({
        amount: Number(amount),
        merchant: merchant.trim(),
        categoryId,
        date: new Date(txDate),
        essential: isEssential,
        satisfaction: expandedOptions ? satisfaction : null,
        note: expandedOptions ? note.trim() : null,
      })

      toast.success("Transaction added")
      
      // Reset form
      setAmount("")
      setMerchant("")
      // Keep category for rapid entry
      if (expandedOptions) {
        setIsEssential(false)
        setSatisfaction("neutral")
        setNote("")
      }
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error("Failed to add transaction")
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 tabular-nums text-right"
            autoFocus
            disabled={loading}
          />
          <Input
            type="text"
            placeholder="Merchant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Cat." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate">{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="icon" disabled={loading || !amount || !merchant || !categoryId}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpandedOptions(!expandedOptions)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expandedOptions ? "Hide options" : "More options"}
          </button>
        </div>

        {expandedOptions && (
          <div className="space-y-3 pt-2 pb-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <Label htmlFor="essential-toggle" className="text-sm font-normal">
                Essential purchase?
              </Label>
              <Switch
                id="essential-toggle"
                checked={isEssential}
                onCheckedChange={setIsEssential}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </form>
    )
  }

  // Full layout for standalone use
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular-nums font-medium"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Merchant</Label>
        <Input
          type="text"
          placeholder="Where did you spend?"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span>{c.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
        <div className="space-y-0.5">
          <Label className="text-base">Essential</Label>
          <p className="text-xs text-muted-foreground">Was this a necessary expense?</p>
        </div>
        <Switch
          checked={isEssential}
          onCheckedChange={setIsEssential}
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding..." : "Add Transaction"}
      </Button>
    </form>
  )
}
