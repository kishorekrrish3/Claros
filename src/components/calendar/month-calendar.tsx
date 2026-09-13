"use client"

import { useMemo } from "react"
import { getDaysInMonth, getDay, format, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/constants"

interface CalendarDayData {
  date: string // YYYY-MM-DD
  totalSpent: number
  emoji: string | null
}

interface MonthCalendarProps {
  year: number
  month: number // 1-indexed
  days: CalendarDayData[]
  onDayClick: (dateStr: string) => void
  currency: string
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function MonthCalendar({
  year,
  month,
  days,
  onDayClick,
  currency,
}: MonthCalendarProps) {
  const calendarDays = useMemo(() => {
    // 0-indexed month for date-fns
    const monthIndex = month - 1
    const firstDayOfMonth = new Date(year, monthIndex, 1)
    const daysInMonth = getDaysInMonth(firstDayOfMonth)
    
    // getDay() returns 0 for Sunday, 1 for Monday.
    // We want Monday = 0, Sunday = 6
    let startDayOfWeek = getDay(firstDayOfMonth) - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6 // Sunday

    const result = []

    // Padding for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      result.push(null)
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      const dayData = days.find(d => d.date === dateStr)
      result.push({
        dayNumber: i,
        dateStr,
        date: new Date(year, monthIndex, i),
        totalSpent: dayData?.totalSpent || 0,
        emoji: dayData?.emoji || null,
      })
    }

    return result
  }, [year, month, days])

  const getMaxSpending = () => {
    if (!days || days.length === 0) return 1
    return Math.max(...days.map(d => d.totalSpent))
  }
  const maxSpending = getMaxSpending()

  return (
    <div className="flex flex-col h-full w-full">
      <div className="grid grid-cols-7 border-b border-border/30 bg-muted/20">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs text-muted-foreground uppercase font-medium tracking-wider border-r border-border/30 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {calendarDays.map((dayInfo, index) => {
          if (!dayInfo) {
            return (
              <div
                key={`empty-${index}`}
                className="border-r border-b border-border/30 bg-muted/5 last:border-r-0"
              />
            )
          }

          const { dayNumber, dateStr, date, totalSpent, emoji } = dayInfo
          const isCurrentToday = isToday(date)
          
          // Calculate opacity based on spending relative to max spending
          let bgIntensityClass = ""
          if (totalSpent > 0) {
            const ratio = totalSpent / maxSpending
            if (ratio > 0.75) bgIntensityClass = "bg-primary/30"
            else if (ratio > 0.5) bgIntensityClass = "bg-primary/20"
            else if (ratio > 0.25) bgIntensityClass = "bg-primary/10"
            else bgIntensityClass = "bg-primary/5"
          }

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onDayClick(dateStr)
              }}
              tabIndex={0}
              className={cn(
                "relative border-r border-b border-border/30 last:border-r-0 p-2 flex flex-col justify-between transition-colors duration-150 cursor-pointer hover:bg-accent/50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                bgIntensityClass,
                isCurrentToday && "ring-1 ring-primary ring-inset z-10"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-sm font-medium",
                  isCurrentToday ? "text-primary" : "text-foreground"
                )}>
                  {dayNumber}
                </span>
                {emoji && (
                  <span className="text-lg leading-none">{emoji}</span>
                )}
              </div>
              
              {totalSpent > 0 && (
                <div className="text-right mt-4">
                  <span className="text-xs font-medium tabular-nums text-foreground/80">
                    {formatCurrency(totalSpent, currency as any)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
