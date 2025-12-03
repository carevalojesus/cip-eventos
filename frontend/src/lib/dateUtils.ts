/**
 * Date Utilities - CIP Eventos
 *
 * Centralized date formatting functions for consistent date display across the app.
 * All functions support i18n through locale parameter.
 */

export type SupportedLocale = "es-PE" | "en-US";

/**
 * Get the locale string based on current language
 */
export const getLocaleFromLang = (lang: "es" | "en"): SupportedLocale => {
  return lang === "es" ? "es-PE" : "en-US";
};

/**
 * Format a date for display in event cards and lists
 * Example: "15 dic. 2024" or "Dec 15, 2024"
 */
export const formatEventDate = (
  dateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format a date for full display (with weekday)
 * Example: "Viernes, 15 de diciembre de 2024" or "Friday, December 15, 2024"
 */
export const formatEventDateFull = (
  dateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format time for display
 * Example: "10:30 AM" or "10:30 a. m."
 */
export const formatEventTime = (
  dateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format time range
 * Example: "10:30 AM - 12:30 PM"
 */
export const formatTimeRange = (
  startDateString: string,
  endDateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  const startTime = formatEventTime(startDateString, locale);
  const endTime = formatEventTime(endDateString, locale);
  return `${startTime} - ${endTime}`;
};

/**
 * Get day number from date
 * Example: 15
 */
export const getDayNumber = (dateString: string): number => {
  if (!dateString) return 0;
  return new Date(dateString).getDate();
};

/**
 * Get short month name
 * Example: "DIC" or "DEC"
 */
export const getShortMonth = (
  dateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date
    .toLocaleDateString(locale, { month: "short" })
    .toUpperCase()
    .replace(".", "");
};

/**
 * Get weekday name
 * Example: "Viernes" or "Friday"
 */
export const getWeekday = (
  dateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, { weekday: "long" });
};

/**
 * Format date for short display (sales dates, etc.)
 * Example: "15 dic" or "Dec 15"
 */
export const formatShortDate = (
  dateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });
};

/**
 * Calculate duration in hours between two dates
 */
export const calculateDurationHours = (
  startDateString: string,
  endDateString: string
): number => {
  const start = new Date(startDateString);
  const end = new Date(endDateString);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
};

/**
 * Format duration for display
 * Example: "2 horas" or "2 hours"
 */
export const formatDuration = (
  startDateString: string,
  endDateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  const hours = calculateDurationHours(startDateString, endDateString);
  if (locale === "es-PE") {
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get local date key for grouping (yyyy-MM-dd in local timezone)
 * This ensures consistent grouping regardless of UTC offset
 */
export const getLocalDateKey = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Get relative time (for activity feeds, etc.)
 * Example: "Hace 5 minutos" or "5 minutes ago"
 */
export const getRelativeTime = (
  dateString: string,
  locale: SupportedLocale = "es-PE"
): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isSpanish = locale === "es-PE";

  if (diffMinutes < 1) {
    return isSpanish ? "Justo ahora" : "Just now";
  }
  if (diffMinutes < 60) {
    return isSpanish
      ? `Hace ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`
      : `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffHours < 24) {
    return isSpanish
      ? `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`
      : `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffDays < 7) {
    return isSpanish
      ? `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`
      : `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }

  return formatEventDate(dateString, locale);
};
