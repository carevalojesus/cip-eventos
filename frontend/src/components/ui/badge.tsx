import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Badge Component - Uses project's Refactoring UI color palette
 *
 * Variants use CSS variables defined in global.css:
 * - success: green-100/green-700 (lime green)
 * - warning: yellow-100/yellow-800 (vivid yellow)
 * - info: cyan-100/cyan-700 (action cyan)
 * - destructive/danger: red-100/red-700 (brand red)
 * - neutral/gray: grey-100/grey-700 (warm grey)
 * - accent: yellow-100/yellow-800 (decorative)
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-red-500)] text-white hover:bg-[var(--color-red-600)]",
        secondary:
          "border-transparent bg-[var(--color-grey-100)] text-[var(--color-grey-700)] hover:bg-[var(--color-grey-200)]",
        destructive:
          "border-transparent bg-[var(--color-red-100)] text-[var(--color-red-700)] hover:bg-[var(--color-red-200)]",
        outline:
          "text-[var(--color-grey-900)] border-[var(--color-grey-200)]",
        // Semantic states using project palette
        success:
          "border-transparent bg-[var(--color-green-100)] text-[var(--color-green-700)] hover:bg-[var(--color-green-200)]",
        warning:
          "border-transparent bg-[var(--color-yellow-100)] text-[var(--color-yellow-800)] hover:bg-[var(--color-yellow-200)]",
        info:
          "border-transparent bg-[var(--color-cyan-100)] text-[var(--color-cyan-700)] hover:bg-[var(--color-cyan-200)]",
        danger:
          "border-transparent bg-[var(--color-red-100)] text-[var(--color-red-700)] hover:bg-[var(--color-red-200)]",
        gray:
          "border-transparent bg-[var(--color-grey-100)] text-[var(--color-grey-700)] hover:bg-[var(--color-grey-200)]",
        neutral:
          "border-transparent bg-[var(--color-grey-100)] text-[var(--color-grey-700)] hover:bg-[var(--color-grey-200)]",
        accent:
          "border-transparent bg-[var(--color-yellow-100)] text-[var(--color-yellow-800)] hover:bg-[var(--color-yellow-200)]",
        // Action variant for CTAs
        action:
          "border-transparent bg-[var(--color-cyan-500)] text-white hover:bg-[var(--color-cyan-600)]",
        // Primary brand variant
        primary:
          "border-transparent bg-[var(--color-red-500)] text-white hover:bg-[var(--color-red-600)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
