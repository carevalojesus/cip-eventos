import React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

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
  const displayLabel = selectedOption?.label || placeholder;

  const longestLabel = options.reduce(
    (longest, opt) => (opt.label.length > longest.length ? opt.label : longest),
    placeholder
  );

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

  const buttonStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-grid",
    alignItems: "center",
    width: "100%",
    height: "var(--button-height-md)",
    padding: "0 var(--space-10) 0 var(--space-4)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 400,
    textAlign: "left",
    borderRadius: "var(--radius-md)",
    backgroundColor: disabled ? "var(--color-grey-50)" : "var(--color-white)",
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.7 : 1,
  };

  const getButtonDynamicStyle = (isOpen: boolean): React.CSSProperties => ({
    ...buttonStyle,
    border: `1px solid ${error ? "var(--color-red-600)" : isOpen ? "var(--color-grey-400)" : "var(--color-grey-300)"}`,
    color: selectedOption ? "var(--color-grey-900)" : "var(--color-grey-500)",
    boxShadow: isOpen
      ? "0 0 0 3px rgba(184, 178, 167, 0.25)"
      : "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  });

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

  const optionsStyle: React.CSSProperties = {
    zIndex: 99999,
    width: "var(--button-width, 100%)",
    maxHeight: "240px",
    overflowY: "auto",
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-grey-300)",
    borderRadius: "var(--radius-md)",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "var(--space-1)",
    outline: "none",
  };

  const getOptionStyle = (
    isSelected: boolean,
    isFocused: boolean
  ): React.CSSProperties => ({
    padding: "10px var(--space-3)",
    fontSize: "var(--font-size-sm)",
    color: isSelected ? "var(--color-grey-900)" : "var(--color-grey-700)",
    fontWeight: isSelected ? 500 : 400,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    backgroundColor: isFocused ? "var(--color-grey-50)" : "transparent",
    transition: "background-color 100ms ease",
    listStyle: "none",
  });

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

      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div style={{ position: "relative" }}>
            <ListboxButton style={getButtonDynamicStyle(open)}>
              <span style={{ visibility: "hidden", gridArea: "1 / 1" }}>
                {longestLabel}
              </span>
              <span style={{ gridArea: "1 / 1" }}>{displayLabel}</span>
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
                  style={{
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease",
                  }}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </ListboxButton>

            <ListboxOptions anchor={{ to: "bottom", gap: "4px" }} portal={true} className="form-select-options" style={optionsStyle}>
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  as={React.Fragment}
                >
                  {({ selected, focus }) => (
                    <li style={getOptionStyle(selected, focus)}>
                      <span
                        style={{
                          width: "var(--space-4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selected && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-red-600)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span>{option.label}</span>
                    </li>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        )}
      </Listbox>

      {(error || hint) && <span style={hintStyle}>{error || hint}</span>}
    </div>
  );
};
