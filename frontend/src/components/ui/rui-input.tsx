import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  className = '',
  style,
  ...props
}, ref) => {
  const inputId = id || props.name

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    width: '100%',
  }

  const labelStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--color-grey-700)',
  }

  const inputWrapperStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    paddingLeft: leftIcon ? 'var(--space-10)' : 'var(--space-4)',
    paddingRight: rightIcon ? 'var(--space-10)' : 'var(--space-4)',
    fontSize: '16px',
    color: 'var(--color-grey-900)',
    backgroundColor: '#FFFFFF',
    borderTop: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-grey-300)'}`,
    borderLeft: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-grey-200)'}`,
    borderRight: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-grey-200)'}`,
    borderBottom: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-grey-100)'}`,
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 150ms ease',
    boxShadow: 'inset 0 2px 4px rgba(39, 36, 29, 0.06)',
  }

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-grey-400)',
    pointerEvents: 'none',
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
          style={inputStyles}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderTopColor = 'var(--color-grey-500)'
              e.currentTarget.style.borderLeftColor = 'var(--color-grey-400)'
              e.currentTarget.style.borderRightColor = 'var(--color-grey-400)'
              e.currentTarget.style.borderBottomColor = 'var(--color-grey-300)'
            }
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderTopColor = 'var(--color-grey-300)'
              e.currentTarget.style.borderLeftColor = 'var(--color-grey-200)'
              e.currentTarget.style.borderRightColor = 'var(--color-grey-200)'
              e.currentTarget.style.borderBottomColor = 'var(--color-grey-100)'
            }
            props.onBlur?.(e)
          }}
          {...props}
        />

        {rightIcon && (
          <span style={{ ...iconStyles, right: 'var(--space-3)' }}>
            {rightIcon}
          </span>
        )}
      </div>

      {(error || hint) && (
        <span style={hintStyles}>
          {error || hint}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'
