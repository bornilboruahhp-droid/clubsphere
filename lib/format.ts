import { INSTITUTION_TIMEZONE } from "./config";

function toDate(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Formats a date into a localized date string in the institution's timezone.
 * Example: "12 Jan 2026"
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INSTITUTION_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(d);
}

/**
 * Formats a date and time into a localized string in the institution's timezone.
 * Example: "12 Jan 2026, 02:30 pm"
 */
export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INSTITUTION_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(d);
}

/**
 * Formats a date relative to now (e.g. "2 hours ago", "in 3 days").
 * Uses Intl.RelativeTimeFormat with fallback to formatDate for differences over 30 days.
 */
export function formatRelative(
  date: Date | string | number,
  baseDate: Date | string | number = new Date()
): string {
  const d = toDate(date);
  const base = toDate(baseDate);
  if (isNaN(d.getTime()) || isNaN(base.getTime())) return "";

  const diffMs = d.getTime() - base.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffSec) < 45) {
    return "just now";
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffSec) < 90) {
    return rtf.format(Math.sign(diffSec), "minute");
  }
  if (Math.abs(diffMin) < 45) {
    return rtf.format(diffMin, "minute");
  }
  if (Math.abs(diffMin) < 90) {
    return rtf.format(Math.sign(diffHour), "hour");
  }
  if (Math.abs(diffHour) < 22) {
    return rtf.format(diffHour, "hour");
  }
  if (Math.abs(diffHour) < 36) {
    return rtf.format(Math.sign(diffDay), "day");
  }
  if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, "day");
  }

  return formatDate(d);
}

/**
 * Formats a UTC date into a string suitable for HTML <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
 * in the configured INSTITUTION_TIMEZONE.
 */
export function utcToDatetimeLocalInput(
  date: Date | string,
  timeZone: string = INSTITUTION_TIMEZONE
): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return formatter.format(d).replace(" ", "T");
}

/**
 * Interprets a local date-time string ("YYYY-MM-DDTHH:mm") as belonging to INSTITUTION_TIMEZONE
 * and returns its equivalent UTC ISO string.
 */
export function datetimeLocalInputToUTC(
  localString: string,
  timeZone: string = INSTITUTION_TIMEZONE
): string {
  if (!localString || !localString.includes("T")) return "";

  const [datePart, timePart] = localString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  // Treat as nominal UTC first
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

  // Measure timezone offset delta for this specific date
  const invDate = new Date(utcDate.toLocaleString("en-US", { timeZone }));
  const diff = utcDate.getTime() - invDate.getTime();

  return new Date(utcDate.getTime() + diff).toISOString();
}

