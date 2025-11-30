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
  const variantStyles: Record<LinkVariant, React.CSSProperties> = {
    default: {
      color: '#BA2525',
      fontWeight: 500,
    },
    muted: {
      color: '#857F72',
      fontWeight: 400,
    },
  }

  const baseStyles: React.CSSProperties = {
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'color 150ms ease',
    cursor: 'pointer',
    ...variantStyles[variant],
    ...style,
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (variant === 'default') {
      e.currentTarget.style.color = '#911111'
    } else {
      e.currentTarget.style.color = '#625D52'
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (variant === 'default') {
      e.currentTarget.style.color = '#BA2525'
    } else {
      e.currentTarget.style.color = '#857F72'
    }
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
