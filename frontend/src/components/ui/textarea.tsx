import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { colors, rings, shadows } from '@/lib/styleTokens'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  id,
  className = '',
  style,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || props.name
  const errorId = error ? `${textareaId}-error` : undefined

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

  const isDisabled = props.disabled

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: '14px',
    color: isDisabled ? 'var(--color-grey-600)' : 'var(--color-grey-900)',
    backgroundColor: isDisabled ? 'var(--color-grey-050)' : colors.white,
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-grey-200)'}`,
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    boxShadow: isDisabled ? 'none' : shadows.inputInset,
    resize: isDisabled ? 'none' : 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    cursor: isDisabled ? 'default' : 'text',
  }

  const hintStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: error ? 'var(--color-danger)' : 'var(--color-grey-500)',
  }

  return (
    <div style={{ ...containerStyles, ...style }} className={className}>
      {label && (
        <label htmlFor={textareaId} style={labelStyles}>
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        style={textareaStyles}
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

      {(error || hint) && (
        <span id={errorId} style={hintStyles}>
          {error || hint}
        </span>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'
