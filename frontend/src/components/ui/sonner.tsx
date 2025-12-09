import {
  CheckCircle,
  Info,
  Warning,
  XCircle,
  CircleNotch,
} from "@phosphor-icons/react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      icons={{
        success: <CheckCircle size={18} weight="fill" className="text-[var(--color-success)]" />,
        info: <Info size={18} weight="fill" className="text-[var(--color-info)]" />,
        warning: <Warning size={18} weight="fill" className="text-[var(--color-warning)]" />,
        error: <XCircle size={18} weight="fill" className="text-[var(--color-danger)]" />,
        loading: <CircleNotch size={18} weight="bold" className="animate-spin text-[var(--color-text-muted)]" />,
      }}
      toastOptions={{
        style: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: "var(--font-size-sm)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border-light)",
          boxShadow: "var(--shadow-dropdown)",
          padding: "var(--space-3) var(--space-4)",
          gap: "var(--space-3)",
        },
        classNames: {
          toast: "bg-[var(--color-bg-primary)]",
          title: "text-[var(--color-text-primary)] font-medium",
          description: "text-[var(--color-text-secondary)]",
        },
      }}
      style={
        {
          "--normal-bg": "var(--color-bg-primary)",
          "--normal-text": "var(--color-text-primary)",
          "--normal-border": "var(--color-border-light)",
          "--border-radius": "var(--radius-lg)",
          "--z-index": "var(--z-toast)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
