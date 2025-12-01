import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/rui-button'
import { Input } from '@/components/ui/rui-input'
import {
  IconBell,
  IconChevronDown,
  IconMenu,
} from '@/components/icons/DuotoneIcons'

interface HeaderProps {
  user: { name: string; avatar?: string }
  searchQuery: string
  onSearchChange: (query: string) => void
  onMenuToggle?: () => void
  notificationCount?: number
}

export function Header({
  user,
  searchQuery,
  onSearchChange,
  onMenuToggle,
  notificationCount = 0,
}: HeaderProps) {
  const { t } = useTranslation()
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: isMobile ? 0 : '260px',
    right: 0,
    height: '64px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E8E6E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    zIndex: 90,
  }

  const leftSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }

  const searchContainerStyle: React.CSSProperties = {
    width: isMobile ? '200px' : '320px',
  }

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  }

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '24px',
    backgroundColor: '#D3CEC4',
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
    backgroundColor: '#BA2525',
    borderRadius: '50%',
    border: '2px solid #FFFFFF',
  }

  const notificationBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    backgroundColor: '#BA2525',
    color: '#FFFFFF',
    fontSize: '0.688rem',
    fontWeight: 600,
    borderRadius: '9999px',
    border: '2px solid #FFFFFF',
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
    backgroundColor: '#2CB1BC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#F5F4F2',
  }

  const menuButtonStyle: React.CSSProperties = {
    display: isMobile ? 'flex' : 'none',
    padding: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '0.375rem',
    alignItems: 'center',
    justifyContent: 'center',
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
      <div style={leftSectionStyle}>
        {/* Mobile menu button */}
        <button style={menuButtonStyle} onClick={onMenuToggle}>
          <IconMenu primary="#6B675D" secondary="#857F72" />
        </button>

        {/* Search */}
        <div style={searchContainerStyle}>
          <Input
            placeholder={t('common.search') + '...'}
            leftIcon={<Search size={18} color="#A39E93" />}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ backgroundColor: '#F5F4F2' }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={actionsStyle}>
        {!isMobile && (
          <>
            <Button
              variant="primary"
              size="md"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Plus size={16} />
              {t('dashboard.new_event')}
            </Button>

            <div style={dividerStyle} />
          </>
        )}

        <button style={notificationButtonStyle}>
          <IconBell primary="#6B675D" secondary="#A39E93" />
          {notificationCount > 0 && (
            <span style={notificationBadgeStyle}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

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
            <IconChevronDown primary="#6B675D" size={20} />
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
