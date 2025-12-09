import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { colors, rings, shadows } from '@/lib/styleTokens'

type InputSize = 'sm' | 'md' | 'lg' | 'xl'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  inputSize?: InputSize
  showPasswordToggle?: boolean
  showPasswordLabel?: string
  hidePasswordLabel?: string
}

const sizeConfig: Record<InputSize, { height: string; fontSize: string }> = {
  sm: { height: 'var(--button-height-sm)', fontSize: '13px' },
  md: { height: 'var(--button-height-md)', fontSize: '14px' },
  lg: { height: 'var(--button-height-lg)', fontSize: '14px' },
  xl: { height: 'var(--button-height-xl)', fontSize: '15px' },
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  inputSize = 'md',
  showPasswordToggle = false,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
  id,
  className = '',
  style,
  type,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)

  const inputId = id || props.name
  const errorId = error ? `${inputId}-error` : undefined
  const { height, fontSize } = sizeConfig[inputSize]

  const shouldShowToggle = showPasswordToggle && type === 'password'
  const actualType = shouldShowToggle && showPassword ? 'text' : type

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    width: '100%',
  }

  const labelStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-grey-700)',
    lineHeight: 1.5,
  }

  const inputWrapperStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    height,
    padding: '0 var(--space-4)',
    paddingLeft: leftIcon ? 'var(--space-10)' : 'var(--space-4)',
    paddingRight: (rightIcon || shouldShowToggle) ? 'var(--space-10)' : 'var(--space-4)',
    fontSize,
    color: 'var(--color-grey-900)',
    backgroundColor: colors.white,
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-grey-200)'}`,
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    boxShadow: shadows.inputInset,
  }

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-grey-400)',
    pointerEvents: 'none',
  }

  const toggleButtonStyles: React.CSSProperties = {
    position: 'absolute',
    right: 'var(--space-3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: 'var(--color-grey-400)',
    transition: 'color 150ms ease',
  }

  const hintStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: error ? 'var(--color-danger)' : 'var(--color-grey-500)',
  }

  return (
    <div style={{ ...containerStyles, ...style }} className={className}>
      {label && (
        <label htmlFor={inputId} style={labelStyles}>
          {label}
        </label>
      )}

      <div style={inputWrapperStyles}>
        {leftIcon && (
          <span style={{ ...iconStyles, left: 'var(--space-3)' }}>
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={actualType}
          style={inputStyles}
          aria-invalid={!!error}
          aria-describedby={errorId}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-grey-300)'
              e.currentTarget.style.boxShadow = rings.neutral
            }
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-grey-200)'
              e.currentTarget.style.boxShadow = shadows.inputInset
            }
            props.onBlur?.(e)
          }}
          {...props}
        />

        {shouldShowToggle ? (
          <button
            type="button"
            style={toggleButtonStyles}
            onClick={() => setShowPassword(!showPassword)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-grey-600)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-grey-400)'
            }}
            aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
            tabIndex={-1}
          >
            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        ) : rightIcon ? (
          <span style={{ ...iconStyles, right: 'var(--space-3)' }}>
            {rightIcon}
          </span>
        ) : null}
      </div>

      {(error || hint) && (
        <span id={errorId} style={hintStyles}>
          {error || hint}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'
