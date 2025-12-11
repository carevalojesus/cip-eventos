import React, { useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

interface SelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  maxLabelLength?: number;
}

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  fullWidth = false,
  maxLabelLength,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  // Función para truncar texto
  const truncateText = (text: string, maxLength?: number) => {
    if (!maxLength || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const displayLabel = truncateText(selectedOption?.label || placeholder, maxLabelLength);

  // Encontrar el texto más largo para mantener ancho fijo (solo si no es fullWidth)
  const longestLabel = fullWidth
    ? placeholder
    : options.reduce(
        (longest, opt) => (opt.label.length > longest.length ? opt.label : longest),
        placeholder
      );

  const buttonStyle: React.CSSProperties = {
    position: "relative",
    display: fullWidth ? "flex" : "inline-grid",
    alignItems: "center",
    height: "var(--button-height-lg)",
    padding: "0 var(--space-8) 0 var(--space-3)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 400,
    textAlign: "left",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--color-bg-primary)",
    cursor: "pointer",
    outline: "none",
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : "auto",
    overflow: "hidden",
  };

  const getButtonStyle = (isOpen: boolean): React.CSSProperties => ({
    ...buttonStyle,
    border: `1px solid ${isOpen ? "var(--color-grey-300)" : isHovered ? "var(--color-grey-300)" : "var(--color-grey-200)"}`,
    color: selectedOption ? "var(--color-grey-900)" : "var(--color-grey-500)",
    backgroundColor: isHovered && !isOpen ? "var(--color-grey-050)" : "var(--color-bg-primary)",
    boxShadow: isOpen
      ? "var(--ring-neutral)"
      : "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
    transition: "all 150ms ease",
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
    position: "absolute",
    zIndex: 50,
    marginTop: "var(--space-1)",
    minWidth: "100%",
    maxHeight: "240px",
    overflowY: "auto",
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-dropdown)",
    padding: "var(--space-1)",
    outline: "none",
  };

  const getOptionStyle = (isSelected: boolean, isFocused: boolean): React.CSSProperties => ({
    padding: "var(--space-2) var(--space-3)",
    fontSize: "var(--font-size-sm)",
    color: isSelected ? "var(--color-grey-900)" : "var(--color-grey-700)",
    fontWeight: isSelected ? 500 : 400,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    backgroundColor: isFocused ? "var(--color-grey-050)" : "transparent",
    transition: "background-color 100ms ease",
    listStyle: "none",
  });

  const optionTextStyle: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div
          style={{ position: "relative", display: fullWidth ? "block" : "inline-block", width: fullWidth ? "100%" : "auto" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <ListboxButton style={getButtonStyle(open)}>
            {/* Texto invisible para mantener ancho fijo (solo si no es fullWidth) */}
            {!fullWidth && (
              <span style={{ visibility: "hidden", gridArea: "1 / 1" }}>
                {longestLabel}
              </span>
            )}
            {/* Texto visible */}
            <span style={{
              gridArea: fullWidth ? undefined : "1 / 1",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: fullWidth ? 1 : undefined,
            }}>
              {displayLabel}
            </span>
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

          <ListboxOptions style={optionsStyle}>
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
                        width: "14px",
                        height: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {selected && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-action)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span style={optionTextStyle} title={option.label}>{option.label}</span>
                  </li>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      )}
    </Listbox>
  );
};

// Alias for backward compatibility
export const Select = SimpleSelect;
