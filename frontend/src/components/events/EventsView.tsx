import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, AlertCircle } from "lucide-react";
import type { DateRange } from "react-day-picker";
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
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
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

    // Ordenar: primero PUBLISHED, luego DRAFT, luego otros, y dentro de cada grupo por fecha descendente
    const statusOrder: Record<string, number> = {
      PUBLISHED: 0,
      DRAFT: 1,
      COMPLETED: 2,
      CANCELLED: 3,
    };

    return filtered.sort((a, b) => {
      // Primero ordenar por estado
      const statusDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
      if (statusDiff !== 0) return statusDiff;

      // Luego por fecha descendente (más reciente primero)
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
    <div>
      {/* Page Header - Refactoring UI */}
      <header className="rui-page-header">
        <div className="rui-page-header-content">
          <h1 className="rui-page-title">
            {t("dashboard.events_view.title")}
          </h1>
          <p className="rui-page-subtitle">
            {t("dashboard.events_view.subtitle")}
          </p>
        </div>
        <button className="rui-btn-primary" onClick={handleCreateEvent}>
          <Plus className="rui-btn-primary-icon" />
          {t("dashboard.new_event")}
        </button>
      </header>

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
        <div className="rui-alert rui-alert--error">
          <AlertCircle className="rui-alert-icon" />
          <div className="rui-alert-content">
            <p className="rui-alert-message">{error}</p>
          </div>
          <button className="rui-btn-alert" onClick={() => refetch()}>
            {t("common.retry", "Reintentar")}
          </button>
        </div>
      )}

      {loading ? (
        <EventTableSkeleton />
      ) : (
        <EventTable
          events={paginatedEvents}
          onNavigate={onNavigate}
          pagination={
            filteredEvents.length > ITEMS_PER_PAGE ? {
              currentPage,
              totalPages,
              totalItems: filteredEvents.length,
              itemsPerPage: ITEMS_PER_PAGE,
              onPageChange: setCurrentPage,
            } : undefined
          }
        />
      )}
    </div>
  );
};
