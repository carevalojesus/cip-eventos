import React from "react";

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  error,
  hint,
  required,
  disabled = false,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--form-label-gap)",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: "var(--color-grey-700)",
    lineHeight: 1.5,
  };

  const requiredStyle: React.CSSProperties = {
    color: "var(--color-red-600)",
    marginLeft: "var(--space-0-5)",
  };

  const selectWrapperStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    height: "var(--button-height-md)",
    padding: "0 var(--space-10) 0 var(--space-4)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 400,
    borderRadius: "var(--radius-md)",
    backgroundColor: disabled ? "var(--color-grey-50)" : "var(--color-white)",
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    opacity: disabled ? 0.7 : 1,
    border: `1px solid ${error ? "var(--color-red-600)" : "var(--color-grey-300)"}`,
    color: selectedOption ? "var(--color-grey-900)" : "var(--color-grey-500)",
    boxShadow: "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  };

  const chevronStyle: React.CSSProperties = {
    position: "absolute",
    right: "var(--space-3)",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "var(--color-grey-500)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const hintStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: error ? "var(--color-red-600)" : "var(--color-grey-500)",
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={requiredStyle}>*</span>}
        </label>
      )}

      <div style={selectWrapperStyle}>
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={selectStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-grey-400)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(184, 178, 167, 0.25)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--color-red-600)" : "var(--color-grey-300)";
            e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(39, 36, 29, 0.06)";
          }}
        >
          {!value && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span style={chevronStyle}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>

      {(error || hint) && <span style={hintStyle}>{error || hint}</span>}
    </div>
  );
};
