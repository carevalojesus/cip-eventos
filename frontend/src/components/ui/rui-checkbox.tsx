import { useState, type InputHTMLAttributes } from 'react'
import { Check, Minus } from '@phosphor-icons/react'
import { red, grey, colors, rings, shadows } from '@/lib/styleTokens'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
  label?: string
  checked?: boolean
  onChange?: (e?: React.ChangeEvent<HTMLInputElement>) => void
  indeterminate?: boolean
  size?: 'sm' | 'md'
  ariaLabel?: string
}

export function Checkbox({
  label,
  checked = false,
  onChange,
  indeterminate = false,
  size = 'md',
  ariaLabel,
  disabled = false,
  className = '',
  style,
  ...props
}: CheckboxProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (onChange) {
        onChange(undefined)
      }
    }
  }

  const handleClick = () => {
    if (disabled) return
    if (onChange) {
      onChange(undefined)
    }
  }

  const isActive = checked || indeterminate

  const sizeMap = {
    sm: { box: 16, icon: 10 },
    md: { box: 18, icon: 12 },
  }

  const dimensions = sizeMap[size]

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }

  const checkboxStyles: React.CSSProperties = {
    width: `${dimensions.box}px`,
    height: `${dimensions.box}px`,
    borderRadius: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    backgroundColor: isActive ? red[500] : colors.white,
    border: isFocused
      ? `1.5px solid ${isActive ? red[500] : grey[600]}`
      : isActive
        ? 'none'
        : `1.5px solid ${grey[300]}`,
    boxShadow: isFocused
      ? rings.neutral
      : isActive
        ? shadows.buttonDefault
        : shadows.inputInset,
  }

  const labelStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: grey[600],
  }

  return (
    <label style={containerStyles} className={className}>
      <div
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-label={ariaLabel}
        tabIndex={disabled ? -1 : 0}
        style={checkboxStyles}
        onKeyDown={handleKeyDown}
        onFocus={() => !disabled && setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={handleClick}
      >
        {checked && !indeterminate && (
          <Check size={dimensions.icon} color={colors.white} weight="bold" aria-hidden="true" />
        )}
        {indeterminate && (
          <Minus size={dimensions.icon} color={colors.white} weight="bold" aria-hidden="true" />
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ display: 'none' }}
        {...props}
      />
      {label && <span style={labelStyles}>{label}</span>}
    </label>
  )
}
