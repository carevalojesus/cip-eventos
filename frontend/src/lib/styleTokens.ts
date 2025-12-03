/**
 * Style Tokens - Refactoring UI Design System
 *
 * Centralized design tokens for consistent styling across all components.
 * Use these instead of hardcoded values.
 *
 * @example
 * import { tokens, styles } from '@/lib/styleTokens';
 *
 * const myStyle = {
 *   padding: tokens.spacing.md,
 *   borderRadius: tokens.radius.lg,
 *   fontSize: tokens.fontSize.base,
 * };
 */

// ============================================
// COLOR TOKENS
// ============================================

export const colors = {
  // Primary (Red) - CIP Brand
  red: {
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
  },

  // Neutrals (Warm Grey)
  grey: {
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
  },

  // Cyan (Action color)
  cyan: {
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
  },

  // Green (Success)
  green: {
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
  },

  // Yellow (Warning)
  yellow: {
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
  },
} as const;

// Semantic color aliases
export const semanticColors = {
  // Brand
  primary: 'var(--color-primary)',
  primaryLight: 'var(--color-primary-light)',
  primaryDark: 'var(--color-primary-dark)',

  // Actions (CTAs, links, buttons)
  action: 'var(--color-action)',
  actionLight: 'var(--color-action-light)',
  actionDark: 'var(--color-action-dark)',

  // States
  success: 'var(--color-success)',
  successLight: 'var(--color-success-light)',
  successDark: 'var(--color-success-dark)',

  warning: 'var(--color-warning)',
  warningLight: 'var(--color-warning-light)',
  warningDark: 'var(--color-warning-dark)',

  danger: 'var(--color-danger)',
  dangerLight: 'var(--color-danger-light)',
  dangerDark: 'var(--color-danger-dark)',

  info: 'var(--color-info)',
  infoLight: 'var(--color-info-light)',
  infoDark: 'var(--color-info-dark)',

  // Text
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-muted)',
  textPlaceholder: 'var(--color-text-placeholder)',
  textInverse: 'var(--color-text-inverse)',

  // Backgrounds
  bgPrimary: 'var(--color-bg-primary)',
  bgSecondary: 'var(--color-bg-secondary)',
  bgTertiary: 'var(--color-bg-tertiary)',
  bgForm: 'var(--color-bg-form)',
  overlay: 'var(--color-overlay)',

  // Borders
  borderLight: 'var(--color-border-light)',
  borderDefault: 'var(--color-border-default)',
  borderFocus: 'var(--color-border-focus)',
} as const;

// ============================================
// SPACING TOKENS
// ============================================

export const spacing = {
  /** 4px - Micro spacing */
  xs: 'var(--space-1)',
  /** 8px - Small gaps */
  sm: 'var(--space-2)',
  /** 12px - Medium-small */
  md: 'var(--space-3)',
  /** 16px - Standard */
  lg: 'var(--space-4)',
  /** 20px - Large */
  xl: 'var(--space-5)',
  /** 24px - Extra large */
  '2xl': 'var(--space-6)',
  /** 32px - Section spacing */
  '3xl': 'var(--space-8)',
  /** 40px */
  '4xl': 'var(--space-10)',
  /** 48px */
  '5xl': 'var(--space-12)',
  /** 64px - Page spacing */
  '6xl': 'var(--space-16)',

  // Numeric values (for calculations)
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
} as const;

// ============================================
// BORDER RADIUS TOKENS
// ============================================

export const radius = {
  /** 4px - Small elements */
  sm: 'var(--radius-sm)',
  /** 6px - Default */
  md: 'var(--radius-md)',
  /** 8px - Cards, inputs */
  lg: 'var(--radius-lg)',
  /** 12px - Large cards, modals */
  xl: 'var(--radius-xl)',
  /** 9999px - Pills, avatars */
  full: 'var(--radius-full)',
} as const;

// ============================================
// SHADOW TOKENS
// ============================================

export const shadows = {
  /** Subtle elevation */
  sm: 'var(--shadow-sm)',
  /** Default elevation */
  md: 'var(--shadow-md)',
  /** High elevation */
  lg: 'var(--shadow-lg)',
  /** No shadow */
  none: 'none',
} as const;

// ============================================
// TYPOGRAPHY TOKENS
// ============================================

export const fontSize = {
  /** 12px - Badges, captions */
  xs: 'var(--font-size-xs)',
  /** 14px - Small text, labels */
  sm: 'var(--font-size-sm)',
  /** 16px - Body text */
  base: 'var(--font-size-base)',
  /** 18px - Lead text */
  lg: 'var(--font-size-lg)',
  /** 20px - h4, card titles */
  xl: 'var(--font-size-xl)',
  /** 24px - h3, page titles */
  '2xl': 'var(--font-size-2xl)',
  /** 30px - h2 */
  '3xl': 'var(--font-size-3xl)',
  /** 36px - h1 */
  '4xl': 'var(--font-size-4xl)',
} as const;

export const fontWeight = {
  normal: 'var(--font-weight-normal)',
  medium: 'var(--font-weight-medium)',
  semibold: 'var(--font-weight-semibold)',
  bold: 'var(--font-weight-bold)',
} as const;

export const lineHeight = {
  tight: 'var(--line-height-tight)',
  normal: 'var(--line-height-normal)',
  relaxed: 'var(--line-height-relaxed)',
} as const;

// ============================================
// BUTTON TOKENS
// ============================================

export const buttonHeight = {
  /** 32px - Compact buttons */
  sm: 'var(--button-height-sm)',
  /** 36px - Standard */
  md: 'var(--button-height-md)',
  /** 40px - Prominent */
  lg: 'var(--button-height-lg)',
  /** 44px - Touch targets */
  xl: 'var(--button-height-xl)',
} as const;

// ============================================
// TRANSITION TOKENS
// ============================================

export const transition = {
  /** 150ms - Fast interactions */
  fast: 'var(--transition-fast)',
  /** 200ms - Standard */
  normal: 'var(--transition-normal)',
  /** 300ms - Complex animations */
  slow: 'var(--transition-slow)',
} as const;

// ============================================
// Z-INDEX TOKENS
// ============================================

export const zIndex = {
  /** Behind everything */
  behind: -1,
  /** Default layer */
  base: 0,
  /** Dropdowns */
  dropdown: 10,
  /** Sticky elements */
  sticky: 20,
  /** Fixed elements */
  fixed: 30,
  /** Sidebar overlay */
  sidebarOverlay: 40,
  /** Sidebar */
  sidebar: 50,
  /** Modal backdrop */
  modalBackdrop: 60,
  /** Modal content */
  modal: 70,
  /** Popover */
  popover: 80,
  /** Tooltip */
  tooltip: 90,
  /** Toast notifications */
  toast: 100,
} as const;

// ============================================
// ICON SIZE TOKENS
// ============================================

export const iconSize = {
  /** 12px - Inline icons */
  xs: 12,
  /** 16px - Small icons */
  sm: 16,
  /** 20px - Default */
  md: 20,
  /** 24px - Large */
  lg: 24,
  /** 32px - Extra large */
  xl: 32,
  /** 48px - Decorative */
  '2xl': 48,
} as const;

// ============================================
// COMBINED TOKENS OBJECT
// ============================================

export const tokens = {
  colors,
  semanticColors,
  spacing,
  radius,
  shadows,
  fontSize,
  fontWeight,
  lineHeight,
  buttonHeight,
  transition,
  zIndex,
  iconSize,
} as const;

// ============================================
// COMMON STYLE PATTERNS
// ============================================

/**
 * Pre-built style patterns for common UI elements
 */
export const styles = {
  /** Base card style */
  card: {
    padding: spacing.xl,
    backgroundColor: semanticColors.bgPrimary,
    border: `1px solid ${semanticColors.borderLight}`,
    borderRadius: radius.xl,
    boxShadow: shadows.sm,
  } as React.CSSProperties,

  /** Card with hover effect */
  cardInteractive: {
    padding: spacing.xl,
    backgroundColor: semanticColors.bgPrimary,
    border: `1px solid ${semanticColors.borderLight}`,
    borderRadius: radius.xl,
    boxShadow: shadows.sm,
    cursor: 'pointer',
    transition: `box-shadow ${transition.fast}, transform ${transition.fast}`,
  } as React.CSSProperties,

  /** Section title */
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: 600,
    color: semanticColors.textPrimary,
    margin: 0,
  } as React.CSSProperties,

  /** Page title */
  pageTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: 600,
    color: semanticColors.textPrimary,
    margin: 0,
    lineHeight: lineHeight.tight,
  } as React.CSSProperties,

  /** Body text */
  bodyText: {
    fontSize: fontSize.base,
    color: semanticColors.textSecondary,
    lineHeight: lineHeight.normal,
  } as React.CSSProperties,

  /** Small/muted text */
  mutedText: {
    fontSize: fontSize.sm,
    color: semanticColors.textMuted,
  } as React.CSSProperties,

  /** Flex row with gap */
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  } as React.CSSProperties,

  /** Flex column with gap */
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  } as React.CSSProperties,

  /** Empty state container */
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing['6xl']} ${spacing['3xl']}`,
    backgroundColor: semanticColors.bgPrimary,
    borderRadius: radius.xl,
    border: `1px dashed ${semanticColors.borderLight}`,
  } as React.CSSProperties,

  /** Focus ring */
  focusRing: {
    outline: 'none',
    boxShadow: `0 0 0 3px ${colors.grey[100]}`,
  } as React.CSSProperties,
} as const;

export default tokens;
