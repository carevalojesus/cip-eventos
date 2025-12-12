/**
 * EventAdminStatusBadge Component
 *
 * Badge visual para mostrar el estado del evento.
 * Sigue la paleta Refactoring UI del proyecto.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { EventStatus } from "@/types/event";

interface EventAdminStatusBadgeProps {
  status: EventStatus;
  size?: "sm" | "md";
}

const statusConfig: Record<
  EventStatus,
  {
    backgroundColor: string;
    color: string;
    dotColor: string;
    labelKey: string;
    defaultLabel: string;
  }
> = {
  [EventStatus.PUBLISHED]: {
    backgroundColor: "var(--color-green-100)",
    color: "var(--color-green-700)",
    dotColor: "var(--color-green-500)",
    labelKey: "events.status.published",
    defaultLabel: "Publicado",
  },
  [EventStatus.DRAFT]: {
    backgroundColor: "var(--color-grey-100)",
    color: "var(--color-grey-600)",
    dotColor: "var(--color-grey-400)",
    labelKey: "events.status.draft",
    defaultLabel: "Borrador",
  },
  [EventStatus.COMPLETED]: {
    backgroundColor: "var(--color-cyan-100)",
    color: "var(--color-cyan-700)",
    dotColor: "var(--color-cyan-500)",
    labelKey: "events.status.completed",
    defaultLabel: "Completado",
  },
  [EventStatus.CANCELLED]: {
    backgroundColor: "var(--color-red-100)",
    color: "var(--color-red-700)",
    dotColor: "var(--color-red-500)",
    labelKey: "events.status.cancelled",
    defaultLabel: "Cancelado",
  },
  [EventStatus.ARCHIVED]: {
    backgroundColor: "var(--color-grey-200)",
    color: "var(--color-grey-700)",
    dotColor: "var(--color-grey-500)",
    labelKey: "events.status.archived",
    defaultLabel: "Archivado",
  },
};

export const EventAdminStatusBadge: React.FC<EventAdminStatusBadgeProps> = ({
  status,
  size = "sm",
}) => {
  const { t } = useTranslation();
  const config = statusConfig[status];

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
    whiteSpace: "nowrap",
  };

  const dotStyle: React.CSSProperties = {
    width: size === "sm" ? "6px" : "8px",
    height: size === "sm" ? "6px" : "8px",
    borderRadius: "var(--radius-full)",
    backgroundColor: config.dotColor,
    flexShrink: 0,
  };

  return (
    <span style={badgeStyle}>
      <span style={dotStyle} aria-hidden="true" />
      {t(config.labelKey, config.defaultLabel)}
    </span>
  );
};

export default EventAdminStatusBadge;
