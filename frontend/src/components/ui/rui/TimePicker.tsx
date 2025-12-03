import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { getCurrentLocale } from "@/lib/routes";

interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

// Generate time options every 30 minutes
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const locale = getCurrentLocale();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to selected time when opening
  useEffect(() => {
    if (isOpen && listRef.current && value) {
      const selectedIndex = timeOptions.indexOf(value);
      if (selectedIndex !== -1) {
        const itemHeight = 36;
        listRef.current.scrollTop = selectedIndex * itemHeight - 72;
      }
    }
  }, [isOpen, value]);

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
  };

  // Format display time
  const formatDisplayTime = (time: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    if (locale === "en") {
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${displayHour}:${minutes} ${period}`;
    }
    return time;
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "var(--font-size-sm)",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-2)",
          }}
        >
          {label}
          {required && <span style={{ color: "var(--color-primary)", marginLeft: "2px" }}>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          height: "40px",
          padding: "0 var(--space-3)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          fontSize: "var(--font-size-sm)",
          color: value ? "var(--color-text-primary)" : "var(--color-grey-400)",
          backgroundColor: "var(--color-bg-primary)",
          border: `1px solid ${error ? "var(--color-primary)" : isOpen ? "var(--color-grey-400)" : "var(--color-grey-200)"}`,
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          outline: "none",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(184, 178, 167, 0.2)" : "none",
        }}
      >
        <Clock size={16} style={{ color: "var(--color-grey-400)", flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left" }}>
          {formatDisplayTime(value) || placeholder || (locale === "es" ? "Hora" : "Time")}
        </span>
      </button>

      {error && (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-primary)", marginTop: "var(--space-1)", display: "block" }}>
          {error}
        </span>
      )}

      {/* Time Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: "var(--color-bg-primary)",
            border: "1px solid var(--color-grey-200)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-dropdown)",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {timeOptions.map((time) => {
            const isSelected = value === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => handleTimeSelect(time)}
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 var(--space-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                  backgroundColor: isSelected ? "var(--color-red-050)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 100ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {formatDisplayTime(time)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
