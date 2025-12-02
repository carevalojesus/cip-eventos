import React from "react";

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
    marginBottom: "1.5rem",
  };

  const contentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--color-grey-500)",
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
