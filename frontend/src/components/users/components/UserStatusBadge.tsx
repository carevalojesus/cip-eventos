/**
 * UserStatusBadge Component
 *
 * Badge visual para mostrar el estado del usuario:
 * - Activo: Verde con dot
 * - Inactivo: Gris con borde
 * - Pendiente: Amarillo (cuando está activo pero no verificado)
 *
 * Siguiendo la paleta de colores del proyecto.
 */
import React from "react";
import { useTranslation } from "react-i18next";

interface UserStatusBadgeProps {
  /** Si el usuario está activo */
  isActive: boolean;
  /** Si el usuario está pendiente de verificación (opcional) */
  isPending?: boolean;
  /** Tamaño del badge */
  size?: "sm" | "md";
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  isActive,
  isPending = false,
  size = "sm",
}) => {
  const { t } = useTranslation();

  // Determinar el estado visual
  const status = !isActive ? "inactive" : isPending ? "pending" : "active";

  // Configuración de colores por estado
  const statusConfig = {
    active: {
      backgroundColor: "var(--color-green-100)",
      color: "var(--color-green-700)",
      dotColor: "var(--color-green-500)",
      label: t("users.list.status.active", "Activo"),
    },
    inactive: {
      backgroundColor: "var(--color-grey-100)",
      color: "var(--color-grey-600)",
      dotColor: "var(--color-grey-400)",
      label: t("users.list.status.inactive", "Inactivo"),
    },
    pending: {
      backgroundColor: "var(--color-yellow-100)",
      color: "var(--color-yellow-800)",
      dotColor: "var(--color-yellow-500)",
      label: t("users.list.status.pending", "Pendiente"),
    },
  };

  const config = statusConfig[status];

  // Estilos
  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    padding: size === "sm" ? "var(--space-1) var(--space-3)" : "var(--space-2) var(--space-3)",
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

export default UserStatusBadge;
