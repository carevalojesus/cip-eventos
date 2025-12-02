import type { AnchorHTMLAttributes, ReactNode } from 'react'

type LinkVariant = 'default' | 'muted'

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  variant?: LinkVariant
}

export function Link({
  children,
  variant = 'default',
  className = '',
  style,
  ...props
}: LinkProps) {
  // Links usan --color-action (cyan) para diferenciarse de danger (rojo)
  const variantStyles: Record<LinkVariant, React.CSSProperties> = {
    default: {
      color: 'var(--color-action)',
      fontWeight: 500,
      fontSize: '14px',
    },
    muted: {
      color: 'var(--color-action)',
      fontWeight: 500,
      fontSize: '0.813rem', // 13px
    },
  }

  const baseStyles: React.CSSProperties = {
    textDecoration: 'none',
    transition: 'color 150ms ease',
    cursor: 'pointer',
    ...variantStyles[variant],
    ...style,
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = 'var(--color-action-dark)'
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = 'var(--color-action)'
  }

  return (
    <a
      style={baseStyles}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </a>
  )
}
