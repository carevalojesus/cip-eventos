/**
 * Card Component - Refactoring UI Design System
 *
 * Componente base reutilizable para cards con compound pattern.
 * Unifica los 5+ patrones de cards que existían en el proyecto.
 *
 * @example
 * <Card>
 *   <Card.Header icon={<User />} iconVariant="primary" title="Título" subtitle="Descripción" />
 *   <Card.Body>{children}</Card.Body>
 *   <Card.Footer>{actions}</Card.Footer>
 * </Card>
 */
import React from "react";
import "./card.css";

// ============================================
// Types
// ============================================

type CardVariant = "default" | "outlined" | "elevated" | "ghost";
type CardPadding = "none" | "compact" | "standard" | "spacious";
type IconVariant =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "account"
    | "contact"
    | "nominal"
    | "integrations"
    | "email"
    | "security";

interface CardProps {
    variant?: CardVariant;
    padding?: CardPadding;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    interactive?: boolean;
}

interface CardHeaderProps {
    icon?: React.ReactNode;
    iconVariant?: IconVariant;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}

interface CardBodyProps {
    className?: string;
    children: React.ReactNode;
}

interface CardFooterProps {
    className?: string;
    children: React.ReactNode;
    align?: "left" | "center" | "right" | "between";
}

// ============================================
// Card Component
// ============================================

export const Card: React.FC<CardProps> & {
    Header: React.FC<CardHeaderProps>;
    Body: React.FC<CardBodyProps>;
    Footer: React.FC<CardFooterProps>;
} = ({
    variant = "outlined",
    padding = "standard",
    className = "",
    children,
    onClick,
    interactive = false,
}) => {
    const classes = [
        "rui-card",
        `rui-card--${variant}`,
        `rui-card--padding-${padding}`,
        interactive || onClick ? "rui-card--interactive" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            className={classes}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={
                onClick
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onClick();
                          }
                      }
                    : undefined
            }
        >
            {children}
        </div>
    );
};

// ============================================
// Card.Header
// ============================================

const CardHeader: React.FC<CardHeaderProps> = ({
    icon,
    iconVariant = "neutral",
    title,
    subtitle,
    action,
    className = "",
}) => {
    return (
        <div className={`rui-card__header ${className}`}>
            {icon && (
                <div
                    className={`rui-card__header-icon rui-card__header-icon--${iconVariant}`}
                >
                    {icon}
                </div>
            )}
            <div className="rui-card__header-content">
                <h3 className="rui-card__header-title">{title}</h3>
                {subtitle && (
                    <p className="rui-card__header-subtitle">{subtitle}</p>
                )}
            </div>
            {action && <div className="rui-card__header-action">{action}</div>}
        </div>
    );
};

Card.Header = CardHeader;

// ============================================
// Card.Body
// ============================================

const CardBody: React.FC<CardBodyProps> = ({ className = "", children }) => {
    return <div className={`rui-card__body ${className}`}>{children}</div>;
};

Card.Body = CardBody;

// ============================================
// Card.Footer
// ============================================

const CardFooter: React.FC<CardFooterProps> = ({
    className = "",
    children,
    align = "right",
}) => {
    return (
        <div className={`rui-card__footer rui-card__footer--${align} ${className}`}>
            {children}
        </div>
    );
};

Card.Footer = CardFooter;

export default Card;
