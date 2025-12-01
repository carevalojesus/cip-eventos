import { useState, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const colors = {
  red: { 500: '#BA2525' },
  grey: { 300: '#B8B2A7', 600: '#625D52' },
  white: '#FFFFFF',
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
    backgroundColor: checked ? colors.red[500] : colors.white,
    border: isFocused
      ? `1.5px solid ${checked ? colors.red[500] : colors.grey[600]}`
      : checked
        ? 'none'
        : `1.5px solid ${colors.grey[300]}`,
    boxShadow: isFocused
      ? '0 1px 3px rgba(39, 36, 29, 0.15)'
      : checked
        ? '0 1px 2px rgba(185,28,28,0.2)'
        : 'inset 0 1px 2px rgba(0,0,0,0.05)',
  }

  const labelStyles: React.CSSProperties = {
    fontSize: '0.813rem',
    color: colors.grey[600],
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
