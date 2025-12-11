import React from "react";
import { useTranslation } from "react-i18next";

interface OrganizerStatusBadgeProps {
    isActive: boolean;
    size?: "sm" | "md";
}

export const OrganizerStatusBadge: React.FC<OrganizerStatusBadgeProps> = ({
    isActive,
    size = "sm",
}) => {
    const { t } = useTranslation();

    const statusConfig = {
        active: {
            backgroundColor: "var(--color-green-100)",
            color: "var(--color-green-700)",
            dotColor: "var(--color-green-500)",
            label: t("organizers.status.active", "Activo"),
        },
        inactive: {
            backgroundColor: "var(--color-grey-100)",
            color: "var(--color-grey-600)",
            dotColor: "var(--color-grey-400)",
            label: t("organizers.status.inactive", "Inactivo"),
        },
    };

    const config = isActive ? statusConfig.active : statusConfig.inactive;

    const badgeStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding:
            size === "sm"
                ? "var(--space-1) var(--space-3)"
                : "var(--space-2) var(--space-3)",
        fontSize: size === "sm" ? "var(--font-size-xs)" : "var(--font-size-sm)",
        fontWeight: 500,
        borderRadius: "var(--radius-full)",
        backgroundColor: config.backgroundColor,
        color: config.color,
    };

    const dotStyle: React.CSSProperties = {
        width: "var(--space-2)",
        height: "var(--space-2)",
        borderRadius: "var(--radius-full)",
        backgroundColor: config.dotColor,
        flexShrink: 0,
    };

    return (
        <span style={badgeStyle}>
            <span style={dotStyle} aria-hidden="true" />
            {config.label}
        </span>
    );
};

export default OrganizerStatusBadge;
