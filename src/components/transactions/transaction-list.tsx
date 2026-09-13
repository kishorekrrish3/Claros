"use client"

import { useMemo } from "react"
import { format, isToday, isYesterday, parseISO } from "date-fns"
import { TransactionRow } from "./transaction-row"

interface TransactionListProps {
  transactions: any[]
  currency: string
  onUpdate?: () => void
}

export function TransactionList({
  transactions,
  currency,
  onUpdate,
}: TransactionListProps) {
  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, any[]> = {}
    
    transactions.forEach(tx => {
      // Assuming tx.date is a Date object or ISO string
      const dateObj = typeof tx.date === 'string' ? parseISO(tx.date) : new Date(tx.date)
      const dateStr = format(dateObj, "yyyy-MM-dd")
      
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(tx)
    })
    
    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(dateStr => ({
        dateStr,
        date: parseISO(dateStr),
        transactions: groups[dateStr]
      }))
  }, [transactions])

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p className="text-sm">No transactions found</p>
      </div>
    )
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMMM d, yyyy")
  }

  return (
    <div className="space-y-6">
      {groupedTransactions.map(group => (
        <div key={group.dateStr} className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
            {getDateLabel(group.date)}
          </h3>
          <div className="space-y-0.5">
            {group.transactions.map(tx => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                currency={currency}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
