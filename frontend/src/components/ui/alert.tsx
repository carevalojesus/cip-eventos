/**
 * Alert Component - Refactoring UI Design System
 *
 * Componente unificado para alertas y notificaciones inline.
 * Reemplaza los 4+ patrones de alerts que existían en el proyecto.
 *
 * @example
 * <Alert variant="info" title="Información importante">
 *   Estos datos se usarán para certificados oficiales.
 * </Alert>
 *
 * <Alert
 *   variant="success"
 *   icon={<CheckCircle />}
 *   title="Datos verificados"
 *   action={<Button size="sm">Ver detalles</Button>}
 * />
 */
import React from "react";
import {
    Info,
    CheckCircle,
    Warning,
    WarningCircle,
    Lightbulb,
} from "@phosphor-icons/react";
import "./alert.css";

// ============================================
// Types
// ============================================

type AlertVariant = "info" | "success" | "warning" | "error" | "neutral" | "tip";

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children?: React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
}

// ============================================
// Default Icons
// ============================================

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
    info: <Info size={20} weight="duotone" />,
    success: <CheckCircle size={20} weight="duotone" />,
    warning: <Warning size={20} weight="duotone" />,
    error: <WarningCircle size={20} weight="duotone" />,
    neutral: <Info size={20} weight="duotone" />,
    tip: <Lightbulb size={20} weight="duotone" />,
};

// ============================================
// Alert Component
// ============================================

export const Alert: React.FC<AlertProps> = ({
    variant = "info",
    title,
    children,
    icon,
    action,
    className = "",
    dismissible = false,
    onDismiss,
}) => {
    const displayIcon = icon !== undefined ? icon : defaultIcons[variant];

    const classes = ["rui-alert", `rui-alert--${variant}`, className]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes} role="alert">
            {displayIcon && (
                <div className="rui-alert__icon">{displayIcon}</div>
            )}

            <div className="rui-alert__content">
                {title && <p className="rui-alert__title">{title}</p>}
                {children && <div className="rui-alert__text">{children}</div>}
            </div>

            {(action || dismissible) && (
                <div className="rui-alert__actions">
                    {action}
                    {dismissible && onDismiss && (
                        <button
                            type="button"
                            className="rui-alert__dismiss"
                            onClick={onDismiss}
                            aria-label="Cerrar alerta"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Alert;
