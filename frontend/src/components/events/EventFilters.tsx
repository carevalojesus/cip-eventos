import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Calendar as CalendarIcon, FileSpreadsheet, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EventFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  yearFilter: string;
  onYearChange: (value: string) => void;
  monthFilter: string;
  onMonthChange: (value: string) => void;
  dateFilter: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onClearFilters: () => void;
  onExport: () => void;
}

const MONTHS_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

export const EventFilters: React.FC<EventFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  yearFilter,
  onYearChange,
  monthFilter,
  onMonthChange,
  dateFilter,
  onDateChange,
  onClearFilters,
  onExport,
}) => {
  const { t } = useTranslation();

  const hasActiveFilters = searchTerm || statusFilter !== "ALL" || yearFilter !== "ALL" || monthFilter !== "ALL" || dateFilter;

  const handleYearChange = (value: string) => {
    onYearChange(value);
    if (value === "ALL") {
      onMonthChange("ALL");
    }
  };

  return (
    <div className="rui-filters-bar">
      {/* Búsqueda - Refactoring UI */}
      <div className="rui-search-wrapper">
        <Search className="rui-search-icon" />
        <input
          type="text"
          className="rui-search-input"
          placeholder={t("dashboard.events_view.search_placeholder")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filtros - Refactoring UI */}
      <div className="rui-filters-group">
        {/* Estado */}
        <div className="rui-select-wrapper">
          <select
            className={`rui-filter-select ${statusFilter !== "ALL" ? "rui-filter-select--active" : ""}`}
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="ALL">{t("dashboard.events_view.filter_status")}</option>
            <option value="PUBLISHED">{t("dashboard.events_view.status.PUBLISHED")}</option>
            <option value="DRAFT">{t("dashboard.events_view.status.DRAFT")}</option>
            <option value="COMPLETED">{t("dashboard.events_view.status.COMPLETED")}</option>
            <option value="CANCELLED">{t("dashboard.events_view.status.CANCELLED")}</option>
          </select>
          <ChevronDown className="rui-select-icon" />
        </div>

        {/* Año */}
        <div className="rui-select-wrapper">
          <select
            className={`rui-filter-select ${yearFilter !== "ALL" ? "rui-filter-select--active" : ""}`}
            value={yearFilter}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            <option value="ALL">{t("dashboard.events_view.filters.year")}</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <ChevronDown className="rui-select-icon" />
        </div>

        {/* Mes */}
        <div className="rui-select-wrapper">
          <select
            className={`rui-filter-select ${monthFilter !== "ALL" ? "rui-filter-select--active" : ""}`}
            value={monthFilter}
            onChange={(e) => onMonthChange(e.target.value)}
            disabled={yearFilter === "ALL"}
          >
            <option value="ALL">{t("dashboard.events_view.filters.month")}</option>
            {MONTHS_KEYS.map((monthKey, index) => (
              <option key={index + 1} value={(index + 1).toString()}>
                {t(`dashboard.events_view.filters.months.${monthKey}`)}
              </option>
            ))}
          </select>
          <ChevronDown className="rui-select-icon" />
        </div>

        {/* Rango de fechas - usa Popover de shadcn solo para el calendario */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`rui-date-picker-btn ${dateFilter?.from ? "rui-date-picker-btn--active" : ""}`}
            >
              <CalendarIcon className="rui-date-picker-icon" />
              <span className="rui-date-picker-text">
                {dateFilter?.from ? (
                  dateFilter.to ? (
                    `${format(dateFilter.from, "dd MMM", { locale: es })} - ${format(dateFilter.to, "dd MMM", { locale: es })}`
                  ) : (
                    format(dateFilter.from, "dd MMM yyyy", { locale: es })
                  )
                ) : (
                  t("dashboard.events_view.filters.date_range")
                )}
              </span>
              <ChevronDown className="rui-date-picker-chevron" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateFilter}
              onSelect={onDateChange}
              initialFocus
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Acciones */}
      <div className="rui-filters-actions">
        {hasActiveFilters && (
          <button className="rui-btn-ghost" onClick={onClearFilters}>
            <X className="rui-btn-ghost-icon" />
            {t("dashboard.events_view.clear_filters")}
          </button>
        )}
        <button className="rui-btn-tertiary" onClick={onExport}>
          <FileSpreadsheet className="rui-btn-tertiary-icon" style={{ color: "#16A34A" }} />
          {t("dashboard.events_view.export_excel")}
        </button>
      </div>
    </div>
  );
};
