/**
 * EventAdminModalityBadge Component
 *
 * Badge visual para mostrar la modalidad del evento con iconos Phosphor.
 */
import React from "react";
import { MapPin, VideoCamera, MonitorPlay } from "@phosphor-icons/react";

interface EventAdminModalityBadgeProps {
  modalityName: string;
  size?: "sm" | "md";
}

export const EventAdminModalityBadge: React.FC<EventAdminModalityBadgeProps> = ({
  modalityName,
  size = "sm",
}) => {
  const normalizedName = modalityName.toLowerCase();

  const getConfig = () => {
    if (normalizedName.includes("presencial") || normalizedName.includes("in-person")) {
      return {
        icon: <MapPin size={size === "sm" ? 14 : 16} weight="duotone" />,
        backgroundColor: "var(--color-cyan-100)",
        color: "var(--color-cyan-700)",
      };
    }

    if (normalizedName.includes("virtual") || normalizedName.includes("online")) {
      return {
        icon: <VideoCamera size={size === "sm" ? 14 : 16} weight="duotone" />,
        backgroundColor: "var(--color-green-100)",
        color: "var(--color-green-700)",
      };
    }

    // Híbrido o default
    return {
      icon: <MonitorPlay size={size === "sm" ? 14 : 16} weight="duotone" />,
      backgroundColor: "var(--color-yellow-100)",
      color: "var(--color-yellow-700)",
    };
  };

  const config = getConfig();

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

  return (
    <span style={badgeStyle}>
      {config.icon}
      {modalityName}
    </span>
  );
};

export default EventAdminModalityBadge;
