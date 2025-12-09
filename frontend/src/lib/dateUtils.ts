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

/**
 * Get human-readable relative time for last access/connection
 * More comprehensive than getRelativeTime, includes weeks/months
 * Example: "Hace 2 horas", "Ayer", "La semana pasada", "Hace 3 meses"
 */
export const getLastAccessTime = (
  dateString: string | null | undefined,
  locale: SupportedLocale = "es-PE"
): { text: string; fullDate: string } => {
  const isSpanish = locale === "es-PE";

  // Handle null/undefined
  if (!dateString) {
    return {
      text: isSpanish ? "Nunca" : "Never",
      fullDate: "",
    };
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Handle future dates (shouldn't happen, but just in case)
  if (diffMs < 0) {
    return {
      text: isSpanish ? "Justo ahora" : "Just now",
      fullDate: formatDateTimeLong(dateString, locale),
    };
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const fullDate = formatDateTimeLong(dateString, locale);

  // Just now (less than 1 minute)
  if (diffSeconds < 60) {
    return {
      text: isSpanish ? "Justo ahora" : "Just now",
      fullDate,
    };
  }

  // Minutes (1-59)
  if (diffMinutes < 60) {
    return {
      text: isSpanish
        ? `Hace ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`
        : `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`,
      fullDate,
    };
  }

  // Hours (1-23)
  if (diffHours < 24) {
    return {
      text: isSpanish
        ? `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`
        : `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`,
      fullDate,
    };
  }

  // Yesterday (24-47 hours)
  if (diffHours < 48) {
    return {
      text: isSpanish ? "Ayer" : "Yesterday",
      fullDate,
    };
  }

  // Days (2-6)
  if (diffDays < 7) {
    return {
      text: isSpanish
        ? `Hace ${diffDays} días`
        : `${diffDays} days ago`,
      fullDate,
    };
  }

  // Last week (7-13 days)
  if (diffDays < 14) {
    return {
      text: isSpanish ? "La semana pasada" : "Last week",
      fullDate,
    };
  }

  // Weeks (2-4)
  if (diffDays < 30) {
    return {
      text: isSpanish
        ? `Hace ${diffWeeks} semanas`
        : `${diffWeeks} weeks ago`,
      fullDate,
    };
  }

  // Last month (30-59 days)
  if (diffDays < 60) {
    return {
      text: isSpanish ? "El mes pasado" : "Last month",
      fullDate,
    };
  }

  // Months (2-11)
  if (diffMonths < 12) {
    return {
      text: isSpanish
        ? `Hace ${diffMonths} meses`
        : `${diffMonths} months ago`,
      fullDate,
    };
  }

  // Years (1+)
  if (diffYears === 1) {
    return {
      text: isSpanish ? "Hace un año" : "A year ago",
      fullDate,
    };
  }

  return {
    text: isSpanish
      ? `Hace ${diffYears} años`
      : `${diffYears} years ago`,
    fullDate,
  };
};

/**
 * Format date and time for tables and details
 * Example: "15 dic. 2024, 10:30" or "Dec 15, 2024, 10:30 AM"
 */
export const formatDateTime = (
  dateString: string | null,
  locale: SupportedLocale = "es-PE",
  options?: { timezone?: string }
): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    timeZone: options?.timezone || "America/Lima",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date and time with long month
 * Example: "15 de diciembre de 2024, 10:30" or "December 15, 2024, 10:30 AM"
 */
export const formatDateTimeLong = (
  dateString: string | null,
  locale: SupportedLocale = "es-PE",
  options?: { timezone?: string }
): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    timeZone: options?.timezone || "America/Lima",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Check if a time is within a given window (in minutes)
 * Useful for rate limiting checks
 */
export const isWithinTimeWindow = (
  dateString: string | null,
  windowMinutes: number
): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes < windowMinutes;
};
