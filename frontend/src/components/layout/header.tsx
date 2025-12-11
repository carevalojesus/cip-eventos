import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CaretDown, Bell, List, User, Gear, SignOut } from '@phosphor-icons/react'

interface HeaderProps {
  user: { name: string; avatar?: string; role?: string }
  onMenuToggle?: () => void
  onLogout?: () => void | Promise<void>
  onNavigate?: (path: string) => void
  notificationCount?: number
}

export function Header({
  user,
  onMenuToggle,
  onLogout,
  onNavigate,
  notificationCount = 0,
}: HeaderProps) {
  const { t } = useTranslation()
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Cerrar dropdown con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isDropdownOpen])

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
    transition: 'background-color 0.15s ease',
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

  const userMenuContainerStyle: React.CSSProperties = {
    position: 'relative',
  }

  const userMenuButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.5rem',
    marginLeft: '0.25rem',
    cursor: 'pointer',
    borderRadius: '0.5rem',
    border: 'none',
    background: isDropdownOpen ? 'var(--color-grey-050)' : 'transparent',
    transition: 'background-color 0.15s ease',
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

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: '220px',
    backgroundColor: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border-light)',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    padding: '0.5rem',
    zIndex: 100,
    opacity: isDropdownOpen ? 1 : 0,
    visibility: isDropdownOpen ? 'visible' : 'hidden',
    transform: isDropdownOpen ? 'translateY(0)' : 'translateY(-8px)',
    transition: 'opacity 0.15s ease, transform 0.15s ease, visibility 0.15s',
  }

  const dropdownHeaderStyle: React.CSSProperties = {
    padding: '0.75rem',
    borderBottom: '1px solid var(--color-border-light)',
    marginBottom: '0.25rem',
  }

  const dropdownUserNameStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const dropdownUserEmailStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    margin: '2px 0 0 0',
  }

  const dropdownItemStyle = (isHovered: boolean, isDanger: boolean = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: isDanger
      ? (isHovered ? 'var(--color-danger)' : 'var(--color-grey-700)')
      : 'var(--color-grey-700)',
    backgroundColor: isHovered
      ? (isDanger ? 'var(--color-red-050)' : 'var(--color-grey-050)')
      : 'transparent',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    textAlign: 'left',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  })

  const dropdownDividerStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: 'var(--color-border-light)',
    margin: '0.375rem 0',
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  const getDisplayName = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length <= 2) return name
    return `${parts[0]} ${parts[1]}`
  }

  const handleProfileClick = () => {
    setIsDropdownOpen(false)
    // Navegar a perfil usando SPA navigation
    const isEnglish = window.location.pathname.startsWith('/en')
    const path = isEnglish ? '/en/profile' : '/perfil'
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = path
    }
  }

  const handleSettingsClick = () => {
    setIsDropdownOpen(false)
    // Navegar a configuración usando SPA navigation
    const isEnglish = window.location.pathname.startsWith('/en')
    const path = isEnglish ? '/en/settings' : '/configuracion'
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = path
    }
  }

  const handleLogoutClick = async () => {
    setIsDropdownOpen(false)
    if (onLogout) {
      await onLogout()
    }
  }

  return (
    <header style={headerStyle}>
      {/* Mobile menu toggle */}
      {isMobile && onMenuToggle && (
        <button
          onClick={onMenuToggle}
          style={{
            padding: '0.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 'auto',
          }}
          aria-label={t('dashboard.nav.menu')}
        >
          <List size={22} color="var(--color-grey-600)" weight="regular" />
        </button>
      )}

      {/* Actions */}
      <div style={actionsStyle}>
        <button
          style={{
            ...notificationButtonStyle,
            backgroundColor: hoveredItem === 'notifications' ? 'var(--color-grey-100)' : 'transparent',
          }}
          onMouseEnter={() => setHoveredItem('notifications')}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label={t('dashboard.nav.notifications')}
        >
          <Bell
            size={20}
            color={hoveredItem === 'notifications' ? 'var(--color-grey-700)' : 'var(--color-grey-500)'}
            weight="regular"
          />
          {notificationCount > 0 && (
            <span style={notificationBadgeStyle}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <div style={dividerStyle} />

        {/* User Menu Dropdown */}
        <div style={userMenuContainerStyle} ref={dropdownRef}>
          <button
            style={userMenuButtonStyle}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onMouseEnter={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.backgroundColor = 'var(--color-grey-050)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ ...avatarStyle, objectFit: 'cover' }}
              />
            ) : (
              <div style={avatarStyle}>{getInitials(user.name)}</div>
            )}
            {!isMobile && (
              <CaretDown
                size={16}
                color="var(--color-grey-500)"
                weight="bold"
                style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease',
                }}
              />
            )}
          </button>

          {/* Dropdown Menu */}
          <div style={dropdownStyle} role="menu">
            {/* User Info Header */}
            <div style={dropdownHeaderStyle}>
              <p style={dropdownUserNameStyle}>{getDisplayName(user.name)}</p>
              {user.role && (
                <p style={dropdownUserEmailStyle}>{user.role}</p>
              )}
            </div>

            {/* Menu Items */}
            <button
              style={dropdownItemStyle(hoveredItem === 'profile', false)}
              onMouseEnter={() => setHoveredItem('profile')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={handleProfileClick}
              role="menuitem"
            >
              <User size={18} color="var(--color-grey-500)" weight="regular" />
              {t('dashboard.nav.my_profile')}
            </button>

            <button
              style={dropdownItemStyle(hoveredItem === 'settings', false)}
              onMouseEnter={() => setHoveredItem('settings')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={handleSettingsClick}
              role="menuitem"
            >
              <Gear size={18} color="var(--color-grey-500)" weight="regular" />
              {t('dashboard.nav.settings')}
            </button>

            <div style={dropdownDividerStyle} />

            <button
              style={dropdownItemStyle(hoveredItem === 'logout', true)}
              onMouseEnter={() => setHoveredItem('logout')}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={handleLogoutClick}
              role="menuitem"
            >
              <SignOut
                size={18}
                color={hoveredItem === 'logout' ? 'var(--color-danger)' : 'var(--color-grey-500)'}
                weight="regular"
              />
              {t('dashboard.nav.logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
