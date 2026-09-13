"use client"

import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SmilePlus } from "lucide-react"
import { EmojiPicker } from "@/components/calendar/emoji-picker"
import { TransactionList } from "@/components/transactions/transaction-list"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { getTransactionsByDate } from "@/actions/transactions"
import { updateDayEmoji } from "@/actions/calendar"
import { getCategories } from "@/actions/budget"
import { formatCurrency, formatDayDate } from "@/lib/constants"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface DayDrawerProps {
  date: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
}

export function DayDrawer({
  date,
  open,
  onOpenChange,
  currency,
}: DayDrawerProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [dayEmoji, setDayEmoji] = useState<string | null>(null)

  const loadData = async (dateStr: string) => {
    setLoading(true)
    try {
      const [txData, catsData] = await Promise.all([
        getTransactionsByDate(dateStr),
        getCategories()
      ])
      setTransactions(txData.transactions || [])
      setDayEmoji(txData.emoji || null)
      setCategories(catsData || [])
    } catch (error) {
      toast.error("Failed to load day details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && date) {
      loadData(date)
      setShowEmojiPicker(false)
    }
  }, [open, date])

  const handleEmojiSelect = async (emoji: string | null) => {
    if (!date) return
    setDayEmoji(emoji)
    setShowEmojiPicker(false)
    try {
      await updateDayEmoji(date, emoji)
    } catch (error) {
      toast.error("Failed to update emoji")
    }
  }

  const handleTransactionSuccess = () => {
    if (date) loadData(date)
  }

  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const parsedDate = date ? parseISO(date) : new Date()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col h-full border-l-border/50">
        <SheetHeader className="p-6 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-medium tracking-tight">
              {date ? format(parsedDate, "EEEE, MMMM d, yyyy") : ""}
            </SheetTitle>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-10 w-10 text-2xl"
              >
                {dayEmoji ? dayEmoji : <SmilePlus className="h-5 w-5 text-muted-foreground" />}
              </Button>
              {showEmojiPicker && (
                <div className="absolute right-0 top-12 z-50 bg-popover border border-border shadow-md rounded-md p-2">
                  <EmojiPicker
                    selectedEmoji={dayEmoji}
                    onSelect={handleEmojiSelect}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Total Spent</span>
            <span className="text-3xl font-semibold tabular-nums tracking-tight">
              {formatCurrency(totalSpent, currency as any)}
            </span>
          </div>
        </SheetHeader>

        <Separator className="bg-border/50" />

        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : (
            <TransactionList
              transactions={transactions}
              currency={currency as any}
              onUpdate={() => { if (date) loadData(date) }}
            />
          )}
        </ScrollArea>

        <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-sm">
          <h4 className="text-sm font-medium mb-3">Quick Add</h4>
          <TransactionForm
            date={date || undefined}
            categories={categories}
            currency={currency as any}
            compact={true}
            onSuccess={handleTransactionSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
