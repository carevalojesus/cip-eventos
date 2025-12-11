import type { CSSProperties, HTMLAttributes } from 'react'

/**
 * Skeleton Component - Loading State Indicators
 *
 * Components:
 * - Skeleton: Base skeleton component with pulse animation
 * - SkeletonText: Skeleton for text lines
 * - SkeletonCircle: Skeleton for circular elements (avatars, icons)
 * - SkeletonTable: Skeleton for table loading states
 *
 * Features:
 * - Uses CSS variables from design system
 * - Smooth pulse animation
 * - Configurable dimensions
 * - Accessible loading states
 */

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  width?: string | number
  height?: string | number
  style?: CSSProperties
}

/**
 * Base Skeleton component with pulse animation
 *
 * @example
 * <Skeleton width="100%" height="20px" />
 * <Skeleton className="h-4 w-32" />
 */
export function Skeleton({
  className = '',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const skeletonStyles: CSSProperties = {
    backgroundColor: 'var(--color-grey-100)',
    borderRadius: 'var(--radius-md)',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    ...style,
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={className}
      style={skeletonStyles}
      {...props}
    />
  )
}

interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  lines?: number
  lastLineWidth?: string
  lineHeight?: string
  gap?: string
}

/**
 * Skeleton for text content with multiple lines
 *
 * @example
 * <SkeletonText lines={3} />
 * <SkeletonText lines={2} lastLineWidth="60%" />
 */
export function SkeletonText({
  className = '',
  lines = 1,
  lastLineWidth = '80%',
  lineHeight = '16px',
  gap = 'var(--space-2)',
  ...props
}: SkeletonTextProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
      {...props}
    >
      {Array.from({ length: lines }).map((_, index) => {
        const isLastLine = index === lines - 1
        return (
          <Skeleton
            key={index}
            height={lineHeight}
            width={isLastLine && lines > 1 ? lastLineWidth : '100%'}
          />
        )
      })}
    </div>
  )
}

type CircleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

interface SkeletonCircleProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  size?: CircleSize | number
}

/**
 * Skeleton for circular elements (avatars, profile pictures)
 *
 * @example
 * <SkeletonCircle size="md" />
 * <SkeletonCircle size={48} />
 */
export function SkeletonCircle({
  className = '',
  size = 'md',
  ...props
}: SkeletonCircleProps) {
  // Size mapping to design system tokens
  const sizeMap: Record<CircleSize, string> = {
    xs: 'var(--size-icon-xs)', // 16px
    sm: 'var(--size-icon-sm)', // 20px
    md: 'var(--size-icon-md)', // 24px
    lg: 'var(--size-icon-lg)', // 28px
    xl: 'var(--size-icon-xl)', // 32px
    '2xl': 'var(--size-icon-2xl)', // 40px
    '3xl': 'var(--size-icon-3xl)', // 48px
  }

  const dimension = typeof size === 'number' ? `${size}px` : sizeMap[size]

  return (
    <Skeleton
      className={className}
      width={dimension}
      height={dimension}
      style={{
        borderRadius: 'var(--radius-full)',
      }}
      {...props}
    />
  )
}

interface SkeletonTableProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  rows?: number
  columns?: number
  showHeader?: boolean
  rowHeight?: string
  cellGap?: string
  rowGap?: string
}

/**
 * Skeleton for table loading states
 *
 * @example
 * <SkeletonTable rows={5} columns={6} />
 * <SkeletonTable rows={3} columns={4} showHeader={false} />
 */
export function SkeletonTable({
  className = '',
  rows = 5,
  columns = 4,
  showHeader = true,
  rowHeight = '48px',
  cellGap = 'var(--space-3)',
  rowGap = 'var(--space-2)',
  ...props
}: SkeletonTableProps) {
  const totalRows = showHeader ? rows + 1 : rows

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: rowGap,
        width: '100%',
      }}
      role="status"
      aria-label="Loading table"
      {...props}
    >
      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const isHeader = showHeader && rowIndex === 0

        return (
          <div
            key={rowIndex}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: cellGap,
              alignItems: 'center',
              minHeight: rowHeight,
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                height={isHeader ? '20px' : '16px'}
                width={isHeader ? '90%' : colIndex === 0 ? '70%' : '85%'}
                style={{
                  opacity: isHeader ? 0.8 : 1,
                }}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

/**
 * CSS Animation for pulse effect
 * Add this to your global CSS if not already present:
 *
 * @keyframes pulse {
 *   0%, 100% {
 *     opacity: 1;
 *   }
 *   50% {
 *     opacity: 0.5;
 *   }
 * }
 */
