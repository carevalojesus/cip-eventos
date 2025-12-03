import React from "react";
import { spacing, fontSize, semanticColors, lineHeight } from "@/lib/styleTokens";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
}) => {
  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing["2xl"],
  };

  const contentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: fontSize["2xl"],
    fontWeight: 600,
    color: semanticColors.textPrimary,
    margin: 0,
    lineHeight: lineHeight.tight,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: fontSize.sm,
    color: semanticColors.textMuted,
    margin: 0,
  };

  return (
    <header style={headerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
};
