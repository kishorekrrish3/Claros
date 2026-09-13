"use client"

import { useState } from "react"
import { MonthNavigator } from "@/components/overview/month-navigator"
import { MonthCalendar } from "@/components/calendar/month-calendar"
import { DayDrawer } from "@/components/calendar/day-drawer"
import { useRouter } from "next/navigation"

interface CalendarContentProps {
  year: number
  month: number
  initialData: any[]
  currency: any
}

export function CalendarContent({
  year,
  month,
  initialData,
  currency,
}: CalendarContentProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleMonthChange = (newYear: number, newMonth: number) => {
    const formattedMonth = `${newYear}-${String(newMonth).padStart(2, "0")}`
    router.push(`/calendar?month=${formattedMonth}`)
  }

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display-sm font-semibold tracking-tight">Calendar</h1>
        <MonthNavigator
          currentYear={year}
          currentMonth={month}
          onChange={handleMonthChange}
        />
      </div>

      <div className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden flex-1">
        <MonthCalendar
          year={year}
          month={month}
          days={initialData}
          onDayClick={handleDayClick}
          currency={currency}
        />
      </div>

      <DayDrawer
        date={selectedDate}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        currency={currency}
      />
    </div>
  )
}
