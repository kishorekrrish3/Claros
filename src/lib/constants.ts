import { format } from "date-fns";

// ─── Supported Currencies ────────────────────────────────────────────────────

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "JPY" | "CAD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN", decimals: 2 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US", decimals: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE", decimals: 2 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB", decimals: 2 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP", decimals: 0 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", locale: "en-CA", decimals: 2 },
} as const;

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

// ─── Default Categories ──────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "🍽️", color: "#f97316", type: "expense" as const, sortOrder: 0 },
  { name: "Transport", icon: "🚌", color: "#3b82f6", type: "expense" as const, sortOrder: 1 },
  { name: "Shopping", icon: "🛍️", color: "#a855f7", type: "expense" as const, sortOrder: 2 },
  { name: "Bills", icon: "📄", color: "#ef4444", type: "expense" as const, sortOrder: 3 },
  { name: "Entertainment", icon: "🎬", color: "#ec4899", type: "expense" as const, sortOrder: 4 },
  { name: "Health", icon: "❤️", color: "#10b981", type: "expense" as const, sortOrder: 5 },
  { name: "Education", icon: "📚", color: "#6366f1", type: "expense" as const, sortOrder: 6 },
  { name: "Travel", icon: "✈️", color: "#14b8a6", type: "expense" as const, sortOrder: 7 },
  { name: "Home", icon: "🏠", color: "#f59e0b", type: "expense" as const, sortOrder: 8 },
  { name: "Other", icon: "📦", color: "#6b7280", type: "expense" as const, sortOrder: 9 },
  { name: "Income", icon: "💰", color: "#22c55e", type: "income" as const, sortOrder: 10 },
] as const;

// ─── Satisfaction Tags ───────────────────────────────────────────────────────

export const SATISFACTION_OPTIONS = [
  { value: "love", label: "Worth it", emoji: "😊" },
  { value: "fine", label: "Fine", emoji: "😐" },
  { value: "regret", label: "Regret", emoji: "😞" },
] as const;

// ─── Transaction Types ───────────────────────────────────────────────────────

export const TRANSACTION_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
] as const;

// ─── Theme Options ───────────────────────────────────────────────────────────

export const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

// ─── Formatting Helpers ──────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: Intl.NumberFormatOptions
): string {
  const validCode = (currencyCode as CurrencyCode) in CURRENCIES ? (currencyCode as CurrencyCode) : DEFAULT_CURRENCY;
  const config = CURRENCIES[validCode] || CURRENCIES[DEFAULT_CURRENCY];
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: options?.minimumFractionDigits ?? config.decimals,
    maximumFractionDigits: options?.maximumFractionDigits ?? config.decimals,
    ...options,
  }).format(amount || 0);
}

export function formatCompactCurrency(
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): string {
  const config = CURRENCIES[currencyCode];
  if (Math.abs(amount) >= 100000) {
    return `${config.symbol}${(amount / 100000).toFixed(1)}L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${config.symbol}${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currencyCode);
}

export function formatMonth(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function formatMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function formatShortDate(date: Date): string {
  return format(date, "MMM d");
}

export function formatDayDate(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

// ─── App Metadata ────────────────────────────────────────────────────────────

export const APP_NAME = "Claros";
export const APP_DESCRIPTION = "Know what you can safely spend today.";
export const APP_VERSION = "1.0.0";

// ─── Upload Constraints ──────────────────────────────────────────────────────

export const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
export const ALLOWED_RECEIPT_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".pdf"];
