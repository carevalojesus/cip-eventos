import React, { useState, useId } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { spacing, radius, fontSize, buttonHeight, transition, semanticColors, colors } from "@/lib/styleTokens";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxWidth?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Called when user presses Enter */
  onSubmit?: () => void;
  /** Called when user presses Escape */
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Buscar...",
  maxWidth = "320px",
  ariaLabel = "Search",
  onSubmit,
  onClear,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useId();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onChange("");
      onClear?.();
      e.currentTarget.blur();
    } else if (e.key === "Enter") {
      onSubmit?.();
    }
  };

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    flex: "1",
    minWidth: "200px",
    maxWidth,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: buttonHeight.lg,
    padding: `0 ${spacing.md} 0 ${spacing["4xl"]}`,
    fontSize: fontSize.sm,
    border: "1px solid",
    borderColor: isFocused ? semanticColors.borderFocus : semanticColors.borderLight,
    borderRadius: radius.lg,
    backgroundColor: semanticColors.bgPrimary,
    color: semanticColors.textPrimary,
    outline: "none",
    transition: `border-color ${transition.fast}, box-shadow ${transition.fast}`,
    boxShadow: isFocused ? `0 0 0 3px ${colors.grey[100]}` : "none",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: spacing.md,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  };

  return (
    <div style={wrapperStyle}>
      <label htmlFor={inputId} className="sr-only">
        {ariaLabel}
      </label>
      <div style={iconStyle} aria-hidden="true">
        <MagnifyingGlass size={18} color={colors.grey[400]} />
      </div>
      <input
        id={inputId}
        type="search"
        role="searchbox"
        style={inputStyle}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
      />
    </div>
  );
};
