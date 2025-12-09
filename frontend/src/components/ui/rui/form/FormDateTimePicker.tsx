import React, { useState, useRef, useEffect, useMemo } from "react";
import { format, isValid } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { getCurrentLocale } from "@/lib/routes";
import { IconCalendar, IconClock } from "@/components/icons/DuotoneIcons";

interface FormDateTimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Minimum allowed datetime (ISO string) */
  minDate?: string;
  /** Maximum allowed datetime (ISO string) */
  maxDate?: string;
}

// Generar opciones de hora (cada 30 minutos)
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

const allTimeOptions = generateTimeOptions();

export const FormDateTimePicker: React.FC<FormDateTimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  minDate,
  maxDate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  const locale = getCurrentLocale();
  const dateLocale = locale === "es" ? es : enUS;

  // Parse dates
  const hasValue = value && isValid(new Date(value));
  const currentDate = hasValue ? new Date(value) : null;
  const currentTime = currentDate ? format(currentDate, "HH:mm") : null;

  // Parse min/max dates
  const minDateObj = useMemo(() => (minDate ? new Date(minDate) : null), [minDate]);
  const maxDateObj = useMemo(() => (maxDate ? new Date(maxDate) : null), [maxDate]);

  // Initialize calendar to the correct month (minDate month or current value month)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (currentDate) return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    if (minDateObj) return new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1);
    return new Date();
  });

  // Update currentMonth when minDate changes and no value selected
  useEffect(() => {
    if (!currentDate && minDateObj) {
      setCurrentMonth(new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1));
    }
  }, [minDateObj, currentDate]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if a day is disabled
  const isDateDisabled = (day: Date): boolean => {
    if (!day) return true;
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    if (minDateObj) {
      const minDayStart = new Date(minDateObj);
      minDayStart.setHours(0, 0, 0, 0);
      if (dayStart < minDayStart) return true;
    }
    if (maxDateObj) {
      const maxDayEnd = new Date(maxDateObj);
      maxDayEnd.setHours(23, 59, 59, 999);
      if (dayEnd > maxDayEnd) return true;
    }
    return false;
  };

  // Get available time options based on selected date and min/max constraints
  const getAvailableTimeOptions = useMemo(() => {
    if (!currentDate) return allTimeOptions;

    const selectedDateStr = format(currentDate, "yyyy-MM-dd");
    const minDateStr = minDateObj ? format(minDateObj, "yyyy-MM-dd") : null;
    const maxDateStr = maxDateObj ? format(maxDateObj, "yyyy-MM-dd") : null;

    let minTimeStr: string | null = null;
    let maxTimeStr: string | null = null;

    // If selected date is the same as minDate, restrict minimum time
    if (minDateStr && selectedDateStr === minDateStr && minDateObj) {
      minTimeStr = format(minDateObj, "HH:mm");
    }

    // If selected date is the same as maxDate, restrict maximum time
    if (maxDateStr && selectedDateStr === maxDateStr && maxDateObj) {
      maxTimeStr = format(maxDateObj, "HH:mm");
    }

    return allTimeOptions.filter((time) => {
      if (minTimeStr && time < minTimeStr) return false;
      if (maxTimeStr && time > maxTimeStr) return false;
      return true;
    });
  }, [currentDate, minDateObj, maxDateObj]);

  // Check if a time option is disabled
  const isTimeDisabled = (time: string): boolean => {
    return !getAvailableTimeOptions.includes(time);
  };

  const handleDateSelect = (date: Date) => {
    // Determine default time based on constraints
    let timeStr = currentTime || "09:00";

    const selectedDateStr = format(date, "yyyy-MM-dd");
    const minDateStr = minDateObj ? format(minDateObj, "yyyy-MM-dd") : null;
    const maxDateStr = maxDateObj ? format(maxDateObj, "yyyy-MM-dd") : null;

    // If selecting minDate day, use minDate time as minimum
    if (minDateStr && selectedDateStr === minDateStr && minDateObj) {
      const minTime = format(minDateObj, "HH:mm");
      if (timeStr < minTime) {
        timeStr = minTime;
      }
    }

    // If selecting maxDate day, ensure time doesn't exceed max
    if (maxDateStr && selectedDateStr === maxDateStr && maxDateObj) {
      const maxTime = format(maxDateObj, "HH:mm");
      if (timeStr > maxTime) {
        timeStr = maxTime;
      }
    }

    const dateStr = format(date, "yyyy-MM-dd");
    onChange(`${dateStr}T${timeStr}`);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (time: string) => {
    const dateStr = currentDate
      ? format(currentDate, "yyyy-MM-dd")
      : minDateObj
        ? format(minDateObj, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
    onChange(`${dateStr}T${time}`);
    setShowTimePicker(false);
  };

  // Calendar generation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before first day
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
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
    marginLeft: "2px",
  };

  const inputGroupStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    border: `1px solid ${error ? "var(--color-red-500)" : "var(--color-grey-300)"}`,
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--color-bg-primary)",
    boxShadow: "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
  };

  const dateButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    height: "40px",
    padding: "0 12px",
    fontSize: "var(--font-size-sm)",
    color: hasValue ? "var(--color-grey-900)" : "var(--color-grey-500)",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
    cursor: "pointer",
    outline: "none",
    transition: "background-color 150ms ease",
  };

  const separatorStyle: React.CSSProperties = {
    width: "1px",
    backgroundColor: "var(--color-grey-300)",
    margin: "8px 0",
  };

  const timeButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    height: "40px",
    padding: "0 12px",
    fontSize: "var(--font-size-sm)",
    color: currentTime ? "var(--color-grey-900)" : "var(--color-grey-500)",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "0 var(--radius-md) var(--radius-md) 0",
    cursor: "pointer",
    outline: "none",
    transition: "background-color 150ms ease",
    minWidth: "90px",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    zIndex: 1000,
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-300)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-dropdown)",
    padding: "12px",
  };

  const calendarHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  };

  const monthButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    border: "none",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: "var(--color-grey-600)",
  };

  const monthLabelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    textTransform: "capitalize",
  };

  const weekdaysStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 32px)",
    gap: "2px",
    marginBottom: "4px",
  };

  const weekdayStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    fontWeight: 500,
    color: "var(--color-grey-500)",
    textAlign: "center",
    padding: "4px 0",
  };

  const daysGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 32px)",
    gap: "2px",
  };

  const getDayStyle = (
    day: Date | null,
    isSelected: boolean,
    isToday: boolean,
    isDisabled: boolean
  ): React.CSSProperties => ({
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "var(--font-size-sm)",
    fontWeight: isSelected ? 600 : 400,
    color: day
      ? isDisabled
        ? "var(--color-grey-300)"
        : isSelected
          ? "#FFFFFF"
          : isToday
            ? "var(--color-red-600)"
            : "var(--color-grey-900)"
      : "transparent",
    backgroundColor: isSelected && !isDisabled ? "var(--color-red-600)" : "transparent",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: day && !isDisabled ? "pointer" : "default",
    opacity: isDisabled ? 0.5 : 1,
    transition: "background-color 100ms ease",
  });

  const timeListStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    maxHeight: "200px",
    overflowY: "auto",
    width: "80px",
  };

  const getTimeOptionStyle = (isSelected: boolean, isDisabled: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    fontSize: "var(--font-size-sm)",
    fontWeight: isSelected ? 500 : 400,
    color: isDisabled
      ? "var(--color-grey-300)"
      : isSelected
        ? "var(--color-red-600)"
        : "var(--color-grey-700)",
    backgroundColor: isSelected && !isDisabled ? "var(--color-red-050)" : "transparent",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: isDisabled ? "default" : "pointer",
    textAlign: "center",
    opacity: isDisabled ? 0.5 : 1,
    transition: "background-color 100ms ease",
  });

  const hintStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: error ? "var(--color-red-600)" : "var(--color-grey-500)",
  };

  const weekdays =
    locale === "es"
      ? ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={requiredStyle}>*</span>}
        </label>
      )}

      {/* Combined date+time input group */}
      <div style={inputGroupStyle}>
        {/* Date Picker */}
        <div ref={dateRef} style={{ position: "relative", flex: 1 }}>
          <button
            type="button"
            style={{
              ...dateButtonStyle,
              width: "100%",
              backgroundColor: showDatePicker ? "var(--color-grey-050)" : "transparent",
            }}
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowTimePicker(false);
            }}
            onMouseEnter={(e) => {
              if (!showDatePicker) e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
            }}
            onMouseLeave={(e) => {
              if (!showDatePicker) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <IconCalendar size={16} primary="var(--color-grey-500)" secondary="var(--color-grey-300)" />
            {currentDate
              ? format(currentDate, "d MMM yyyy", { locale: dateLocale })
              : locale === "es"
                ? "Fecha"
                : "Date"}
          </button>

          {showDatePicker && (
            <div style={dropdownStyle}>
              <div style={calendarHeaderStyle}>
                <button
                  type="button"
                  style={monthButtonStyle}
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-grey-050)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  ←
                </button>
                <span style={monthLabelStyle}>
                  {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
                </span>
                <button
                  type="button"
                  style={monthButtonStyle}
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-grey-050)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  →
                </button>
              </div>

              <div style={weekdaysStyle}>
                {weekdays.map((day) => (
                  <div key={day} style={weekdayStyle}>{day}</div>
                ))}
              </div>

              <div style={daysGridStyle}>
                {getDaysInMonth(currentMonth).map((day, index) => {
                  const isSelected = day && currentDate && day.toDateString() === currentDate.toDateString();
                  const isToday = day && day.toDateString() === today.toDateString();
                  const isDisabled = day ? isDateDisabled(day) : false;

                  return (
                    <button
                      key={index}
                      type="button"
                      style={getDayStyle(day, !!isSelected, !!isToday, isDisabled)}
                      onClick={() => day && !isDisabled && handleDateSelect(day)}
                      onMouseEnter={(e) => {
                        if (day && !isSelected && !isDisabled) e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
                      }}
                      onMouseLeave={(e) => {
                        if (day && !isSelected && !isDisabled) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      disabled={!day || isDisabled}
                    >
                      {day?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={separatorStyle} />

        {/* Time Picker */}
        <div ref={timeRef} style={{ position: "relative" }}>
          <button
            type="button"
            style={{
              ...timeButtonStyle,
              backgroundColor: showTimePicker ? "var(--color-grey-050)" : "transparent",
            }}
            onClick={() => {
              setShowTimePicker(!showTimePicker);
              setShowDatePicker(false);
            }}
            onMouseEnter={(e) => {
              if (!showTimePicker) e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
            }}
            onMouseLeave={(e) => {
              if (!showTimePicker) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <IconClock size={14} primary="var(--color-grey-500)" secondary="var(--color-grey-300)" />
            {currentTime || (locale === "es" ? "Hora" : "Time")}
          </button>

          {showTimePicker && (
            <div style={{ ...dropdownStyle, right: 0, left: "auto" }}>
              <div style={timeListStyle}>
                {allTimeOptions.map((time) => {
                  const isDisabled = isTimeDisabled(time);
                  const isSelected = currentTime === time;

                  return (
                    <button
                      key={time}
                      type="button"
                      style={getTimeOptionStyle(isSelected, isDisabled)}
                      onClick={() => !isDisabled && handleTimeSelect(time)}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isDisabled) e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isDisabled) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      disabled={isDisabled}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {(error || hint) && <span style={hintStyle}>{error || hint}</span>}
    </div>
  );
};
