"use client"

import { useState } from "react"
import { Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteTransaction, updateTransaction } from "@/actions/transactions"
import { formatCurrency } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TransactionRowProps {
  transaction: {
    id: string
    date: Date
    amount: number
    type: string
    merchant: string
    note: string | null
    essential: boolean
    satisfaction: string | null
    category: { id: string; name: string; color: string; icon: string | null } | null
  }
  currency: string
  onUpdate?: () => void
  onDelete?: () => void
}

export function TransactionRow({
  transaction,
  currency,
  onUpdate,
  onDelete,
}: TransactionRowProps) {
  const [isEditingMerchant, setIsEditingMerchant] = useState(false)
  const [isEditingAmount, setIsEditingAmount] = useState(false)
  const [merchant, setMerchant] = useState(transaction.merchant)
  const [amount, setAmount] = useState(transaction.amount.toString())
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdateMerchant = async () => {
    if (merchant.trim() === transaction.merchant) {
      setIsEditingMerchant(false)
      return
    }

    try {
      await updateTransaction(transaction.id, { merchant: merchant.trim() })
      setIsEditingMerchant(false)
      onUpdate?.()
    } catch (error) {
      toast.error("Failed to update merchant")
      setMerchant(transaction.merchant) // revert
    }
  }

  const handleUpdateAmount = async () => {
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount === transaction.amount) {
      setIsEditingAmount(false)
      setAmount(transaction.amount.toString())
      return
    }

    try {
      await updateTransaction(transaction.id, { amount: numAmount })
      setIsEditingAmount(false)
      onUpdate?.()
    } catch (error) {
      toast.error("Failed to update amount")
      setAmount(transaction.amount.toString()) // revert
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this transaction?")) return

    setIsDeleting(true)
    try {
      await deleteTransaction(transaction.id)
      onDelete?.()
      onUpdate?.()
    } catch (error) {
      toast.error("Failed to delete transaction")
      setIsDeleting(false)
    }
  }

  const categoryColor = transaction.category?.color || "#94a3b8"

  return (
    <div className={cn(
      "group flex items-center justify-between py-3 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors duration-150",
      isDeleting && "opacity-50 pointer-events-none"
    )}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div 
          className="w-2.5 h-2.5 rounded-full shrink-0" 
          style={{ backgroundColor: categoryColor }}
          title={transaction.category?.name || "Uncategorized"}
        />
        
        <div className="flex flex-col min-w-0 flex-1">
          {isEditingMerchant ? (
            <Input
              autoFocus
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              onBlur={handleUpdateMerchant}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateMerchant()
                if (e.key === "Escape") {
                  setMerchant(transaction.merchant)
                  setIsEditingMerchant(false)
                }
              }}
              className="h-6 text-sm py-0 px-1.5 -ml-1.5 mb-0.5"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span 
                className="text-sm font-medium truncate cursor-text"
                onClick={() => setIsEditingMerchant(true)}
              >
                {transaction.merchant}
              </span>
              {transaction.essential && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="Essential" />
              )}
            </div>
          )}
          
          {transaction.note && (
            <span className="text-xs text-muted-foreground truncate">
              {transaction.note}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pl-2">
        <div className="flex gap-1 opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            aria-label="Delete transaction"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {isEditingAmount ? (
          <Input
            autoFocus
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={handleUpdateAmount}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateAmount()
              if (e.key === "Escape") {
                setAmount(transaction.amount.toString())
                setIsEditingAmount(false)
              }
            }}
            className="h-6 w-20 text-right tabular-nums text-sm py-0 px-1.5"
          />
        ) : (
          <span 
            className="text-sm font-medium tabular-nums cursor-text text-right min-w-[70px]"
            onClick={() => setIsEditingAmount(true)}
          >
            {formatCurrency(transaction.amount, currency as any)}
          </span>
        )}
      </div>
    </div>
  )
}
