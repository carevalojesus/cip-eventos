import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getCurrentLocale } from "@/lib/routes";

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = getCurrentLocale();
  const dateLocale = locale === "es" ? es : enUS;

  const selectedDate = value ? new Date(value) : null;

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

  const handleDateSelect = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for alignment
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const weekdays = locale === "es"
    ? ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
          color: selectedDate ? "var(--color-text-primary)" : "var(--color-grey-400)",
          backgroundColor: "var(--color-bg-primary)",
          border: `1px solid ${error ? "var(--color-primary)" : isOpen ? "var(--color-grey-400)" : "var(--color-grey-200)"}`,
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          outline: "none",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(184, 178, 167, 0.2)" : "none",
        }}
      >
        <Calendar size={16} style={{ color: "var(--color-grey-400)", flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left" }}>
          {selectedDate
            ? format(selectedDate, "d MMM yyyy", { locale: dateLocale })
            : placeholder || (locale === "es" ? "Seleccionar fecha" : "Select date")
          }
        </span>
      </button>

      {error && (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-primary)", marginTop: "var(--space-1)", display: "block" }}>
          {error}
        </span>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 100,
            backgroundColor: "var(--color-bg-primary)",
            border: "1px solid var(--color-grey-200)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            padding: "var(--space-3)",
            width: "280px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--space-3)",
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                color: "var(--color-grey-500)",
                cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-grey-100)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                textTransform: "capitalize",
              }}
            >
              {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                color: "var(--color-grey-500)",
                cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-grey-100)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekdays */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "2px",
              marginBottom: "var(--space-2)",
            }}
          >
            {weekdays.map((day) => (
              <div
                key={day}
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "var(--color-grey-400)",
                  textAlign: "center",
                  padding: "var(--space-1) 0",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "2px",
            }}
          >
            {/* Padding days */}
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} style={{ width: "36px", height: "36px" }} />
            ))}

            {/* Actual days */}
            {days.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected
                      ? "white"
                      : isTodayDate
                        ? "var(--color-primary)"
                        : "var(--color-text-primary)",
                    backgroundColor: isSelected ? "var(--color-primary)" : "transparent",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "background-color 100ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "var(--color-grey-100)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
