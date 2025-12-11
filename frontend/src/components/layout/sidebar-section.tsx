import type { ReactNode } from 'react'

interface SidebarSectionProps {
  title?: string
  children: ReactNode
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  const sectionStyle: React.CSSProperties = {
    marginBottom: '1rem',
  }

  const titleStyle: React.CSSProperties = {
    padding: '0 0.75rem',
    marginBottom: '0.25rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-grey-400)',
  }

  const itemsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  }

  return (
    <div style={sectionStyle}>
      {title && <div style={titleStyle}>{title}</div>}
      <div style={itemsStyle}>{children}</div>
    </div>
  )
}

export default SidebarSection
