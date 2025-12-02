import React, { type ReactNode } from "react";

interface FormGroupProps {
  children: ReactNode;
  marginBottom?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  marginBottom = "20px"
}) => {
  const groupStyle: React.CSSProperties = {
    marginBottom,
  };

  return <div style={groupStyle}>{children}</div>;
};
