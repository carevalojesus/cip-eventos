/**
 * User Utilities - CIP Eventos
 *
 * Centralized user-related utility functions for consistent usage across the app.
 */

import type { User } from "@/services/users.service";

/**
 * Interface for user-like objects that have profile and name fields
 */
export interface UserLike {
  email: string;
  name?: string | null;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  } | null;
}

/**
 * Get full name from user object
 * Tries profile firstName + lastName first, then falls back to name field
 */
export const getFullName = (user: UserLike): string | null => {
  if (user.profile?.firstName || user.profile?.lastName) {
    return `${user.profile.firstName || ""} ${user.profile.lastName || ""}`.trim();
  }
  return user.name || null;
};

/**
 * Get display name - returns full name or email as fallback
 */
export const getDisplayName = (user: UserLike): string => {
  return getFullName(user) || user.email;
};

/**
 * Get user initials for avatar display
 * Priority: profile firstName + lastName > name field > email
 */
export const getInitials = (user: UserLike): string => {
  // Try profile first
  if (user.profile?.firstName && user.profile?.lastName) {
    return (user.profile.firstName[0] + user.profile.lastName[0]).toUpperCase();
  }
  if (user.profile?.firstName) {
    return user.profile.firstName[0].toUpperCase();
  }
  // Fall back to name field
  if (user.name) {
    const parts = user.name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }
  // Fall back to email
  return user.email[0].toUpperCase();
};

/**
 * Sort users by activity and status
 * Order: Active first, then verified, then by createdAt (most recent first)
 */
export const sortUsersByStatus = <T extends { isActive: boolean; isVerified: boolean; createdAt: string }>(
  users: T[]
): T[] => {
  return [...users].sort((a, b) => {
    // Active users first
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    // Then verified users
    if (a.isVerified !== b.isVerified) {
      return a.isVerified ? -1 : 1;
    }
    // Then by createdAt (most recent first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

/**
 * Check if user can perform action based on verification email timing
 * Used to prevent spam of verification emails
 */
export const canResendVerificationEmail = (
  sentAt: string | null,
  cooldownMinutes: number = 5
): boolean => {
  if (!sentAt) return true;
  const sentTime = new Date(sentAt).getTime();
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return now - sentTime >= cooldownMs;
};

/**
 * Get time remaining until verification email can be resent
 * Returns minutes remaining, or 0 if can send now
 */
export const getVerificationCooldownRemaining = (
  sentAt: string | null,
  cooldownMinutes: number = 5
): number => {
  if (!sentAt) return 0;
  const sentTime = new Date(sentAt).getTime();
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const elapsed = now - sentTime;
  if (elapsed >= cooldownMs) return 0;
  return Math.ceil((cooldownMs - elapsed) / (60 * 1000));
};

/**
 * Map of role names to friendly display names (Spanish fallback)
 * For i18n support, use t(`roles.${roleName}`) in components
 */
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SUPER_ADMIN: "Superadministrador",
  ORG_ADMIN: "Administrador",
  ORG_STAFF_ACCESO: "Staff de Acceso",
  ORG_STAFF_ACADEMICO: "Staff Académico",
  ORG_FINANZAS: "Finanzas",
  PONENTE: "Ponente",
  PARTICIPANTE: "Participante",
  ADMIN: "Administrador",
  USER: "Usuario",
  MODERATOR: "Moderador",
  ORGANIZER: "Organizador",
};

/**
 * Get friendly display name for a role
 * Falls back to the original name if not found in the map
 * For i18n support, use t(`roles.${roleName}`) directly in components
 */
export const getRoleDisplayName = (roleName: string | undefined | null): string => {
  if (!roleName) return "";
  return ROLE_DISPLAY_NAMES[roleName] || roleName;
};

/**
 * Generate a random avatar color based on user email
 * Returns a consistent color for the same email
 */
export const getAvatarColor = (email: string): string => {
  const colors = [
    "var(--color-cyan-500)",
    "var(--color-green-500)",
    "var(--color-yellow-500)",
    "var(--color-red-400)",
    "var(--color-cyan-600)",
    "var(--color-green-600)",
  ];

  // Simple hash based on email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

/**
 * Genera una contraseña segura aleatoria
 * @param length - Longitud de la contraseña (default: 12)
 * @param options - Opciones de caracteres a incluir
 * @returns Contraseña generada
 */
export const generatePassword = (
  length: number = 12,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}
): string => {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let chars = "";
  if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (numbers) chars += "0123456789";
  if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz0123456789";

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default {
  getFullName,
  getDisplayName,
  getInitials,
  sortUsersByStatus,
  canResendVerificationEmail,
  getVerificationCooldownRemaining,
  getRoleDisplayName,
  getAvatarColor,
  generatePassword,
};
