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
    backgroundColor: isActive ? '#423D33' : (isHovered ? '#423D33' : 'transparent'),
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
    backgroundColor: '#F0B429',
    borderRadius: '0 2px 2px 0',
    opacity: isActive ? 1 : 0,
    transition: 'opacity 0.15s ease',
  }

  const labelStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '0.875rem',
    fontWeight: isActive ? 500 : 400,
    color: isActive ? '#FAF9F7' : (isHovered ? '#E8E6E1' : '#B8B2A7'),
  }

  const badgeStyle: React.CSSProperties = {
    padding: '0.125rem 0.5rem',
    fontSize: '0.688rem',
    fontWeight: 600,
    borderRadius: '9999px',
    backgroundColor: '#BA2525',
    color: '#FAF9F7',
  }

  // Colores duotono para iconos basados en el estado
  const iconPrimary = isActive ? '#F7C948' : (isHovered ? '#E8E6E1' : '#B8B2A7')
  const iconSecondary = isActive ? '#D3CEC4' : (isHovered ? '#A39E93' : '#857F72')

  const content = (
    <>
      <span style={activeIndicatorStyle} />
      <Icon primary={iconPrimary} secondary={iconSecondary} />
      <span style={labelStyle}>{label}</span>
      {badge && <span style={badgeStyle}>{badge}</span>}
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
