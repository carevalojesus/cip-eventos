import React from "react";
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

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
}) => {
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  // Encontrar el texto más largo para mantener ancho fijo
  const longestLabel = options.reduce(
    (longest, opt) => (opt.label.length > longest.length ? opt.label : longest),
    placeholder
  );

  const buttonStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-grid",
    alignItems: "center",
    height: "40px",
    padding: "0 36px 0 16px",
    fontSize: "var(--font-size-sm)",
    fontWeight: 400,
    textAlign: "left",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
    outline: "none",
    whiteSpace: "nowrap",
  };

  const getButtonStyle = (isOpen: boolean): React.CSSProperties => ({
    ...buttonStyle,
    border: `1px solid ${isOpen ? "#B8B2A7" : "#D3CEC4"}`,
    color: selectedOption ? "#27241D" : "#857F72",
    boxShadow: isOpen
      ? "0 0 0 3px rgba(184, 178, 167, 0.25)"
      : "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  });

  const chevronStyle: React.CSSProperties = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#857F72",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const optionsStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 50,
    marginTop: "4px",
    minWidth: "100%",
    maxHeight: "240px",
    overflowY: "auto",
    backgroundColor: "#FFFFFF",
    border: "1px solid #D3CEC4",
    borderRadius: "6px",
    boxShadow: "var(--shadow-dropdown)",
    padding: "4px",
    outline: "none",
  };

  const getOptionStyle = (isSelected: boolean, isFocused: boolean): React.CSSProperties => ({
    padding: "10px 12px",
    fontSize: "var(--font-size-sm)",
    color: isSelected ? "#27241D" : "#504A40",
    fontWeight: isSelected ? 500 : 400,
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: isFocused ? "#FAF9F7" : "transparent",
    transition: "background-color 100ms ease",
    listStyle: "none",
  });

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div style={{ position: "relative", display: "inline-block" }}>
          <ListboxButton style={getButtonStyle(open)}>
            {/* Texto invisible para mantener ancho fijo */}
            <span style={{ visibility: "hidden", gridArea: "1 / 1" }}>
              {longestLabel}
            </span>
            {/* Texto visible */}
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
                        width: "16px",
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
                          stroke="var(--color-action)"
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
  );
};
