import { useState, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { red, grey, colors, rings, shadows } from '@/lib/design-tokens'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function Checkbox({
  label,
  checked,
  onChange,
  className = '',
  style,
  ...props
}: CheckboxProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Toggle checkbox on Space or Enter key
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (onChange) {
        onChange(e as any)
      }
    }
  }

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    ...style,
  }

  const checkboxStyles: React.CSSProperties = {
    width: '18px',
    height: '18px',
    borderRadius: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    backgroundColor: checked ? red[500] : colors.white,
    border: isFocused
      ? `1.5px solid ${checked ? red[500] : grey[600]}`
      : checked
        ? 'none'
        : `1.5px solid ${grey[300]}`,
    boxShadow: isFocused
      ? rings.neutral
      : checked
        ? shadows.buttonDefault
        : shadows.inputInset,
  }

  const labelStyles: React.CSSProperties = {
    fontSize: '0.875rem', // 14px - token: sm
    color: grey[600],
  }

  return (
    <label style={containerStyles} className={className}>
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        style={checkboxStyles}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {checked && <Check size={12} color={colors.white} strokeWidth={3} aria-hidden="true" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
        {...props}
      />
      {label && <span style={labelStyles}>{label}</span>}
    </label>
  )
}
