import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { UserRole } from '@/constants/roles'
import { getRoleLabel } from '@/store/auth.store'

interface AppLayoutProps {
  children: ReactNode
  user: { name: string; role: UserRole; avatar?: string }
  activeNav: string
  onNavChange: (navId: string) => void
  onLogout?: () => void | Promise<void>
}

export function AppLayout({
  children,
  user,
  activeNav,
  onNavChange,
  onLogout,
}: AppLayoutProps) {
  const { i18n } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Obtener label del rol en el idioma actual
  const roleLabel = useMemo(() => {
    const locale = i18n.language?.startsWith('en') ? 'en' : 'es'
    return getRoleLabel(user.role, locale)
  }, [user.role, i18n.language])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const mainStyle: React.CSSProperties = {
    marginLeft: isMobile ? 0 : '260px',
    marginTop: '64px',
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
  }

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: '100vh' }}>
      <Sidebar
        user={user}
        activeNav={activeNav}
        onNavChange={(navId) => {
          onNavChange(navId)
          if (isMobile) {
            handleSidebarClose()
          }
        }}
        onLogout={onLogout}
        isOpen={isMobile ? isSidebarOpen : true}
        onClose={handleSidebarClose}
      />
      <Header
        user={{ name: user.name, avatar: user.avatar, role: roleLabel }}
        onMenuToggle={handleMenuToggle}
        onLogout={onLogout}
        notificationCount={3}
      />
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  )
}

export default AppLayout
