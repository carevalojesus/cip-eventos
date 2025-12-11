import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SidebarItem } from './sidebar-item'
import { SidebarSection } from './sidebar-section'
import { UserRole } from '@/constants/roles'
import { getNavigationForRole } from '@/config/navigation'
import { getRoleLabel } from '@/store/auth.store'

interface SidebarProps {
  user: {
    name: string
    role: UserRole
    avatar?: string
  }
  activeNav: string
  onNavChange: (navId: string) => void
  onLogout?: () => void | Promise<void> // Mantenido por compatibilidad, pero ya no se usa aquí
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  user,
  activeNav,
  onNavChange,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const { t, i18n } = useTranslation()

  // Obtener navegación filtrada por rol
  const navigation = useMemo(() => {
    return getNavigationForRole(user.role)
  }, [user.role])

  // Obtener label del rol en el idioma actual
  const roleLabel = useMemo(() => {
    const locale = i18n.language?.startsWith('en') ? 'en' : 'es'
    return getRoleLabel(user.role, locale)
  }, [user.role, i18n.language])

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: '260px',
    backgroundColor: 'var(--color-bg-primary)',
    borderRight: '1px solid var(--color-border-light)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease',
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--color-overlay)',
    zIndex: 99,
    display: isOpen ? 'block' : 'none',
  }

  const logoContainerStyle: React.CSSProperties = {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--color-border-light)',
  }

  const logoInnerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  }

  const logoStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    objectFit: 'contain',
  }
  const brandTextStyle: React.CSSProperties = {
    color: 'var(--color-text-primary)',
  }

  const navStyle: React.CSSProperties = {
    flex: 1,
    padding: '1rem 0.75rem',
    overflowY: 'auto',
  }

  const userContainerStyle: React.CSSProperties = {
    padding: '1rem 1.25rem',
    borderTop: '1px solid var(--color-border-light)',
  }

  const userInnerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  }

  const avatarStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-info)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-inverse)',
  }

  const userInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  }

  const userNameStyle: React.CSSProperties = {
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const userRoleStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
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

  // Detectar si es móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <>
      {/* Overlay para móvil */}
      {isMobile && (
        <div style={overlayStyle} onClick={onClose} />
      )}

      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={logoContainerStyle}>
          <div style={logoInnerStyle}>
            <img src="/images/auth/logo-cip.svg" alt="Logo CIP" style={logoStyle} loading="eager" decoding="async" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.938rem', ...brandTextStyle }}>
                CIP Eventos
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                CD Loreto
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - Renderizado dinámico basado en rol */}
        <nav style={navStyle}>
          {navigation.map((section) => (
            <SidebarSection
              key={section.id}
              title={section.titleKey ? t(section.titleKey) : undefined}
            >
              {section.items.map((item) => {
                const IconComponent = item.icon
                return (
                  <SidebarItem
                    key={item.id}
                    icon={IconComponent}
                    label={t(item.labelKey)}
                    isActive={activeNav === item.id}
                    onClick={() => onNavChange(item.id)}
                    badge={item.badge}
                  />
                )
              })}
            </SidebarSection>
          ))}
        </nav>

        {/* User Profile - Logout movido al dropdown del header */}
        <div style={userContainerStyle}>
          <div style={userInnerStyle}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={avatarStyle}
              />
            ) : (
              <div style={avatarStyle}>{getInitials(user.name)}</div>
            )}
            <div style={userInfoStyle}>
              <div style={userNameStyle}>{getDisplayName(user.name)}</div>
              <div style={userRoleStyle}>{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
