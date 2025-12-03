import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

/**
 * Button Component - Refactoring UI Design System
 *
 * Variantes:
 * - primary: Acción principal (rojo CIP) - alto contraste
 * - secondary: Acción secundaria (borde gris) - contraste medio
 * - ghost: Sin borde, solo hover - bajo énfasis
 * - outline: Borde primario sin relleno
 * - soft: Fondo suave con texto de color - para acciones de agregar/crear
 * - danger: Acciones destructivas (eliminar)
 *
 * Tamaños consistentes (altura fija):
 * - sm: 32px - botones compactos, acciones inline
 * - md: 36px - tamaño por defecto
 * - lg: 40px - botones prominentes, CTAs
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'soft' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

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

// Colores de la paleta Refactoring UI - Palette 06
const colors = {
  // Primary (Red) - Para marca CIP
  red: {
    50: '#FFEEEE',
    100: '#FACDCD',
    400: '#D64545',
    500: '#BA2525',
    600: '#A61B1B',
    700: '#911111',
  },
  // Neutrals (Warm Grey)
  grey: {
    50: '#FAF9F7',
    100: '#E8E6E1',
    200: '#D3CEC4',
    300: '#B8B2A7',
    500: '#857F72',
    700: '#504A40',
    900: '#27241D',
  },
  // Action (Cyan) - Para acciones, links, CTAs
  cyan: {
    50: '#E0FCFF',
    100: '#BEF8FD',
    400: '#38BEC9',
    500: '#2CB1BC',
    600: '#14919B',
    700: '#0E7C86',
  },
  white: '#FFFFFF',
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
      height: '32px',
      padding: '0 12px',
      fontSize: '13px',
      gap: '6px',
    },
    md: {
      height: '36px',
      padding: '0 14px',
      fontSize: '14px',
      gap: '6px',
    },
    lg: {
      height: '40px',
      padding: '0 16px',
      fontSize: '14px',
      gap: '8px',
    },
  }

  const getVariantStyles = (): React.CSSProperties => {
    // PRIMARY - Acción principal, alto contraste (4.5:1 mínimo)
    // Fondo: red-500, Texto: white
    if (variant === 'primary') {
      return {
        backgroundColor: isPressed
          ? colors.red[700]
          : isHovered
            ? colors.red[600]
            : colors.red[500],
        color: colors.white,
        border: 'none',
        boxShadow: isPressed
          ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
          : isFocused
            ? `0 0 0 3px rgba(186, 37, 37, 0.3)`
            : '0 1px 2px rgba(0,0,0,0.1)',
      }
    }

    // SECONDARY - Acción secundaria, contraste medio
    // Fondo: white, Borde: grey-200, Texto: grey-700
    if (variant === 'secondary') {
      return {
        backgroundColor: isPressed
          ? colors.grey[100]
          : isHovered
            ? colors.grey[50]
            : colors.white,
        color: colors.grey[700],
        border: `1px solid ${isFocused ? colors.grey[300] : colors.grey[200]}`,
        boxShadow: isPressed
          ? 'inset 0 1px 2px rgba(0,0,0,0.06)'
          : isFocused
            ? '0 0 0 3px rgba(184, 178, 167, 0.3)'
            : '0 1px 2px rgba(0,0,0,0.05)',
      }
    }

    // GHOST - Sin borde, bajo énfasis
    // Fondo: transparent, Texto: grey-700
    if (variant === 'ghost') {
      return {
        backgroundColor: isPressed
          ? colors.grey[200]
          : isHovered || isFocused
            ? colors.grey[100]
            : 'transparent',
        color: colors.grey[700],
        border: 'none',
        boxShadow: isFocused ? '0 0 0 3px rgba(184, 178, 167, 0.3)' : 'none',
      }
    }

    // OUTLINE - Borde primario sin relleno
    // Fondo: transparent, Borde: red-500, Texto: red-500
    if (variant === 'outline') {
      return {
        backgroundColor: isPressed
          ? colors.red[50]
          : isHovered
            ? 'rgba(186, 37, 37, 0.04)'
            : 'transparent',
        color: colors.red[500],
        border: `1px solid ${colors.red[500]}`,
        boxShadow: isFocused ? '0 0 0 3px rgba(186, 37, 37, 0.2)' : 'none',
      }
    }

    // SOFT - Fondo suave con texto de color (para agregar/crear)
    // Fondo: cyan-50, Texto: cyan-700 (contraste 4.5:1+)
    // Según Refactoring UI: usar el tono más oscuro del texto para contraste
    if (variant === 'soft') {
      return {
        backgroundColor: isPressed
          ? colors.cyan[100]
          : isHovered
            ? colors.cyan[100]
            : colors.cyan[50],
        color: colors.cyan[700], // cyan-700 sobre cyan-50 = ~5:1 contraste
        border: 'none',
        boxShadow: isFocused ? '0 0 0 3px rgba(44, 177, 188, 0.3)' : 'none',
      }
    }

    // DANGER - Acciones destructivas
    // Similar a soft pero en rojo
    if (variant === 'danger') {
      return {
        backgroundColor: isPressed
          ? colors.red[100]
          : isHovered
            ? colors.red[100]
            : colors.red[50],
        color: colors.red[700], // red-700 sobre red-50 = alto contraste
        border: 'none',
        boxShadow: isFocused ? '0 0 0 3px rgba(186, 37, 37, 0.2)' : 'none',
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
    ...sizeStyles[size],
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
