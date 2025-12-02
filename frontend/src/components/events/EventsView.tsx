import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useEvents } from "@/hooks/useEvents";
import { getCurrentLocale, routes } from "@/lib/routes";
import type { Event } from "@/types/event";
import { EventCard } from "./EventCard";
import { IconAdd } from "@/components/icons/DuotoneIcons";
import {
  Button,
  SearchInput,
  Select,
  Pagination,
  EmptyState,
  PageHeader,
} from "@/components/ui/rui";

const ITEMS_PER_PAGE = 9; // 3x3 grid

interface EventsViewProps {
  onNavigate?: (path: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { events, loading, error, refetch } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const handleCreateEvent = () => {
    const locale = getCurrentLocale();
    const createPath = routes[locale].eventsNew;
    if (onNavigate) {
      onNavigate(createPath);
    } else {
      window.location.href = createPath;
    }
  };

  const handleManageEvent = (eventId: string) => {
    const locale = getCurrentLocale();
    const path = routes[locale].eventsManage(eventId);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const filteredEvents = useMemo(() => {
    if (loading || events.length === 0) return [];

    const filtered = events.filter((event) => {
      const matchesSearch = event.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter && statusFilter !== "ALL"
        ? event.status === statusFilter
        : true;

      return matchesSearch && matchesStatus;
    });

    const statusOrder: Record<string, number> = {
      PUBLISHED: 0,
      DRAFT: 1,
      COMPLETED: 2,
      CANCELLED: 3,
    };

    return filtered.sort((a, b) => {
      const statusDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
      if (statusDiff !== 0) return statusDiff;

      const dateA = new Date(a.startAt).getTime();
      const dateB = new Date(b.startAt).getTime();
      return dateB - dateA;
    });
  }, [events, loading, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const hasActiveFilters = searchTerm || statusFilter !== "ALL";

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const filtersContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    color: 'var(--color-grey-500)',
  };

  // Status options for Select
  const statusOptions = [
    { value: "ALL", label: t("dashboard.events_view.filter_status") },
    { value: "PUBLISHED", label: t("dashboard.events_view.status.PUBLISHED") },
    { value: "DRAFT", label: t("dashboard.events_view.status.DRAFT") },
    { value: "COMPLETED", label: t("dashboard.events_view.status.COMPLETED") },
    { value: "CANCELLED", label: t("dashboard.events_view.status.CANCELLED") },
  ];

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <span>{t("common.loading", "Cargando...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <PageHeader
        title={t("dashboard.nav.my_events")}
        subtitle={t("dashboard.events_view.subtitle")}
        action={
          <Button variant="primary" size="lg" onClick={handleCreateEvent}>
            <IconAdd size={18} primary="white" secondary="rgba(255,255,255,0.5)" />
            {t("dashboard.new_event")}
          </Button>
        }
      />

      {/* Filters */}
      <div style={filtersContainerStyle}>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t("dashboard.events_view.search_placeholder")}
        />

        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder={t("dashboard.events_view.filter_status", "Estado")}
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="lg" onClick={handleClearFilters}>
            {t("dashboard.events_view.clear_filters")}
          </Button>
        )}
      </div>

      {/* Events Grid or Empty State */}
      {paginatedEvents.length > 0 ? (
        <>
          <div style={gridStyle}>
            {paginatedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onManage={() => handleManageEvent(event.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEvents.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={<IconAdd size={28} primary="var(--color-grey-400)" secondary="var(--color-grey-300)" />}
          title={
            hasActiveFilters
              ? t("dashboard.events_view.table.empty")
              : t("dashboard.events_view.empty.title", "No tienes eventos")
          }
          description={
            hasActiveFilters
              ? t("dashboard.events_view.empty.no_results", "No se encontraron eventos con los filtros aplicados")
              : t("dashboard.events_view.empty.description", "Crea tu primer evento para comenzar")
          }
          action={
            !hasActiveFilters ? (
              <Button variant="primary" size="lg" onClick={handleCreateEvent}>
                <IconAdd size={18} primary="white" secondary="rgba(255,255,255,0.5)" />
                {t("dashboard.new_event")}
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
};
