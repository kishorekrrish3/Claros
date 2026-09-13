"use client"

import { useState } from "react"
import { Plus, Check, ArrowDownRight, ArrowUpRight, Repeat } from "lucide-react"
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
  defaultDate?: Date | string
  onSuccess?: () => void
  onCancel?: () => void
  compact?: boolean
  categories: Category[]
  currency?: string
}

const PAYMENT_METHODS = [
  { id: "upi", label: "📱 UPI" },
  { id: "card", label: "💳 Card" },
  { id: "cash", label: "💵 Cash" },
  { id: "netbanking", label: "🏦 NetBank" },
]

export function TransactionForm({
  date,
  defaultDate,
  onSuccess,
  onCancel,
  compact = false,
  categories = [],
  currency = "INR",
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [expandedOptions, setExpandedOptions] = useState(false)

  // Resolve initial date string
  const initialDateStr = (() => {
    if (date) return date
    if (defaultDate) {
      if (typeof defaultDate === "string") return defaultDate.split("T")[0]
      return format(defaultDate, "yyyy-MM-dd")
    }
    return format(new Date(), "yyyy-MM-dd")
  })()

  // Form state
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense")
  const [amount, setAmount] = useState("")
  const [merchant, setMerchant] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "")
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [isEssential, setIsEssential] = useState(false)
  const [satisfaction, setSatisfaction] = useState<"love" | "fine" | "regret" | null>(null)
  const [note, setNote] = useState("")
  const [txDate, setTxDate] = useState(initialDateStr)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!merchant.trim()) {
      toast.error("Please enter merchant / description")
      return
    }

    if (type === "expense" && !categoryId && categories.length > 0) {
      toast.error("Please select a category")
      return
    }

    setLoading(true)
    try {
      const pmLabel = PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label || ""
      const combinedNote = note.trim()
        ? `[${pmLabel}] ${note.trim()}`
        : `[${pmLabel}]`

      const res = await createTransaction({
        amount: Number(amount),
        merchant: merchant.trim(),
        categoryId: type === "expense" ? (categoryId || categories[0]?.id || null) : null,
        date: new Date(txDate),
        essential: isEssential,
        satisfaction: satisfaction,
        note: combinedNote,
        type: type,
      })

      if (!res.success) {
        toast.error(res.error || "Failed to log entry")
        return
      }

      toast.success("Entry logged successfully!")

      // Reset form
      setAmount("")
      setMerchant("")
      setNote("")
      setIsEssential(false)
      setSatisfaction(null)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error("Failed to add entry")
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
            className="w-24 tabular-nums text-right font-semibold"
            autoFocus
            disabled={loading}
          />
          <Input
            type="text"
            placeholder="Merchant / What for?"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
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
          <Button type="submit" size="icon" disabled={loading || !amount || !merchant}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpandedOptions(!expandedOptions)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expandedOptions ? "Hide options" : "+ More options"}
          </button>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-xs">
              Cancel
            </Button>
          )}
        </div>

        {expandedOptions && (
          <div className="space-y-3 pt-2 pb-1 animate-in fade-in slide-in-from-top-2 duration-150 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label htmlFor="essential-toggle-compact" className="text-xs font-normal">
                Essential expense?
              </Label>
              <Switch
                id="essential-toggle-compact"
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

  // Full Quick-Entry Layout
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type switch pills */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-lg">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            type === "expense"
              ? "bg-background text-rose-600 dark:text-rose-400 font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" /> Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            type === "income"
              ? "bg-background text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5" /> Income
        </button>
        <button
          type="button"
          onClick={() => setType("transfer")}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            type === "transfer"
              ? "bg-background text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" /> Transfer
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Amount ({currency})</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular-nums font-bold text-lg"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Merchant / Description</Label>
        <Input
          type="text"
          placeholder="e.g. Swiggy, Uber, Supermarket..."
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-1.5">
        <Label className="text-xs">Payment Method</Label>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => setPaymentMethod(pm.id)}
              className={`text-xs px-3 py-1.5 rounded-md transition-all font-medium border ${
                paymentMethod === pm.id
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                  : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Category Chips */}
      {type === "expense" && categories.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
            {categories.map((c) => {
              const isSelected = categoryId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span>{c.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Mindful Satisfaction Rating */}
      <div className="space-y-1.5">
        <Label className="text-xs">Mindful Spending Rating</Label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSatisfaction(satisfaction === "love" ? null : "love")}
            className={`flex-1 text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 font-medium transition-all ${
              satisfaction === "love"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 font-semibold"
                : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            😍 Loved
          </button>
          <button
            type="button"
            onClick={() => setSatisfaction(satisfaction === "fine" ? null : "fine")}
            className={`flex-1 text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 font-medium transition-all ${
              satisfaction === "fine"
                ? "border-blue-500 bg-blue-500/10 text-blue-600 font-semibold"
                : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            🙂 Okay
          </button>
          <button
            type="button"
            onClick={() => setSatisfaction(satisfaction === "regret" ? null : "regret")}
            className={`flex-1 text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 font-medium transition-all ${
              satisfaction === "regret"
                ? "border-rose-500 bg-rose-500/10 text-rose-600 font-semibold"
                : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            😒 Regret
          </button>
        </div>
      </div>

      {/* Essential expense toggle */}
      <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-muted/20">
        <div className="space-y-0.5">
          <Label className="text-xs font-medium">Essential expense?</Label>
          <p className="text-[11px] text-muted-foreground">Mark if this was a necessary spend</p>
        </div>
        <Switch
          checked={isEssential}
          onCheckedChange={setIsEssential}
          disabled={loading}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 font-semibold" disabled={loading || !amount || !merchant}>
          {loading ? "Saving..." : "Log Entry"}
        </Button>
      </div>
    </form>
  )
}
