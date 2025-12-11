import type { ReactNode } from 'react'
import { House } from "@phosphor-icons/react"

/**
 * Breadcrumbs Component
 *
 * Navegación breadcrumb para mostrar la jerarquía de páginas
 *
 * Features:
 * - Soporta items con y sin links
 * - Último item no es clickeable (página actual)
 * - Separador customizable (default: "/")
 * - Icono de casa para el primer item si href es "/"
 * - Usa CSS variables del design system
 */

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
}

export function Breadcrumbs({ items, separator = "/" }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null
  }

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-4)',
    flexWrap: 'wrap',
  }

  const itemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  }

  const linkStyles: React.CSSProperties = {
    color: 'var(--color-action)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color var(--transition-fast)',
    cursor: 'pointer',
  }

  const currentStyles: React.CSSProperties = {
    color: 'var(--color-text-primary)',
    fontWeight: 500,
  }

  const separatorStyles: React.CSSProperties = {
    color: 'var(--color-text-tertiary)',
    userSelect: 'none',
    fontSize: 'var(--font-size-sm)',
  }

  const handleLinkHover = (e: React.MouseEvent<HTMLAnchorElement>, isHovering: boolean) => {
    e.currentTarget.style.color = isHovering ? 'var(--color-action-dark)' : 'var(--color-action)'
  }

  return (
    <nav aria-label="Breadcrumb" style={containerStyles}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isFirst = index === 0
          const isHome = isFirst && item.href === '/'

          return (
            <li key={index} style={itemStyles}>
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  style={linkStyles}
                  onMouseEnter={(e) => handleLinkHover(e, true)}
                  onMouseLeave={(e) => handleLinkHover(e, false)}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isHome ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <House size={16} weight="fill" />
                      {item.label}
                    </span>
                  ) : (
                    item.label
                  )}
                </a>
              ) : (
                <span style={currentStyles} aria-current={isLast ? 'page' : undefined}>
                  {isHome ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <House size={16} weight="fill" />
                      {item.label}
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              )}
              {!isLast && (
                <span style={separatorStyles} aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
