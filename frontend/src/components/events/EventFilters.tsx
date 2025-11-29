import React from "react";
import { useTranslation } from "react-i18next";
import { Search, Filter, Calendar as CalendarIcon, FileSpreadsheet, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
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
  monthFilter: string;
  onMonthChange: (value: string) => void;
  dateFilter: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onClearFilters: () => void;
  onExport: () => void;
}

const MONTHS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
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

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Fila principal de filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-0 lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("dashboard.events_view.search_placeholder")}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filtros en grid */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("dashboard.events_view.filter_status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="PUBLISHED">{t("dashboard.events_view.status.PUBLISHED")}</SelectItem>
              <SelectItem value="DRAFT">{t("dashboard.events_view.status.DRAFT")}</SelectItem>
              <SelectItem value="COMPLETED">{t("dashboard.events_view.status.COMPLETED")}</SelectItem>
              <SelectItem value="CANCELLED">{t("dashboard.events_view.status.CANCELLED")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={(value) => {
            onYearChange(value);
            if (value === "ALL") {
              onMonthChange("ALL");
            }
          }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={monthFilter}
            onValueChange={onMonthChange}
            disabled={yearFilter === "ALL"}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
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
                  <span>Rango de fechas</span>
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
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 lg:ml-auto">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1.5 text-muted-foreground">
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Exportar
          </Button>
        </div>
      </div>
    </div>
  );
};
