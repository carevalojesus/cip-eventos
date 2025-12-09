/**
 * Style Tokens - Refactoring UI Design System
 *
 * Archivo único y consolidado de tokens de diseño.
 * Centraliza todos los tokens para uso consistente en componentes.
 *
 * @example
 * import { colors, semanticColors, spacing, shadows } from '@/lib/styleTokens';
 *
 * const style = {
 *   backgroundColor: colors.cyan[50],
 *   color: semanticColors.textPrimary,
 *   padding: spacing.lg,
 *   boxShadow: shadows.sm,
 * };
 */

// ============================================
// COLOR PALETTES
// ============================================

/** Primary (Red) - CIP Brand Identity */
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
} as const;

/** Secondary Accent (Yellow Vivid) - Highlights, warnings */
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
} as const;

/** Neutrals (Warm Grey) - Text, backgrounds, borders */
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
} as const;

/** Supporting (Cyan) - Action color for CTAs */
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
} as const;

/** Supporting (Green Lime) - Success states */
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
} as const;

/** All color palettes grouped */
export const colors = {
  red,
  yellow,
  grey,
  cyan,
  green,
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ============================================
// SEMANTIC COLORS
// ============================================

export const semanticColors = {
  // Brand
  primary: 'var(--color-primary)',
  primaryLight: 'var(--color-primary-light)',
  primaryDark: 'var(--color-primary-dark)',

  // Actions (CTAs, links, buttons)
  action: 'var(--color-action)',
  actionLight: 'var(--color-action-light)',
  actionDark: 'var(--color-action-dark)',

  // Accent (highlights, decorative)
  accent: 'var(--color-accent)',
  accentLight: 'var(--color-accent-light)',
  accentDark: 'var(--color-accent-dark)',

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
  textTertiary: 'var(--color-text-tertiary)',
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

  // Numeric aliases (for calculations)
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
// CARD PADDING TOKENS
// ============================================

export const cardPadding = {
  /** 16px - Compact cards for summaries, sidebar */
  compact: 'var(--card-padding-compact)',
  /** 20px - Standard default cards */
  standard: 'var(--card-padding-standard)',
  /** 24px - Spacious cards for forms, dialogs */
  spacious: 'var(--card-padding-spacious)',
} as const;

// ============================================
// FORM SPACING TOKENS
// ============================================

export const formSpacing = {
  /** 16px - Gap between form fields */
  fieldGap: 'var(--form-field-gap)',
  /** 16px - Gap between columns in a row */
  rowGap: 'var(--form-row-gap)',
  /** 24px - Gap between form sections */
  sectionGap: 'var(--form-section-gap)',
  /** 8px - Gap between label and input */
  labelGap: 'var(--form-label-gap)',
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
  /** Medium-large elevation */
  ml: 'var(--shadow-ml)',
  /** Modal/dialog elevation */
  modal: 'var(--shadow-modal)',
  /** Dropdown elevation */
  dropdown: 'var(--shadow-dropdown)',
  /** Warm subtle shadow */
  smWarm: 'var(--shadow-sm-warm)',
  /** Success colored shadow */
  success: 'var(--shadow-success)',
  /** Warning colored shadow */
  warning: 'var(--shadow-warning)',
  /** Action colored shadow */
  action: 'var(--shadow-action)',
  /** Danger colored shadow */
  danger: 'var(--shadow-danger)',
  /** Button default shadow */
  buttonDefault: '0 1px 2px rgba(0,0,0,0.1)',
  /** Button pressed shadow */
  buttonPressed: 'inset 0 2px 4px rgba(0,0,0,0.2)',
  /** Secondary button shadow */
  buttonSecondary: '0 1px 2px rgba(0,0,0,0.05)',
  /** Secondary button pressed shadow */
  buttonSecondaryPressed: 'inset 0 1px 2px rgba(0,0,0,0.06)',
  /** Input inset shadow */
  inputInset: 'inset 0 2px 4px rgba(39, 36, 29, 0.06)',
  /** No shadow */
  none: 'none',
} as const;

// ============================================
// FOCUS RINGS
// ============================================

export const rings = {
  primary: 'var(--ring-primary)',
  neutral: 'var(--ring-neutral)',
  action: 'var(--ring-action)',
  accent: 'var(--ring-accent)',
  warning: 'var(--ring-warning)',
  danger: 'var(--ring-danger)',
  success: 'var(--ring-success)',
  info: 'var(--ring-info)',
  none: 'none',
} as const;

// ============================================
// INTERACTIVE STATES
// ============================================

export const states = {
  hover: {
    primary: 'var(--color-hover-primary)',
    neutral: 'var(--color-hover-neutral)',
    action: 'var(--color-hover-action)',
    accent: 'var(--color-hover-accent)',
  },
  pressed: {
    primary: 'var(--color-pressed-primary)',
    neutral: 'var(--color-pressed-neutral)',
    action: 'var(--color-pressed-action)',
    accent: 'var(--color-pressed-accent)',
  },
  disabled: {
    bg: 'var(--color-disabled-bg)',
    text: 'var(--color-disabled-text)',
    border: 'var(--color-disabled-border)',
  },
} as const;

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
  accent: {
    bg: 'var(--color-badge-accent-bg)',
    text: 'var(--color-badge-accent-text)',
  },
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
  /** 48px - Hero headlines */
  '5xl': 'var(--font-size-5xl)',
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

export const letterSpacing = {
  /** -0.05em - Extra tight (large headings) */
  tighter: 'var(--letter-spacing-tighter)',
  /** -0.025em - Tight (headings) */
  tight: 'var(--letter-spacing-tight)',
  /** 0 - Normal */
  normal: 'var(--letter-spacing-normal)',
  /** 0.025em - Wide (uppercase text) */
  wide: 'var(--letter-spacing-wide)',
  /** 0.05em - Wider (small uppercase) */
  wider: 'var(--letter-spacing-wider)',
  /** 0.1em - Widest (emphasis) */
  widest: 'var(--letter-spacing-widest)',
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
// Z-INDEX SCALE (Unified with global.css)
// Uses numeric values matching CSS variables for inline styles
// CSS Variables: --z-dropdown (1000), --z-sticky (1100), etc.
// ============================================

export const zIndex = {
  /** Behind everything */
  behind: -1,
  /** Default layer (--z-base) */
  base: 0,
  /** Dropdowns (--z-dropdown: 1000) */
  dropdown: 1000,
  /** Sticky elements (--z-sticky: 1100) */
  sticky: 1100,
  /** Modal backdrop (--z-modal-backdrop: 1200) */
  modalBackdrop: 1200,
  /** Modal content (--z-modal: 1300) */
  modal: 1300,
  /** Popover (--z-popover: 1400) */
  popover: 1400,
  /** Tooltip (--z-tooltip: 1500) */
  tooltip: 1500,
  /** Toast notifications (--z-toast: 1600) */
  toast: 1600,
} as const;

/** CSS variable references for use in className strings */
export const zIndexVars = {
  base: 'var(--z-base)',
  dropdown: 'var(--z-dropdown)',
  sticky: 'var(--z-sticky)',
  modalBackdrop: 'var(--z-modal-backdrop)',
  modal: 'var(--z-modal)',
  popover: 'var(--z-popover)',
  tooltip: 'var(--z-tooltip)',
  toast: 'var(--z-toast)',
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
  red,
  yellow,
  grey,
  cyan,
  green,
  semanticColors,
  spacing,
  cardPadding,
  formSpacing,
  radius,
  shadows,
  rings,
  states,
  badge,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  buttonHeight,
  transition,
  zIndex,
  zIndexVars,
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
    boxShadow: rings.neutral,
  } as React.CSSProperties,
} as const;

export default tokens;
