/**
 * Badge Component - Refactoring UI Design System
 *
 * Componente unificado para badges y status indicators.
 * Reemplaza los múltiples patrones de badges del proyecto.
 *
 * @example
 * <Badge variant="success">Activo</Badge>
 * <Badge variant="warning" icon={<Clock />}>Pendiente</Badge>
 * <Badge variant="neutral" dot>Deshabilitado</Badge>
 * <Badge variant="info" size="lg">Development</Badge>
 */
import React from "react";
import "./badge.css";

// ============================================
// Types
// ============================================

type BadgeVariant =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
    | "accent";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    icon?: React.ReactNode;
    dot?: boolean;
    outline?: boolean;
    className?: string;
    children: React.ReactNode;
}

// ============================================
// Badge Component
// ============================================

export const Badge: React.FC<BadgeProps> = ({
    variant = "neutral",
    size = "md",
    icon,
    dot = false,
    outline = false,
    className = "",
    children,
}) => {
    const classes = [
        "rui-badge",
        `rui-badge--${variant}`,
        `rui-badge--${size}`,
        outline ? "rui-badge--outline" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <span className={classes}>
            {dot && <span className="rui-badge__dot" />}
            {icon && <span className="rui-badge__icon">{icon}</span>}
            <span className="rui-badge__text">{children}</span>
        </span>
    );
};

// ============================================
// StatusBadge - Specialized for status indicators
// ============================================

type StatusType = "active" | "inactive" | "pending" | "error" | "success" | "disabled";

interface StatusBadgeProps {
    status: StatusType;
    size?: BadgeSize;
    showDot?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const statusConfig: Record<StatusType, { variant: BadgeVariant; defaultLabel: string }> = {
    active: { variant: "success", defaultLabel: "Activo" },
    inactive: { variant: "neutral", defaultLabel: "Inactivo" },
    pending: { variant: "warning", defaultLabel: "Pendiente" },
    error: { variant: "error", defaultLabel: "Error" },
    success: { variant: "success", defaultLabel: "Completado" },
    disabled: { variant: "neutral", defaultLabel: "Deshabilitado" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    size = "md",
    showDot = true,
    className = "",
    children,
}) => {
    const config = statusConfig[status];

    return (
        <Badge
            variant={config.variant}
            size={size}
            dot={showDot}
            className={className}
        >
            {children || config.defaultLabel}
        </Badge>
    );
};

export default Badge;
