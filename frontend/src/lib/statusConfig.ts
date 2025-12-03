/**
 * Status Configuration - CIP Eventos
 *
 * Centralized configuration for event status styling.
 * Use this instead of duplicating status config in multiple components.
 */

import { EventStatus } from "@/lib/enums";

export interface StatusStyle {
  /** Background color */
  bg: string;
  /** Text color */
  text: string;
  /** Dot/indicator color */
  dot: string;
  /** Light background for badges */
  bgLight?: string;
}

/**
 * Event status styling configuration
 * Uses CSS variables for consistency with design system
 */
export const eventStatusConfig: Record<EventStatus, StatusStyle> = {
  [EventStatus.PUBLISHED]: {
    bg: "var(--color-green-100)",
    bgLight: "var(--color-green-050)",
    text: "var(--color-green-700)",
    dot: "var(--color-green-500)",
  },
  [EventStatus.DRAFT]: {
    bg: "var(--color-yellow-100)",
    bgLight: "var(--color-yellow-050)",
    text: "var(--color-yellow-700)",
    dot: "var(--color-yellow-500)",
  },
  [EventStatus.COMPLETED]: {
    bg: "var(--color-grey-100)",
    bgLight: "var(--color-grey-050)",
    text: "var(--color-grey-600)",
    dot: "var(--color-grey-400)",
  },
  [EventStatus.CANCELLED]: {
    bg: "var(--color-red-100)",
    bgLight: "var(--color-red-050)",
    text: "var(--color-red-700)",
    dot: "var(--color-red-500)",
  },
  [EventStatus.ARCHIVED]: {
    bg: "var(--color-grey-200)",
    bgLight: "var(--color-grey-100)",
    text: "var(--color-grey-500)",
    dot: "var(--color-grey-300)",
  },
};

/**
 * Get status style for an event
 * Returns DRAFT style as fallback for unknown statuses
 */
export const getEventStatusStyle = (status: EventStatus): StatusStyle => {
  return eventStatusConfig[status] || eventStatusConfig[EventStatus.DRAFT];
};

/**
 * Event modality styling configuration
 */
export const eventModalityConfig = {
  presencial: {
    bg: "rgba(123, 176, 38, 0.3)",
    text: "var(--color-green-700)",
    icon: "var(--color-green-600)",
  },
  virtual: {
    bg: "rgba(44, 177, 188, 0.3)",
    text: "var(--color-cyan-700)",
    icon: "var(--color-cyan-600)",
  },
  hibrido: {
    bg: "rgba(240, 180, 41, 0.3)",
    text: "var(--color-yellow-700)",
    icon: "var(--color-yellow-600)",
  },
} as const;

export type EventModality = keyof typeof eventModalityConfig;

/**
 * Get modality style
 */
export const getModalityStyle = (modality: string) => {
  const key = modality.toLowerCase() as EventModality;
  return eventModalityConfig[key] || eventModalityConfig.presencial;
};

/**
 * Ticket status styling configuration
 */
export const ticketStatusConfig = {
  active: {
    bg: "var(--color-green-050)",
    text: "var(--color-green-700)",
  },
  inactive: {
    bg: "var(--color-grey-100)",
    text: "var(--color-grey-600)",
  },
  soldOut: {
    bg: "var(--color-red-050)",
    text: "var(--color-red-700)",
  },
} as const;

export type TicketStatus = keyof typeof ticketStatusConfig;

/**
 * Progress bar color based on percentage
 */
export const getProgressBarColor = (percentage: number): string => {
  if (percentage >= 100) return "var(--color-danger)";
  if (percentage >= 80) return "var(--color-warning)";
  return "var(--color-action)";
};

/**
 * Badge variants for general use
 */
export const badgeVariants = {
  default: {
    bg: "var(--color-grey-100)",
    text: "var(--color-grey-700)",
  },
  primary: {
    bg: "var(--color-red-050)",
    text: "var(--color-red-700)",
  },
  action: {
    bg: "var(--color-cyan-050)",
    text: "var(--color-cyan-700)",
  },
  success: {
    bg: "var(--color-green-050)",
    text: "var(--color-green-700)",
  },
  warning: {
    bg: "var(--color-yellow-100)",
    text: "var(--color-yellow-700)",
  },
  danger: {
    bg: "var(--color-red-100)",
    text: "var(--color-red-800)",
  },
  info: {
    bg: "var(--color-cyan-050)",
    text: "var(--color-cyan-700)",
  },
} as const;

export type BadgeVariant = keyof typeof badgeVariants;
