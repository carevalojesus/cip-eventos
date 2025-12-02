import React, { useState } from "react";
import { IconSearch } from "@/components/icons/DuotoneIcons";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxWidth?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Buscar...",
  maxWidth = "320px",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    flex: "1",
    minWidth: "200px",
    maxWidth,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "var(--button-height-lg)",
    padding: "0 0.875rem 0 2.5rem",
    fontSize: "0.875rem",
    border: "1px solid",
    borderColor: isFocused ? "var(--color-border-focus)" : "var(--color-border-light)",
    borderRadius: "var(--radius-lg)",
    backgroundColor: "var(--color-bg-primary)",
    color: "var(--color-grey-900)",
    outline: "none",
    transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
    boxShadow: isFocused ? "0 0 0 3px var(--color-grey-100)" : "none",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  };

  return (
    <div style={wrapperStyle}>
      <div style={iconStyle}>
        <IconSearch
          size={18}
          primary="var(--color-grey-400)"
          secondary="var(--color-grey-300)"
        />
      </div>
      <input
        type="text"
        style={inputStyle}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
};
