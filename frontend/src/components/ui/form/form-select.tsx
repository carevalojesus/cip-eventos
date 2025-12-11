import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

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
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

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
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Pequeño delay para evitar cerrar inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleOptionClick(options[focusedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedIndex, options]);

  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Establecer foco inicial en la opción seleccionada
        const selectedIndex = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
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

  const buttonStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "var(--button-height-md)",
    padding: "0 var(--space-3) 0 var(--space-4)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 400,
    textAlign: "left",
    borderRadius: "var(--radius-md)",
    backgroundColor: disabled ? "var(--color-grey-50)" : "var(--color-white)",
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    opacity: disabled ? 0.7 : 1,
    border: `1px solid ${
      error
        ? "var(--color-red-600)"
        : isOpen
          ? "var(--color-grey-400)"
          : "var(--color-grey-300)"
    }`,
    color: selectedOption ? "var(--color-grey-900)" : "var(--color-grey-500)",
    boxShadow: isOpen
      ? "0 0 0 3px rgba(184, 178, 167, 0.25)"
      : "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "fixed",
    top: dropdownPosition.top,
    left: dropdownPosition.left,
    width: dropdownPosition.width || 200,
    zIndex: 99999,
    maxHeight: "240px",
    overflowY: "auto",
    backgroundColor: "var(--color-white)",
    border: "1px solid var(--color-grey-300)",
    borderRadius: "var(--radius-md)",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "var(--space-1)",
    margin: 0,
    listStyle: "none",
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
    backgroundColor: isFocused ? "var(--color-grey-100)" : "transparent",
    transition: "background-color 100ms ease",
    listStyle: "none",
  });

  const hintStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: error ? "var(--color-red-600)" : "var(--color-grey-500)",
  };

  const dropdown = isOpen ? (
    <ul
      ref={dropdownRef}
      role="listbox"
      aria-labelledby="form-select-label"
      style={dropdownStyle}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isFocused = index === focusedIndex;

        return (
          <li
            key={option.value}
            role="option"
            aria-selected={isSelected}
            style={getOptionStyle(isSelected, isFocused)}
            onClick={() => handleOptionClick(option.value)}
            onMouseEnter={() => setFocusedIndex(index)}
          >
            <span
              style={{
                width: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isSelected && (
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
        );
      })}
    </ul>
  ) : null;

  return (
    <div style={containerStyle}>
      {label && (
        <label id="form-select-label" style={labelStyle}>
          {label}
          {required && <span style={requiredStyle}>*</span>}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={label ? "form-select-label" : undefined}
        style={buttonStyle}
        onClick={handleButtonClick}
        disabled={disabled}
      >
        <span>{displayLabel}</span>
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
            color: "var(--color-grey-500)",
            flexShrink: 0,
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {createPortal(dropdown, document.body)}

      {(error || hint) && <span style={hintStyle}>{error || hint}</span>}
    </div>
  );
};
