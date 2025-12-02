import React from "react";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";

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

  // TODO: Implementar nueva UI
  return null;
};
