import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  const longestLabel = options.reduce(
    (longest, opt) => (opt.label.length > longest.length ? opt.label : longest),
    placeholder
  );

  // Calcular posición del dropdown
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Actualizar posición cuando se abre y en scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Si el click es fuera del botón y fuera del dropdown, cerrar
        if (
          buttonRef.current && 
          !buttonRef.current.contains(target) &&
          !target.closest('.form-select-options')
        ) {
          setIsOpen(false);
        }
      };
      
      // Usar timeout para evitar que el click que abrió el dropdown lo cierre
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
  };

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
    border: `1px solid ${error ? "var(--color-red-600)" : isOpen ? "var(--color-grey-400)" : "var(--color-grey-300)"}`,
    color: selectedOption ? "var(--color-grey-900)" : "var(--color-grey-500)",
    boxShadow: isOpen
      ? "0 0 0 3px rgba(184, 178, 167, 0.25)"
      : "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
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

  const optionsStyle: React.CSSProperties = {
    position: "fixed",
    top: dropdownPosition.top,
    left: dropdownPosition.left,
    width: dropdownPosition.width || "auto",
    minWidth: "200px",
    zIndex: 99999,
    maxHeight: "240px",
    overflowY: "auto",
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-grey-300)",
    borderRadius: "var(--radius-md)",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "var(--space-1)",
    outline: "none",
    listStyle: "none",
    margin: 0,
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

      <Listbox value={value} onChange={handleSelect} disabled={disabled}>
        <div style={{ position: "relative" }}>
          <ListboxButton 
            ref={buttonRef} 
            style={buttonStyle}
            onClick={handleButtonClick}
          >
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
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </ListboxButton>

          {isOpen && createPortal(
            <ListboxOptions 
              static 
              className="form-select-options" 
              style={optionsStyle}
            >
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
            </ListboxOptions>,
            document.body
          )}
        </div>
      </Listbox>

      {(error || hint) && <span style={hintStyle}>{error || hint}</span>}
    </div>
  );
};
