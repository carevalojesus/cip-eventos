import React, { useState, useRef, useEffect } from "react";
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

const timeOptions = generateTimeOptions();

export const FormDateTimePicker: React.FC<FormDateTimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  required,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dateRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  const locale = getCurrentLocale();
  const dateLocale = locale === "es" ? es : enUS;

  const hasValue = value && isValid(new Date(value));
  const currentDate = hasValue ? new Date(value) : null;
  const currentTime = currentDate ? format(currentDate, "HH:mm") : null;

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

  const handleDateSelect = (date: Date) => {
    const timeStr = currentTime || "09:00";
    const dateStr = format(date, "yyyy-MM-dd");
    onChange(`${dateStr}T${timeStr}`);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (time: string) => {
    const dateStr = currentDate
      ? format(currentDate, "yyyy-MM-dd")
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
    gap: "6px",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#504A40",
    lineHeight: 1.5,
  };

  const requiredStyle: React.CSSProperties = {
    color: "#BA2525",
    marginLeft: "2px",
  };

  // Combined input look - date and time in one visual group
  const inputGroupStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    border: `1px solid ${error ? "#BA2525" : "#D3CEC4"}`,
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    boxShadow: "inset 0 2px 4px rgba(39, 36, 29, 0.06)",
  };

  const dateButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    height: "40px",
    padding: "0 12px",
    fontSize: "14px",
    color: hasValue ? "#27241D" : "#857F72",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px 0 0 6px",
    cursor: "pointer",
    outline: "none",
    transition: "background-color 150ms ease",
  };

  const separatorStyle: React.CSSProperties = {
    width: "1px",
    backgroundColor: "#D3CEC4",
    margin: "8px 0",
  };

  const timeButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    height: "40px",
    padding: "0 12px",
    fontSize: "14px",
    color: currentTime ? "#27241D" : "#857F72",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "0 6px 6px 0",
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
    backgroundColor: "#FFFFFF",
    border: "1px solid #D3CEC4",
    borderRadius: "8px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
    borderRadius: "4px",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: "#504A40",
  };

  const monthLabelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "#27241D",
    textTransform: "capitalize",
  };

  const weekdaysStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 32px)",
    gap: "2px",
    marginBottom: "4px",
  };

  const weekdayStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    color: "#857F72",
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
    isToday: boolean
  ): React.CSSProperties => ({
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: isSelected ? 600 : 400,
    color: day
      ? isSelected
        ? "#FFFFFF"
        : isToday
          ? "#BA2525"
          : "#27241D"
      : "transparent",
    backgroundColor: isSelected ? "#BA2525" : "transparent",
    border: "none",
    borderRadius: "4px",
    cursor: day ? "pointer" : "default",
    transition: "background-color 100ms ease",
  });

  const timeListStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    maxHeight: "200px",
    overflowY: "auto",
    width: "80px",
  };

  const timeOptionStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: isSelected ? 500 : 400,
    color: isSelected ? "#BA2525" : "#504A40",
    backgroundColor: isSelected ? "#FFEEEE" : "transparent",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    textAlign: "center",
    transition: "background-color 100ms ease",
  });

  const hintStyle: React.CSSProperties = {
    fontSize: "13px",
    color: error ? "#BA2525" : "#857F72",
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
              backgroundColor: showDatePicker ? "#FAF9F7" : "transparent",
            }}
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowTimePicker(false);
            }}
            onMouseEnter={(e) => {
              if (!showDatePicker) e.currentTarget.style.backgroundColor = "#FAF9F7";
            }}
            onMouseLeave={(e) => {
              if (!showDatePicker) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <IconCalendar size={16} primary="#857F72" secondary="#D3CEC4" />
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
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF9F7")}
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
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF9F7")}
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

                  return (
                    <button
                      key={index}
                      type="button"
                      style={getDayStyle(day, !!isSelected, !!isToday)}
                      onClick={() => day && handleDateSelect(day)}
                      onMouseEnter={(e) => {
                        if (day && !isSelected) e.currentTarget.style.backgroundColor = "#FAF9F7";
                      }}
                      onMouseLeave={(e) => {
                        if (day && !isSelected) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      disabled={!day}
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
              backgroundColor: showTimePicker ? "#FAF9F7" : "transparent",
            }}
            onClick={() => {
              setShowTimePicker(!showTimePicker);
              setShowDatePicker(false);
            }}
            onMouseEnter={(e) => {
              if (!showTimePicker) e.currentTarget.style.backgroundColor = "#FAF9F7";
            }}
            onMouseLeave={(e) => {
              if (!showTimePicker) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <IconClock size={14} primary="#857F72" secondary="#D3CEC4" />
            {currentTime || (locale === "es" ? "Hora" : "Time")}
          </button>

          {showTimePicker && (
            <div style={{ ...dropdownStyle, right: 0, left: "auto" }}>
              <div style={timeListStyle}>
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    type="button"
                    style={timeOptionStyle(currentTime === time)}
                    onClick={() => handleTimeSelect(time)}
                    onMouseEnter={(e) => {
                      if (currentTime !== time) e.currentTarget.style.backgroundColor = "#FAF9F7";
                    }}
                    onMouseLeave={(e) => {
                      if (currentTime !== time) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {(error || hint) && <span style={hintStyle}>{error || hint}</span>}
    </div>
  );
};
