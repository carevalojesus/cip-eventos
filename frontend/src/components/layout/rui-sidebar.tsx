import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SidebarItem } from './rui-sidebar-item'
import { SidebarSection } from './rui-sidebar-section'
import {
  IconDashboard,
  IconCalendar,
  IconMicrophone,
  IconUserGroup,
  IconSurvey,
  IconIdentification,
  IconCertificate,
  IconWallet,
  IconMoney,
  IconChart,
  IconUser,
  IconFolder,
  IconCog,
  IconDoorExit,
} from '@/components/icons/DuotoneIcons'

interface SidebarProps {
  user: { name: string; role: string; avatar?: string }
  activeNav: string
  onNavChange: (navId: string) => void
  onLogout?: () => void | Promise<void>
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  user,
  activeNav,
  onNavChange,
  onLogout,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const { t } = useTranslation()

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

  const logoutButtonStyle: React.CSSProperties = {
    padding: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '0.375rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease',
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0][0].toUpperCase()
    // Primera letra del primer nombre + primera letra del primer apellido (segundo elemento)
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  // Obtiene solo el primer nombre y primer apellido para mostrar
  const getDisplayName = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length <= 2) return name
    // Primer nombre + primer apellido
    return `${parts[0]} ${parts[1]}`
  }

  // Detectar si es móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Estado hover para botón logout
  const [isLogoutHovered, setIsLogoutHovered] = useState(false)

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

        {/* Navigation */}
        <nav style={navStyle}>
          {/* GENERAL */}
          <SidebarSection>
            <SidebarItem
              icon={IconDashboard}
              label={t('dashboard.nav.dashboard')}
              isActive={activeNav === 'dashboard'}
              onClick={() => onNavChange('dashboard')}
            />
          </SidebarSection>

          {/* GESTIÓN DE EVENTOS */}
          <SidebarSection title={t('dashboard.nav.events_management')}>
            <SidebarItem
              icon={IconCalendar}
              label={t('dashboard.nav.my_events')}
              isActive={activeNav === 'eventos'}
              onClick={() => onNavChange('eventos')}
            />
            <SidebarItem
              icon={IconMicrophone}
              label={t('dashboard.nav.speakers')}
              isActive={activeNav === 'ponentes'}
              onClick={() => onNavChange('ponentes')}
            />
            <SidebarItem
              icon={IconUserGroup}
              label={t('dashboard.nav.organizers')}
              isActive={activeNav === 'organizadores'}
              onClick={() => onNavChange('organizadores')}
            />
          </SidebarSection>

          {/* OPERACIONES */}
          <SidebarSection title={t('dashboard.nav.operations')}>
            <SidebarItem
              icon={IconSurvey}
              label={t('dashboard.nav.registrations')}
              isActive={activeNav === 'inscripciones'}
              onClick={() => onNavChange('inscripciones')}
            />
            <SidebarItem
              icon={IconIdentification}
              label={t('dashboard.nav.access_control')}
              isActive={activeNav === 'control-acceso'}
              onClick={() => onNavChange('control-acceso')}
            />
            <SidebarItem
              icon={IconCertificate}
              label={t('dashboard.nav.certificates')}
              isActive={activeNav === 'certificados'}
              onClick={() => onNavChange('certificados')}
            />
          </SidebarSection>

          {/* FINANZAS */}
          <SidebarSection title={t('dashboard.nav.finance')}>
            <SidebarItem
              icon={IconWallet}
              label={t('dashboard.nav.income')}
              isActive={activeNav === 'ingresos'}
              onClick={() => onNavChange('ingresos')}
            />
            <SidebarItem
              icon={IconMoney}
              label={t('dashboard.nav.payments')}
              isActive={activeNav === 'pagos'}
              onClick={() => onNavChange('pagos')}
            />
            <SidebarItem
              icon={IconChart}
              label={t('dashboard.nav.reports')}
              isActive={activeNav === 'reportes'}
              onClick={() => onNavChange('reportes')}
            />
          </SidebarSection>

          {/* ADMINISTRACIÓN */}
          <SidebarSection title={t('dashboard.nav.administration')}>
            <SidebarItem
              icon={IconUser}
              label={t('dashboard.nav.users')}
              isActive={activeNav === 'usuarios'}
              onClick={() => onNavChange('usuarios')}
            />
            <SidebarItem
              icon={IconFolder}
              label={t('dashboard.nav.cip_registry')}
              isActive={activeNav === 'padron-cip'}
              onClick={() => onNavChange('padron-cip')}
            />
            <SidebarItem
              icon={IconCog}
              label={t('dashboard.nav.settings')}
              isActive={activeNav === 'configuracion'}
              onClick={() => onNavChange('configuracion')}
            />
          </SidebarSection>
        </nav>

        {/* User Profile */}
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
              <div style={userRoleStyle}>{user.role}</div>
            </div>
            <button
              style={{
                ...logoutButtonStyle,
                backgroundColor: isLogoutHovered ? 'var(--color-red-050)' : 'transparent',
              }}
              onClick={onLogout}
              onMouseEnter={() => setIsLogoutHovered(true)}
              onMouseLeave={() => setIsLogoutHovered(false)}
              title={t('dashboard.nav.logout')}
            >
              <IconDoorExit
                size={18}
                primary={isLogoutHovered ? 'var(--color-danger)' : 'var(--color-grey-400)'}
                secondary={isLogoutHovered ? 'var(--color-red-200)' : 'var(--color-grey-300)'}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
