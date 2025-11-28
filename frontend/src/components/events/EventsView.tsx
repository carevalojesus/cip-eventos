import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventFilters } from "./EventFilters";
import { EventTable } from "./EventTable";
import { EventTableSkeleton } from "./EventTableSkeleton";
import { useEvents } from "@/hooks/useEvents";
import { getCurrentLocale, routes } from "@/lib/routes";

const ITEMS_PER_PAGE = 10;

interface EventsViewProps {
  onNavigate?: (path: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { events, loading, error, refetch } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<{ from: Date | undefined; to: Date | undefined } | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setYearFilter("ALL");
    setMonthFilter("ALL");
    setDateFilter(undefined);
    setCurrentPage(1);
  };

  const handleExport = () => {
    console.log("Exporting to Excel...");
    // Implement export logic here
  };

  const handleCreateEvent = () => {
    const locale = getCurrentLocale();
    const newEventPath = routes[locale].eventsNew;
    if (onNavigate) {
      onNavigate(newEventPath);
    } else {
      window.location.href = newEventPath;
    }
  };

  const filteredEvents = useMemo(() => {
    if (loading || events.length === 0) return [];

    const filtered = events.filter((event) => {
      const matchesSearch = event.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter && statusFilter !== "ALL" ? event.status === statusFilter : true;

      const eventDate = new Date(event.startAt);
      const matchesYear = yearFilter && yearFilter !== "ALL"
        ? eventDate.getFullYear().toString() === yearFilter
        : true;

      const matchesMonth = monthFilter && monthFilter !== "ALL" && yearFilter !== "ALL"
        ? (eventDate.getMonth() + 1).toString() === monthFilter
        : true;

      const matchesDate = dateFilter?.from
        ? (() => {
            const fromDate = dateFilter.from;
            const toDate = dateFilter.to || dateFilter.from;
            return eventDate >= fromDate && eventDate <= toDate;
          })()
        : true;

      return matchesSearch && matchesStatus && matchesYear && matchesMonth && matchesDate;
    });

    // Ordenar del más actual al más antiguo
    return filtered.sort((a, b) => {
      const dateA = new Date(a.startAt).getTime();
      const dateB = new Date(b.startAt).getTime();
      return dateB - dateA;
    });
  }, [events, loading, searchTerm, statusFilter, yearFilter, monthFilter, dateFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Reset página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, yearFilter, monthFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("dashboard.events_view.title")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("dashboard.events_view.subtitle")}
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreateEvent}>
          <Plus className="h-4 w-4" />
          {t("dashboard.new_event")}
        </Button>
      </div>

      <EventFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        yearFilter={yearFilter}
        onYearChange={setYearFilter}
        monthFilter={monthFilter}
        onMonthChange={setMonthFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        onClearFilters={handleClearFilters}
        onExport={handleExport}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t("common.retry", "Reintentar")}
            </Button>
          </div>
        </div>
      )}

      {loading ? <EventTableSkeleton /> : <EventTable events={paginatedEvents} />}

      {/* Paginación - solo mostrar si hay más de 10 eventos */}
      {!loading && filteredEvents.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{" "}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}
                </span>{" "}
                de <span className="font-medium">{filteredEvents.length}</span> eventos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
