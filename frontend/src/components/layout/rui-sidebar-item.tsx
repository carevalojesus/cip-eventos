import { useState } from 'react'
import type { DuotoneIconProps } from '@/components/icons/DuotoneIcons'

interface SidebarItemProps {
  icon: React.ComponentType<DuotoneIconProps>
  label: string
  isActive?: boolean
  onClick?: () => void
  badge?: string | number
  href?: string
}

export function SidebarItem({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  badge,
  href
}: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    height: '40px',
    padding: '0 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    backgroundColor: isActive
      ? 'var(--color-red-050)'
      : isHovered
        ? 'var(--color-grey-100)'
        : 'transparent',
    position: 'relative',
    textDecoration: 'none',
  }

  // Colores para iconos basados en el estado
  const iconColor = isActive
    ? 'var(--color-red-600)'
    : isHovered
      ? 'var(--color-grey-700)'
      : 'var(--color-grey-500)'

  // Color del texto
  const textColor = isActive
    ? 'var(--color-red-600)'
    : isHovered
      ? 'var(--color-grey-800)'
      : 'var(--color-grey-600)'

  const activeIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '24px',
    backgroundColor: 'var(--color-red-500)',
    borderRadius: '0 2px 2px 0',
  }

  const content = (
    <>
      {isActive && <span style={activeIndicatorStyle} />}
      <Icon size={20} primary={iconColor} />
      <span style={{
        flex: 1,
        fontSize: '0.875rem',
        fontWeight: isActive ? 500 : 400,
        color: textColor,
        lineHeight: 1,
      }}>{label}</span>
      {badge && (
        <span style={{
          padding: '2px 6px',
          fontSize: '0.688rem',
          fontWeight: 600,
          borderRadius: '9999px',
          backgroundColor: 'var(--color-red-500)',
          color: 'white',
          lineHeight: 1.2,
        }}>{badge}</span>
      )}
    </>
  )

  const commonProps = {
    style: itemStyle,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }

  if (href) {
    return (
      <a href={href} {...commonProps}>
        {content}
      </a>
    )
  }

  return (
    <div onClick={onClick} {...commonProps}>
      {content}
    </div>
  )
}

export default SidebarItem
