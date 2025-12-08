/**
 * Design Tokens - Refactoring UI Palette 06
 *
 * Centraliza todos los tokens de diseño para uso en componentes.
 * Siempre usa estas variables CSS en lugar de valores hardcodeados.
 *
 * @example
 * import { colors, shadows, rings } from '@/lib/design-tokens'
 *
 * const style = {
 *   backgroundColor: colors.primary,
 *   boxShadow: rings.primary,
 * }
 */

// ============================================
// PRIMARY COLORS - Red (Marca CIP)
// ============================================
export const red = {
  50: 'var(--color-red-050)',
  100: 'var(--color-red-100)',
  200: 'var(--color-red-200)',
  300: 'var(--color-red-300)',
  400: 'var(--color-red-400)',
  500: 'var(--color-red-500)',
  600: 'var(--color-red-600)',
  700: 'var(--color-red-700)',
  800: 'var(--color-red-800)',
  900: 'var(--color-red-900)',
} as const

// ============================================
// SECONDARY COLORS - Yellow (Vivid)
// ============================================
export const yellow = {
  50: 'var(--color-yellow-050)',
  100: 'var(--color-yellow-100)',
  200: 'var(--color-yellow-200)',
  300: 'var(--color-yellow-300)',
  400: 'var(--color-yellow-400)',
  500: 'var(--color-yellow-500)',
  600: 'var(--color-yellow-600)',
  700: 'var(--color-yellow-700)',
  800: 'var(--color-yellow-800)',
  900: 'var(--color-yellow-900)',
} as const

// ============================================
// NEUTRALS - Warm Grey
// ============================================
export const grey = {
  50: 'var(--color-grey-050)',
  100: 'var(--color-grey-100)',
  200: 'var(--color-grey-200)',
  300: 'var(--color-grey-300)',
  400: 'var(--color-grey-400)',
  500: 'var(--color-grey-500)',
  600: 'var(--color-grey-600)',
  700: 'var(--color-grey-700)',
  800: 'var(--color-grey-800)',
  900: 'var(--color-grey-900)',
} as const

// ============================================
// SUPPORTING - Cyan (Action)
// ============================================
export const cyan = {
  50: 'var(--color-cyan-050)',
  100: 'var(--color-cyan-100)',
  200: 'var(--color-cyan-200)',
  300: 'var(--color-cyan-300)',
  400: 'var(--color-cyan-400)',
  500: 'var(--color-cyan-500)',
  600: 'var(--color-cyan-600)',
  700: 'var(--color-cyan-700)',
  800: 'var(--color-cyan-800)',
  900: 'var(--color-cyan-900)',
} as const

// ============================================
// SUPPORTING - Green (Success)
// ============================================
export const green = {
  50: 'var(--color-green-050)',
  100: 'var(--color-green-100)',
  200: 'var(--color-green-200)',
  300: 'var(--color-green-300)',
  400: 'var(--color-green-400)',
  500: 'var(--color-green-500)',
  600: 'var(--color-green-600)',
  700: 'var(--color-green-700)',
  800: 'var(--color-green-800)',
  900: 'var(--color-green-900)',
} as const

// ============================================
// SEMANTIC COLORS
// ============================================
export const colors = {
  // Brand
  primary: 'var(--color-primary)',
  primaryLight: 'var(--color-primary-light)',
  primaryDark: 'var(--color-primary-dark)',

  // Actions
  action: 'var(--color-action)',
  actionLight: 'var(--color-action-light)',
  actionDark: 'var(--color-action-dark)',

  // Accent
  accent: 'var(--color-accent)',
  accentLight: 'var(--color-accent-light)',
  accentDark: 'var(--color-accent-dark)',

  // States
  success: 'var(--color-success)',
  successLight: 'var(--color-success-light)',
  successDark: 'var(--color-success-dark)',

  info: 'var(--color-info)',
  infoLight: 'var(--color-info-light)',
  infoDark: 'var(--color-info-dark)',

  warning: 'var(--color-warning)',
  warningLight: 'var(--color-warning-light)',
  warningDark: 'var(--color-warning-dark)',

  danger: 'var(--color-danger)',
  dangerLight: 'var(--color-danger-light)',
  dangerDark: 'var(--color-danger-dark)',

  // Basics
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

// ============================================
// TEXT COLORS
// ============================================
export const text = {
  primary: 'var(--color-text-primary)',
  secondary: 'var(--color-text-secondary)',
  muted: 'var(--color-text-muted)',
  tertiary: 'var(--color-text-tertiary)',
  placeholder: 'var(--color-text-placeholder)',
  inverse: 'var(--color-text-inverse)',
} as const

// ============================================
// BACKGROUND COLORS
// ============================================
export const bg = {
  primary: 'var(--color-bg-primary)',
  secondary: 'var(--color-bg-secondary)',
  tertiary: 'var(--color-bg-tertiary)',
  form: 'var(--color-bg-form)',
  overlay: 'var(--color-overlay)',
} as const

// ============================================
// BORDER COLORS
// ============================================
export const border = {
  light: 'var(--color-border-light)',
  default: 'var(--color-border-default)',
  focus: 'var(--color-border-focus)',
} as const

// ============================================
// FOCUS RINGS
// ============================================
export const rings = {
  primary: 'var(--ring-primary)',
  neutral: 'var(--ring-neutral)',
  action: 'var(--ring-action)',
  danger: 'var(--ring-danger)',
  success: 'var(--ring-success)',
  none: 'none',
} as const

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  ml: 'var(--shadow-ml)',
  modal: 'var(--shadow-modal)',
  dropdown: 'var(--shadow-dropdown)',
  warm: 'var(--shadow-sm-warm)',
  success: 'var(--shadow-success)',
  warning: 'var(--shadow-warning)',
  // Button-specific shadows
  buttonDefault: '0 1px 2px rgba(0,0,0,0.1)',
  buttonPressed: 'inset 0 2px 4px rgba(0,0,0,0.2)',
  buttonSecondary: '0 1px 2px rgba(0,0,0,0.05)',
  buttonSecondaryPressed: 'inset 0 1px 2px rgba(0,0,0,0.06)',
  inputInset: 'inset 0 2px 4px rgba(39, 36, 29, 0.06)',
  none: 'none',
} as const

// ============================================
// INTERACTIVE STATES
// ============================================
export const states = {
  hover: {
    primary: 'var(--color-hover-primary)',
    neutral: 'var(--color-hover-neutral)',
    action: 'var(--color-hover-action)',
  },
  pressed: {
    primary: 'var(--color-pressed-primary)',
    neutral: 'var(--color-pressed-neutral)',
    action: 'var(--color-pressed-action)',
  },
} as const

// ============================================
// BADGE COLORS
// ============================================
export const badge = {
  success: {
    bg: 'var(--color-badge-success-bg)',
    text: 'var(--color-badge-success-text)',
  },
  warning: {
    bg: 'var(--color-badge-warning-bg)',
    text: 'var(--color-badge-warning-text)',
  },
  info: {
    bg: 'var(--color-badge-info-bg)',
    text: 'var(--color-badge-info-text)',
  },
  danger: {
    bg: 'var(--color-badge-danger-bg)',
    text: 'var(--color-badge-danger-text)',
  },
  neutral: {
    bg: 'var(--color-badge-neutral-bg)',
    text: 'var(--color-badge-neutral-text)',
  },
} as const

// ============================================
// SPACING
// ============================================
export const spacing = {
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
} as const

// ============================================
// BORDER RADIUS
// ============================================
export const radius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const

// ============================================
// BUTTON HEIGHTS
// ============================================
export const buttonHeight = {
  sm: 'var(--button-height-sm)',
  md: 'var(--button-height-md)',
  lg: 'var(--button-height-lg)',
  xl: 'var(--button-height-xl)',
} as const

// ============================================
// TRANSITIONS
// ============================================
export const transitions = {
  fast: 'var(--transition-fast)',
  normal: 'var(--transition-normal)',
  slow: 'var(--transition-slow)',
} as const

// ============================================
// TYPOGRAPHY
// ============================================
export const fontSize = {
  xs: 'var(--font-size-xs)',
  sm: 'var(--font-size-sm)',
  base: 'var(--font-size-base)',
  lg: 'var(--font-size-lg)',
  xl: 'var(--font-size-xl)',
  '2xl': 'var(--font-size-2xl)',
  '3xl': 'var(--font-size-3xl)',
  '4xl': 'var(--font-size-4xl)',
} as const

export const fontWeight = {
  normal: 'var(--font-weight-normal)',
  medium: 'var(--font-weight-medium)',
  semibold: 'var(--font-weight-semibold)',
  bold: 'var(--font-weight-bold)',
} as const

export const lineHeight = {
  tight: 'var(--line-height-tight)',
  normal: 'var(--line-height-normal)',
  relaxed: 'var(--line-height-relaxed)',
} as const

// ============================================
// COMBINED EXPORT
// ============================================
export const tokens = {
  red,
  yellow,
  grey,
  cyan,
  green,
  colors,
  text,
  bg,
  border,
  rings,
  shadows,
  states,
  badge,
  spacing,
  radius,
  buttonHeight,
  transitions,
  fontSize,
  fontWeight,
  lineHeight,
} as const

export default tokens
