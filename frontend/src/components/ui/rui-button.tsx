import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  loadingText?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingText = 'Cargando...',
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    fontWeight: 600,
    borderRadius: '6px',
    border: 'none',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    opacity: disabled || isLoading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
  }

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: 'var(--space-2) var(--space-3)', fontSize: '14px' },
    md: { padding: 'var(--space-3) var(--space-4)', fontSize: '16px' },
    lg: { padding: 'var(--space-4) var(--space-6)', fontSize: '1.125rem' },
  }

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: '#F0B429',
      color: 'var(--color-grey-900)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 1px 3px rgba(39, 36, 29, 0.12), 0 1px 2px rgba(39, 36, 29, 0.1)',
    },
    secondary: {
      backgroundColor: 'var(--color-grey-100)',
      color: 'var(--color-grey-700)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 1px 3px rgba(39, 36, 29, 0.12), 0 1px 2px rgba(39, 36, 29, 0.1)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-grey-600)',
    },
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && variant === 'primary') {
      e.currentTarget.style.backgroundColor = '#F7C948'
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && variant === 'primary') {
      e.currentTarget.style.backgroundColor = '#F0B429'
      e.currentTarget.style.transform = ''
      e.currentTarget.style.boxShadow = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 1px 3px rgba(39, 36, 29, 0.12), 0 1px 2px rgba(39, 36, 29, 0.1)'
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && variant === 'primary') {
      e.currentTarget.style.backgroundColor = '#DE911D'
      e.currentTarget.style.transform = 'translateY(1px)'
      e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(39, 36, 29, 0.2)'
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && variant === 'primary') {
      e.currentTarget.style.backgroundColor = '#F7C948'
      e.currentTarget.style.transform = ''
      e.currentTarget.style.boxShadow = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 1px 3px rgba(39, 36, 29, 0.12), 0 1px 2px rgba(39, 36, 29, 0.1)'
    }
  }

  return (
    <button
      style={{ ...baseStyles, ...sizeStyles[size], ...variantStyles[variant], ...style }}
      disabled={disabled || isLoading}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {isLoading ? (
        <>
          <span style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite'
          }} />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
