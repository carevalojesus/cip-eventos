import React, { useState } from "react";
import { Check, CaretDown, X } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterComboboxProps {
  /** Label shown in the trigger button */
  label: string;
  /** Current selected value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Available options */
  options: FilterOption[];
  /** Value that represents "all" / no filter */
  allValue?: string;
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Empty state message */
  emptyMessage?: string;
}

export const FilterCombobox: React.FC<FilterComboboxProps> = ({
  label,
  value,
  onChange,
  options,
  allValue = "all",
  placeholder,
  emptyMessage = "Sin resultados",
}) => {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasFilter = value !== allValue;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(allValue);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };

  // Display text - solo muestra el valor cuando hay filtro activo
  const displayText = hasFilter && selectedOption
    ? selectedOption.label
    : placeholder || label;

  // Estilos base del trigger
  const getTriggerStyle = (): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: "var(--button-height-lg)",
    padding: "0 10px 0 12px",
    fontSize: "var(--font-size-sm)",
    fontWeight: hasFilter ? 500 : 400,
    borderRadius: "var(--radius-md)",
    border: `1px solid ${
      open
        ? "var(--color-grey-400)"
        : isHovered
          ? "var(--color-grey-300)"
          : "var(--color-grey-200)"
    }`,
    backgroundColor: isHovered && !open ? "var(--color-grey-050)" : "var(--color-bg-primary)",
    color: hasFilter ? "var(--color-grey-900)" : "var(--color-grey-600)",
    cursor: "pointer",
    outline: "none",
    transition: "all 150ms ease",
    whiteSpace: "nowrap",
    boxShadow: open ? "var(--ring-neutral)" : "none",
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={`Filtrar por ${label}`}
          style={getTriggerStyle()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Indicador de filtro activo */}
          {hasFilter && (
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--color-red-100)",
                flexShrink: 0,
              }}
            />
          )}

          {/* Label y valor */}
          <span style={{ color: hasFilter ? "var(--color-grey-500)" : undefined }}>
            {label}
          </span>
          {hasFilter && (
            <>
              <span style={{ color: "var(--color-grey-300)" }}>|</span>
              <span>{displayText}</span>
            </>
          )}

          {/* Botón limpiar o chevron */}
          {hasFilter ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label={`Limpiar filtro ${label}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "16px",
                height: "16px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "transparent",
                color: "var(--color-grey-400)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginLeft: "2px",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-grey-100)";
                e.currentTarget.style.color = "var(--color-grey-600)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-grey-400)";
              }}
            >
              <X size={12} weight="bold" />
            </button>
          ) : (
            <CaretDown
              size={14}
              weight="bold"
              style={{
                color: "var(--color-grey-400)",
                flexShrink: 0,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 150ms ease",
              }}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[200px] p-0"
        align="start"
        style={{
          backgroundColor: "var(--color-bg-primary)",
          border: "1px solid var(--color-grey-200)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-dropdown)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <Command>
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "var(--font-size-sm)",
                    color: option.value === value
                      ? "var(--color-grey-900)"
                      : "var(--color-grey-700)",
                    fontWeight: option.value === value ? 500 : 400,
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {option.value === value && (
                      <Check
                        size={14}
                        weight="bold"
                        style={{ color: "var(--color-red-100)" }}
                      />
                    )}
                  </span>
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default FilterCombobox;
