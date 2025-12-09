import React from "react";
import { Check, Minus } from "@phosphor-icons/react";

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  size?: "sm" | "md";
  ariaLabel?: string;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  indeterminate = false,
  size = "md",
  ariaLabel,
  disabled = false,
}) => {
  const isActive = checked || indeterminate;

  const sizeMap = {
    sm: { box: 16, icon: 10 },
    md: { box: 18, icon: 12 },
  };

  const dimensions = sizeMap[size];

  const checkboxStyle: React.CSSProperties = {
    width: `${dimensions.box}px`,
    height: `${dimensions.box}px`,
    borderRadius: "var(--radius-sm)",
    border: `1.5px solid ${isActive ? "var(--color-red-500)" : "var(--color-grey-300)"}`,
    backgroundColor: isActive ? "var(--color-red-500)" : "var(--color-bg-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 150ms ease",
    flexShrink: 0,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      style={checkboxStyle}
      aria-label={ariaLabel}
      aria-checked={indeterminate ? "mixed" : checked}
      role="checkbox"
      disabled={disabled}
    >
      {checked && !indeterminate && (
        <Check size={dimensions.icon} weight="bold" color="white" />
      )}
      {indeterminate && (
        <Minus size={dimensions.icon} weight="bold" color="white" />
      )}
    </button>
  );
};

export default Checkbox;
