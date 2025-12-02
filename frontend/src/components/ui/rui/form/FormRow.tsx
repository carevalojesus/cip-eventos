import React, { type ReactNode } from "react";

interface FormRowProps {
  children: ReactNode;
  columns?: 2 | 3;
}

export const FormRow: React.FC<FormRowProps> = ({ children, columns = 2 }) => {
  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "16px",
  };

  return <div style={rowStyle}>{children}</div>;
};
