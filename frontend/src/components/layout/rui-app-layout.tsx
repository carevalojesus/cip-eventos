import { useState, useEffect, type ReactNode } from 'react'
import { Sidebar } from './rui-sidebar'
import { Header } from './rui-header'

interface AppLayoutProps {
  children: ReactNode
  user: { name: string; role: string; avatar?: string }
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
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
        user={user}
        onMenuToggle={handleMenuToggle}
        notificationCount={3}
      />
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  )
}

export default AppLayout
