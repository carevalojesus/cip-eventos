import React from "react";
import { useTranslation } from "react-i18next";
import { Search, Filter, Calendar as CalendarIcon, FileSpreadsheet, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  yearFilter: string;
  onYearChange: (value: string) => void;
  dateFilter: { from: Date | undefined; to: Date | undefined } | undefined;
  onDateChange: (date: { from: Date | undefined; to: Date | undefined } | undefined) => void;
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
  dateFilter,
  onDateChange,
  onClearFilters,
  onExport,
}) => {
  const { t } = useTranslation();

  const hasActiveFilters = searchTerm || statusFilter !== "ALL" || yearFilter !== "ALL" || dateFilter;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={t("dashboard.events_view.search_placeholder")}
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-40 pl-9">
              <SelectValue placeholder={t("dashboard.events_view.filter_status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("dashboard.events_view.filter_status")}</SelectItem>
              <SelectItem value="PUBLISHED">{t("dashboard.events_view.status.PUBLISHED")}</SelectItem>
              <SelectItem value="DRAFT">{t("dashboard.events_view.status.DRAFT")}</SelectItem>
              <SelectItem value="COMPLETED">{t("dashboard.events_view.status.COMPLETED")}</SelectItem>
              <SelectItem value="CANCELLED">{t("dashboard.events_view.status.CANCELLED")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={yearFilter} onValueChange={onYearChange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los años</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal sm:w-[280px]",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter?.from ? (
                dateFilter.to ? (
                  <>
                    {format(dateFilter.from, "dd MMM", { locale: es })} - {format(dateFilter.to, "dd MMM", { locale: es })}
                  </>
                ) : (
                  format(dateFilter.from, "dd MMM yyyy", { locale: es })
                )
              ) : (
                <span>{t("dashboard.events_view.select_range", "Seleccionar rango")}</span>
              )}
            </Button>
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

        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            {t("dashboard.events_view.clear_filters", "Limpiar filtros")}
          </Button>
        )}

        <Button variant="outline" onClick={onExport} className="gap-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          {t("dashboard.events_view.export_excel", "Exportar")}
        </Button>
      </div>
    </div>
  );
};
