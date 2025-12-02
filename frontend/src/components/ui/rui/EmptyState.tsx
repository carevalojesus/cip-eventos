import React from "react";

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
    padding: "4rem 2rem",
    backgroundColor: "var(--color-bg-primary)",
    borderRadius: "var(--radius-xl)",
    border: "1px dashed var(--color-border-light)",
  };

  const iconContainerStyle: React.CSSProperties = {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "var(--color-grey-100)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1rem",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    margin: "0 0 0.25rem 0",
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--color-grey-500)",
    margin: "0 0 1.5rem 0",
    textAlign: "center",
    maxWidth: "320px",
  };

  return (
    <div style={containerStyle}>
      <div style={iconContainerStyle}>{icon}</div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descriptionStyle}>{description}</p>
      {action}
    </div>
  );
};
