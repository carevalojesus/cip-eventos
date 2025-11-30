import type { InputHTMLAttributes } from 'react'

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
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--color-grey-600)',
    ...style,
  }

  const checkboxStyles: React.CSSProperties = {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: `1px solid ${checked ? 'var(--color-grey-600)' : 'var(--color-grey-300)'}`,
    backgroundColor: checked ? 'var(--color-grey-600)' : '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease',
    boxShadow: checked
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 2px rgba(39, 36, 29, 0.1)'
      : 'inset 0 2px 4px rgba(39, 36, 29, 0.06)',
  }

  return (
    <label style={containerStyles} className={className}>
      <div style={checkboxStyles}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5L4 7L8 3"
              stroke="#FAF9F7"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
        {...props}
      />
      {label}
    </label>
  )
}
