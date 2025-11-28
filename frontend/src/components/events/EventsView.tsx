import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventFilters } from "./EventFilters";
import { EventTable } from "./EventTable";
import { EventTableSkeleton } from "./EventTableSkeleton";
import { useEvents } from "@/hooks/useEvents";

interface EventsViewProps {
  onNavigate?: (path: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { events, loading, error, refetch } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<{ from: Date | undefined; to: Date | undefined } | undefined>(undefined);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setYearFilter("ALL");
    setDateFilter(undefined);
  };

  const handleExport = () => {
    console.log("Exporting to Excel...");
    // Implement export logic here
  };

  const handleCreateEvent = () => {
    if (onNavigate) {
      onNavigate("/dashboard/events/new");
    } else {
      window.location.href = "/dashboard/events/new";
    }
  };

  const filteredEvents = !loading && events.length > 0 ? events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter && statusFilter !== "ALL" ? event.status === statusFilter : true;

    const matchesYear = yearFilter && yearFilter !== "ALL"
      ? new Date(event.startAt).getFullYear().toString() === yearFilter
      : true;

    const matchesDate = dateFilter?.from
      ? (() => {
          const eventDate = new Date(event.startAt);
          const fromDate = dateFilter.from;
          const toDate = dateFilter.to || dateFilter.from;
          return eventDate >= fromDate && eventDate <= toDate;
        })()
      : true;

    return matchesSearch && matchesStatus && matchesYear && matchesDate;
  }) : [];

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

      {loading ? <EventTableSkeleton /> : <EventTable events={filteredEvents} />}
    </div>
  );
};
