"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { db } from "@/lib/db";

export interface CalendarDayData {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  totalSpent: number;
  transactionCount: number;
  emoji: string | null;
  isToday: boolean;
  hasTransactions: boolean;
}

/**
 * Returns for each day of the month: date, totalSpent, transactionCount, emoji, isToday, hasTransactions.
 * Querying all transactions + day metadata for the month.
 *
 * @param year e.g. 2026
 * @param month 1-indexed month (1-12)
 */
export async function getMonthCalendarData(
  year: number,
  month: number
): Promise<CalendarDayData[]> {
  try {
    const daysInMonth = new Date(year, month, 0).getDate();
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

    const [transactions, metadata] = await Promise.all([
      db.transaction.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      }),
      db.dayMetadata.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);

    const txByDay = new Map<string, { totalSpent: number; count: number }>();
    for (const t of transactions) {
      const dayKey = format(t.date, "yyyy-MM-dd");
      const current = txByDay.get(dayKey) || { totalSpent: 0, count: 0 };
      if (t.type === "expense") {
        current.totalSpent += t.amount;
      }
      current.count += 1;
      txByDay.set(dayKey, current);
    }

    const metaByDay = new Map<string, { emoji: string | null; note: string | null }>();
    for (const m of metadata) {
      const dayKey = format(m.date, "yyyy-MM-dd");
      metaByDay.set(dayKey, { emoji: m.emoji, note: m.note });
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const result: CalendarDayData[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const txInfo = txByDay.get(dayStr);
      const metaInfo = metaByDay.get(dayStr);
      const count = txInfo?.count ?? 0;

      result.push({
        date: dayStr,
        dayOfMonth: day,
        totalSpent: txInfo?.totalSpent ?? 0,
        transactionCount: count,
        emoji: metaInfo?.emoji ?? null,
        isToday: dayStr === todayStr,
        hasTransactions: count > 0,
      });
    }

    return result;
  } catch (error) {
    console.error("Failed to get month calendar data:", error);
    return [];
  }
}

/**
 * Get emoji/note metadata for a specific date (YYYY-MM-DD).
 */
export async function getDayMetadata(dateStr: string) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);

    const meta = await db.dayMetadata.findFirst({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return meta;
  } catch (error) {
    console.error("Failed to get day metadata:", error);
    return null;
  }
}

/**
 * Upsert emoji for a date (YYYY-MM-DD).
 */
export async function setDayEmoji(dateStr: string, emoji: string | null) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    const targetDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    const existing = await db.dayMetadata.findFirst({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    let result;
    if (existing) {
      result = await db.dayMetadata.update({
        where: { id: existing.id },
        data: { emoji },
      });
    } else {
      result = await db.dayMetadata.create({
        data: {
          date: targetDate,
          emoji,
        },
      });
    }

    revalidatePath("/calendar");

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to set day emoji:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set day emoji",
    };
  }
}

/**
 * Alias for setDayEmoji to support legacy/drawer component imports.
 */
export const updateDayEmoji = setDayEmoji;

/**
 * Upsert note for a date (YYYY-MM-DD).
 */
export async function setDayNote(dateStr: string, note: string | null) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    const targetDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    const existing = await db.dayMetadata.findFirst({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    let result;
    if (existing) {
      result = await db.dayMetadata.update({
        where: { id: existing.id },
        data: { note },
      });
    } else {
      result = await db.dayMetadata.create({
        data: {
          date: targetDate,
          note,
        },
      });
    }

    revalidatePath("/calendar");

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to set day note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set day note",
    };
  }
}

/**
 * Alias for setDayNote.
 */
export const updateDayNote = setDayNote;
