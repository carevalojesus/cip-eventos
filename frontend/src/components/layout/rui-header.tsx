import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IconBell,
  IconChevronDown,
  IconMenu,
} from '@/components/icons/DuotoneIcons'

interface HeaderProps {
  user: { name: string; avatar?: string }
  onMenuToggle?: () => void
  notificationCount?: number
}

export function Header({
  user,
  onMenuToggle,
  notificationCount = 0,
}: HeaderProps) {
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: isMobile ? 0 : '260px',
    right: 0,
    height: '64px',
    backgroundColor: 'var(--color-bg-primary)',
    borderBottom: '1px solid var(--color-border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 1.5rem',
    zIndex: 90,
  }

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  }

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--color-border-light)',
    margin: '0 0.5rem',
  }

  const notificationButtonStyle: React.CSSProperties = {
    position: 'relative',
    padding: '0.625rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const notificationDotStyle: React.CSSProperties = {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '50%',
    border: '2px solid var(--color-bg-primary)',
  }

  const notificationBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    fontSize: '0.688rem',
    fontWeight: 600,
    borderRadius: '9999px',
    border: '2px solid var(--color-bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const userMenuStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: '0.5rem',
    cursor: 'pointer',
  }

  const avatarStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-info)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-inverse)',
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0][0].toUpperCase()
    // Primera letra del primer nombre + primera letra del primer apellido (segundo elemento)
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return (
    <header style={headerStyle}>
      {/* Actions */}
      <div style={actionsStyle}>
        <button style={notificationButtonStyle}>
          <IconBell primary="var(--color-text-secondary)" secondary="var(--color-text-muted)" />
          {notificationCount > 0 && (
            <span style={notificationBadgeStyle}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <div style={dividerStyle} />

        <div style={userMenuStyle}>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              style={avatarStyle}
            />
          ) : (
            <div style={avatarStyle}>{getInitials(user.name)}</div>
          )}
          {!isMobile && (
            <IconChevronDown primary="var(--color-text-secondary)" size={20} />
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
