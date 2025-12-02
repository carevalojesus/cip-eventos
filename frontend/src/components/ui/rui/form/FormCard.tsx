import React, { type ReactNode } from "react";

interface FormCardProps {
  title?: string;
  children: ReactNode;
}

export const FormCard: React.FC<FormCardProps> = ({ title, children }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-primary)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--color-grey-100)",
    padding: "var(--space-6)",
    marginBottom: "var(--space-6)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-base)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    marginBottom: "var(--space-5)",
    paddingBottom: "var(--space-3)",
    borderBottom: "1px solid var(--color-grey-100)",
  };

  return (
    <div style={cardStyle}>
      {title && <h2 style={titleStyle}>{title}</h2>}
      {children}
    </div>
  );
};
