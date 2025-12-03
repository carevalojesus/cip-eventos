import React from "react";
import { spacing, radius, fontSize, semanticColors, colors } from "@/lib/styleTokens";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: `${spacing["6xl"]} ${spacing["3xl"]}`,
    backgroundColor: semanticColors.bgPrimary,
    borderRadius: radius.xl,
    border: `1px dashed ${semanticColors.borderLight}`,
  };

  const iconContainerStyle: React.CSSProperties = {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: colors.grey[100],
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: fontSize.base,
    fontWeight: 600,
    color: semanticColors.textPrimary,
    margin: `0 0 ${spacing.xs} 0`,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: fontSize.sm,
    color: semanticColors.textMuted,
    margin: `0 0 ${spacing["2xl"]} 0`,
    textAlign: "center",
    maxWidth: "320px",
  };

  return (
    <div style={containerStyle} role="status" aria-label={title}>
      <div style={iconContainerStyle} aria-hidden="true">{icon}</div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descriptionStyle}>{description}</p>
      {action}
    </div>
  );
};
