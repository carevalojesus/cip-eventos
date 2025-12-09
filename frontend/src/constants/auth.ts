/**
 * Authentication and Login Configuration
 * Centralized constants for the login page
 */

// Environment variables
export const ASSETS_URL = import.meta.env.PUBLIC_ASSETS_URL || '';

// Asset paths
export const AUTH_ASSETS = {
  background: '/images/auth/hero.webp',
  logo: '/images/auth/logo-cip.svg',
} as const;

// Routes
export const AUTH_ROUTES = {
  login: '/login',
  admin: '/admin',
  forgotPassword: '/forgot-password',
} as const;
