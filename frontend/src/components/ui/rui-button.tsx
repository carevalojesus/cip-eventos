import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
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

// Colores de la paleta Refactoring UI
const colors = {
  red: {
    400: '#D64545',
    500: '#BA2525',
    600: '#A61B1B',
    700: '#911111',
  },
  grey: {
    50: '#FAF9F7',
    100: '#E8E6E1',
    200: '#D3CEC4',
    300: '#B8B2A7',
    700: '#504A40',
  },
  white: '#FFFFFF',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingText = 'Cargando...',
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

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
    md: { height: '36px', padding: '0 16px', fontSize: '14px' },
    lg: { height: '44px', padding: '0 24px', fontSize: '15px' },
  }

  const getVariantStyles = (): React.CSSProperties => {
    if (variant === 'primary') {
      return {
        backgroundColor: isPressed ? colors.red[700] : isHovered ? colors.red[600] : colors.red[500],
        color: colors.white,
        border: 'none',
        boxShadow: isPressed
          ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
          : isFocused
            ? `inset 0 1px 0 ${colors.red[400]}, 0 2px 6px rgba(145, 17, 17, 0.35)`
            : `inset 0 1px 0 ${colors.red[400]}, 0 1px 3px rgba(0,0,0,0.12)`,
      }
    }

    if (variant === 'secondary') {
      return {
        backgroundColor: isPressed ? colors.grey[100] : isHovered ? colors.grey[50] : colors.white,
        color: colors.grey[700],
        border: `1px solid ${isFocused ? colors.grey[300] : colors.grey[200]}`,
        boxShadow: isPressed
          ? 'inset 0 1px 2px rgba(0,0,0,0.06)'
          : isFocused
            ? '0 2px 4px rgba(0,0,0,0.1)'
            : '0 1px 2px rgba(0,0,0,0.05)',
      }
    }

    // ghost
    return {
      backgroundColor: isHovered || isFocused ? colors.grey[100] : 'transparent',
      color: colors.grey[700],
      border: 'none',
      boxShadow: 'none',
    }
  }

  const variantStyles = getVariantStyles()

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    borderRadius: '6px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: isDisabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    transform: isPressed && !isDisabled ? 'translateY(1px)' : 'none',
    outline: 'none',
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
          {loadingText}
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
