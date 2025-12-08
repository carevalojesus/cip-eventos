import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { red, grey, cyan, colors, rings, shadows } from '@/lib/design-tokens'

/**
 * Button Component - Refactoring UI Design System
 *
 * Variantes:
 * - primary: Identidad de marca CIP (rojo) - para acciones de alta jerarquía
 * - secondary: Acción secundaria (borde gris) - contraste medio
 * - ghost: Sin borde, solo hover - bajo énfasis
 * - outline: Borde primario sin relleno
 * - soft: Fondo suave con texto de color - para acciones de crear/agregar (cyan)
 * - danger: Acciones destructivas (eliminar)
 * - icon: Botones cuadrados solo para iconos - aspecto ghost
 *
 * Tamaños consistentes (altura fija):
 * - sm: 32px - botones compactos, acciones inline (icon: 32x32px)
 * - md: 36px - tamaño por defecto (icon: 36x36px)
 * - lg: 40px - botones prominentes, CTAs (icon: 40x40px)
 * - xl: 44px - botones extra grandes (icon: 44x44px - touch target)
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'soft' | 'danger' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  loadingText?: string
  loadingAriaLabel?: string
  icon?: ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingText,
  loadingAriaLabel = 'Loading',
  icon,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isDisabled = disabled || isLoading

  // Tamaños consistentes según Refactoring UI
  // Altura fija para alineación visual
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      height: 'var(--button-height-sm)',
      padding: '0 12px',
      fontSize: '13px',
      gap: '6px',
    },
    md: {
      height: 'var(--button-height-md)',
      padding: '0 14px',
      fontSize: '14px',
      gap: '6px',
    },
    lg: {
      height: 'var(--button-height-lg)',
      padding: '0 16px',
      fontSize: '14px',
      gap: '8px',
    },
    xl: {
      height: 'var(--button-height-xl)',
      padding: '0 18px',
      fontSize: '15px',
      gap: '8px',
    },
  }

  // Icon-only button sizing (square buttons)
  const iconSizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      width: 'var(--button-height-sm)',
      height: 'var(--button-height-sm)',
      padding: 0,
      fontSize: '16px',
    },
    md: {
      width: 'var(--button-height-md)',
      height: 'var(--button-height-md)',
      padding: 0,
      fontSize: '18px',
    },
    lg: {
      width: 'var(--button-height-lg)',
      height: 'var(--button-height-lg)',
      padding: 0,
      fontSize: '20px',
    },
    xl: {
      width: 'var(--button-height-xl)',
      height: 'var(--button-height-xl)',
      padding: 0,
      fontSize: '22px',
    },
  }

  const getVariantStyles = (): React.CSSProperties => {
    // PRIMARY - Identidad de marca CIP, alto contraste (4.5:1 mínimo)
    // Fondo: red-500, Texto: white
    if (variant === 'primary') {
      return {
        backgroundColor: isPressed
          ? red[700]
          : isHovered
            ? red[600]
            : red[500],
        color: colors.white,
        border: 'none',
        boxShadow: isPressed
          ? shadows.buttonPressed
          : isFocused
            ? rings.primary
            : shadows.buttonDefault,
      }
    }

    // SECONDARY - Acción secundaria, contraste medio
    // Fondo: white, Borde: grey-200, Texto: grey-700
    if (variant === 'secondary') {
      return {
        backgroundColor: isPressed
          ? grey[100]
          : isHovered
            ? grey[50]
            : colors.white,
        color: grey[700],
        border: `1px solid ${isFocused ? grey[300] : grey[200]}`,
        boxShadow: isPressed
          ? shadows.buttonSecondaryPressed
          : isFocused
            ? rings.neutral
            : shadows.buttonSecondary,
      }
    }

    // GHOST - Sin borde, bajo énfasis
    // Fondo: transparent, Texto: grey-700
    if (variant === 'ghost') {
      return {
        backgroundColor: isPressed
          ? grey[200]
          : isHovered || isFocused
            ? grey[100]
            : colors.transparent,
        color: grey[700],
        border: 'none',
        boxShadow: isFocused ? rings.neutral : shadows.none,
      }
    }

    // OUTLINE - Borde primario sin relleno
    // Fondo: transparent, Borde: red-500, Texto: red-500
    if (variant === 'outline') {
      return {
        backgroundColor: isPressed
          ? red[50]
          : isHovered
            ? 'var(--color-hover-primary)'
            : colors.transparent,
        color: red[500],
        border: `1px solid ${red[500]}`,
        boxShadow: isFocused ? rings.primary : shadows.none,
      }
    }

    // SOFT - Fondo suave con texto de color (para agregar/crear)
    // Fondo: cyan-50, Texto: cyan-700 (contraste 4.5:1+)
    // Según Refactoring UI: usar el tono más oscuro del texto para contraste
    if (variant === 'soft') {
      return {
        backgroundColor: isPressed
          ? cyan[100]
          : isHovered
            ? cyan[100]
            : cyan[50],
        color: cyan[700], // cyan-700 sobre cyan-50 = ~5:1 contraste
        border: 'none',
        boxShadow: isFocused ? rings.action : shadows.none,
      }
    }

    // DANGER - Acciones destructivas
    // Similar a soft pero en rojo
    if (variant === 'danger') {
      return {
        backgroundColor: isPressed
          ? red[100]
          : isHovered
            ? red[100]
            : red[50],
        color: red[700], // red-700 sobre red-50 = alto contraste
        border: 'none',
        boxShadow: isFocused ? rings.danger : shadows.none,
      }
    }

    // ICON - Icon-only buttons (ghost style)
    // Square buttons with icon centered, ghost-like appearance
    if (variant === 'icon') {
      return {
        backgroundColor: isPressed
          ? grey[200]
          : isHovered || isFocused
            ? grey[100]
            : colors.transparent,
        color: grey[700],
        border: 'none',
        boxShadow: isFocused ? rings.neutral : shadows.none,
      }
    }

    return {}
  }

  const variantStyles = getVariantStyles()

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: '6px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    opacity: isDisabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    transform: isPressed && !isDisabled ? 'translateY(1px)' : 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    // Use icon-specific sizing for icon variant, otherwise use standard sizing
    ...(variant === 'icon' ? iconSizeStyles[size] : sizeStyles[size]),
    ...variantStyles,
    ...style,
  }

  return (
    <button
      style={baseStyles}
      disabled={isDisabled}
      className={className}
      aria-busy={isLoading}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => !isDisabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onFocus={() => !isDisabled && setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            style={{
              width: '1em',
              height: '1em',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
            aria-label={loadingAriaLabel}
          />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}
