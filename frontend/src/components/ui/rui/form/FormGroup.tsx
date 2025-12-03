import React, { type ReactNode } from "react";

interface FormGroupProps {
  children: ReactNode;
  marginBottom?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  marginBottom = "var(--form-field-gap)"
}) => {
  const groupStyle: React.CSSProperties = {
    marginBottom,
  };

  return <div style={groupStyle}>{children}</div>;
};
