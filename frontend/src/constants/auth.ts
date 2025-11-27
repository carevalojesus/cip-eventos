/**
 * Authentication and Login Configuration
 * Centralized constants for the login page
 */

// Environment variables
export const ASSETS_URL = import.meta.env.PUBLIC_ASSETS_URL || '';

// Asset paths
export const AUTH_ASSETS = {
  background: `${ASSETS_URL}/avatars/background-cip.webp`,
  logo: `${ASSETS_URL}/avatars/cip.svg`,
} as const;

// Routes
export const AUTH_ROUTES = {
  login: '/login',
  admin: '/admin',
  forgotPassword: '/forgot-password',
} as const;
