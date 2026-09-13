import { getMonthCalendarData } from "@/actions/calendar"
import { getUserSettings } from "@/actions/budget"
import { CalendarContent } from "@/components/calendar/calendar-content"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Calendar | Claros",
  description: "View your spending on a calendar",
}

interface CalendarPageProps {
  searchParams: { month?: string }
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const settings = await getUserSettings()
  if (!settings) {
    redirect("/setup")
  }

  // Parse month from searchParams or default to current month
  const today = new Date()
  let year = today.getFullYear()
  let month = today.getMonth() + 1 // 1-indexed

  if (searchParams.month) {
    const [y, m] = searchParams.month.split("-")
    if (y && m) {
      year = parseInt(y, 10)
      month = parseInt(m, 10)
    }
  }

  const calendarData = await getMonthCalendarData(year, month)

  return (
    <div className="flex-1 flex flex-col h-full">
      <CalendarContent
        year={year}
        month={month}
        initialData={calendarData}
        currency={settings.currency}
      />
    </div>
  )
}
