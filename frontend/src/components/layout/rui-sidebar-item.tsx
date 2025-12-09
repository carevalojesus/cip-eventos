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
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    backgroundColor: isActive
      ? 'var(--color-red-050)'
      : (isHovered ? 'var(--color-grey-050)' : 'transparent'),
    position: 'relative',
    textDecoration: 'none',
  }

  const activeIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '60%',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '0 2px 2px 0',
    opacity: isActive ? 1 : 0,
    transition: 'opacity 0.15s ease',
  }

  // Colores para iconos basados en el estado
  // Iconos inactivos: grey-600 para mejor visibilidad
  // Iconos activos: primary (red-500)
  const iconPrimary = isActive
    ? 'var(--color-primary)'
    : 'var(--color-grey-600)'

  const content = (
    <>
      <span style={activeIndicatorStyle} />
      <Icon size={20} primary={iconPrimary} />
      <span style={{
        flex: 1,
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--color-primary)' : (isHovered ? 'var(--color-grey-700)' : 'var(--color-text-muted)'),
      }}>{label}</span>
      {badge && (
        <span style={{
          padding: '0.125rem 0.5rem',
          fontSize: '0.688rem',
          fontWeight: 600,
          borderRadius: '9999px',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
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
