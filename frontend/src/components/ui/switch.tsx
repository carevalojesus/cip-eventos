import { useState } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  ariaLabel?: string
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  ariaLabel,
}: SwitchProps) {
  const [isFocused, setIsFocused] = useState(false)

  const sizeConfig = {
    sm: { track: { width: 36, height: 20 }, thumb: 16, translate: 16 },
    md: { track: { width: 44, height: 24 }, thumb: 20, translate: 20 },
  }

  const config = sizeConfig[size]

  const handleToggle = () => {
    if (disabled) return
    onChange(!checked)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: `${config.track.width}px`,
    height: `${config.track.height}px`,
    borderRadius: `${config.track.height / 2}px`,
    backgroundColor: checked ? 'var(--color-red-500)' : 'var(--color-grey-300)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    outline: isFocused ? '2px solid var(--color-red-200)' : 'none',
    outlineOffset: '2px',
  }

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: checked ? `${config.translate}px` : '2px',
    transform: 'translateY(-50%)',
    width: `${config.thumb}px`,
    height: `${config.thumb}px`,
    borderRadius: '50%',
    backgroundColor: 'var(--color-bg-primary)',
    boxShadow: 'var(--shadow-button)',
    transition: 'left 0.2s ease',
  }

  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      style={trackStyle}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div style={thumbStyle} />
    </div>
  )
}

export default Switch
