import React, { useRef, useState, useEffect, useCallback } from "react";
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

// Componente interno para manejar el dropdown con position tracking
const DROPDOWN_MAX_HEIGHT = 240;
const DROPDOWN_GAP = 4;

const DropdownOptions: React.FC<{
    options: FormSelectOption[];
    containerRef: React.RefObject<HTMLDivElement>;
    isOpen: boolean;
}> = ({ options, containerRef, isOpen }) => {
    const [position, setPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
        openUpward: false,
    });

    const updatePosition = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Calcular espacio disponible arriba y abajo
            const spaceBelow = viewportHeight - rect.bottom - DROPDOWN_GAP;
            const spaceAbove = rect.top - DROPDOWN_GAP;

            // Decidir si abrir hacia arriba o abajo
            const openUpward =
                spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;

            // Calcular la altura real del dropdown (puede ser menor si hay pocas opciones)
            const estimatedHeight = Math.min(
                DROPDOWN_MAX_HEIGHT,
                options.length * 44
            );

            setPosition({
                top: openUpward
                    ? rect.top - estimatedHeight - DROPDOWN_GAP
                    : rect.bottom + DROPDOWN_GAP,
                left: rect.left,
                width: rect.width,
                openUpward,
            });
        }
    }, [containerRef, options.length]);

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

    const dropdownStyle: React.CSSProperties = {
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width || 200,
        maxHeight: `${DROPDOWN_MAX_HEIGHT}px`,
        overflowY: "auto",
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-grey-300)",
        borderRadius: "var(--radius-md)",
        boxShadow: position.openUpward
            ? "0 -10px 15px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)"
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
        backgroundColor: isFocused ? "var(--color-grey-100)" : "transparent",
        transition: "background-color 100ms ease",
        listStyle: "none",
    });

    return (
        <ListboxOptions
            modal={false}
            className="form-select-dropdown"
            style={dropdownStyle}
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
                                    width: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
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
                            <span
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {option.label}
                            </span>
                        </li>
                    )}
                </ListboxOption>
            ))}
        </ListboxOptions>
    );
};

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value);
    const displayLabel = selectedOption?.label || placeholder;

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

    const getButtonStyle = (isOpen: boolean): React.CSSProperties => ({
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
        backgroundColor: disabled
            ? "var(--color-grey-50)"
            : "var(--color-white)",
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        opacity: disabled ? 0.7 : 1,
        border: `1px solid ${
            error
                ? "var(--color-red-600)"
                : isOpen
                ? "var(--color-grey-400)"
                : isHovered
                ? "var(--color-grey-400)"
                : "var(--color-grey-300)"
        }`,
        color: selectedOption
            ? "var(--color-grey-900)"
            : "var(--color-grey-500)",
        boxShadow: isOpen
            ? "0 0 0 3px rgba(184, 178, 167, 0.25)"
            : "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
    });

    const chevronStyle: React.CSSProperties = {
        color: "var(--color-grey-500)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
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

            <Listbox value={value} onChange={onChange} disabled={disabled}>
                {({ open }) => (
                    <div
                        ref={containerRef}
                        style={{ position: "relative" }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <ListboxButton style={getButtonStyle(open)}>
                            <span
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
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
                                        transform: open
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                        transition: "transform 150ms ease",
                                    }}
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </span>
                        </ListboxButton>

                        <DropdownOptions
                            options={options}
                            containerRef={containerRef}
                            isOpen={open}
                        />
                    </div>
                )}
            </Listbox>

            {(error || hint) && <span style={hintStyle}>{error || hint}</span>}
        </div>
    );
};
