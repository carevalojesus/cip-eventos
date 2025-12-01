import type { ReactNode } from 'react'

interface SidebarSectionProps {
  title?: string
  children: ReactNode
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  }

  const titleStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    fontSize: '0.688rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#857F72',
  }

  const itemsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  }

  return (
    <div style={sectionStyle}>
      {title && <div style={titleStyle}>{title}</div>}
      <div style={itemsStyle}>{children}</div>
    </div>
  )
}

export default SidebarSection
