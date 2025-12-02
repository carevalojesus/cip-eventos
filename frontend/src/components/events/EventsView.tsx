import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import { useEvents } from "@/hooks/useEvents";
import { getCurrentLocale, routes } from "@/lib/routes";
import type { Event, EventStatus } from "@/types/event";
import { EventCard } from "./EventCard";
import { IconAdd, IconSearch } from "@/components/icons/DuotoneIcons";

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
    const newEventPath = routes[locale].eventsNew;
    if (onNavigate) {
      onNavigate(newEventPath);
    } else {
      window.location.href = newEventPath;
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

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  };

  const headerContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--color-grey-900)',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--color-grey-500)',
    margin: 0,
  };

  const primaryButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  };

  const filtersContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const searchWrapperStyle: React.CSSProperties = {
    position: 'relative',
    flex: '1',
    minWidth: '200px',
    maxWidth: '320px',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem 0.625rem 2.5rem',
    fontSize: '0.875rem',
    border: '1px solid var(--color-border-light)',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-grey-900)',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  };

  const selectStyle: React.CSSProperties = {
    padding: '0.625rem 2rem 0.625rem 0.875rem',
    fontSize: '0.875rem',
    border: '1px solid var(--color-border-light)',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-grey-900)',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23857F72' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1rem',
  };

  const clearButtonStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    color: 'var(--color-grey-600)',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border-light)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  };

  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-xl)',
    border: '1px dashed var(--color-border-light)',
  };

  const emptyIconStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-grey-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  };

  const emptyTitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--color-grey-900)',
    margin: '0 0 0.25rem 0',
  };

  const emptyDescStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--color-grey-500)',
    margin: '0 0 1.5rem 0',
    textAlign: 'center',
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2rem',
    padding: '1rem 0',
  };

  const paginationInfoStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--color-grey-500)',
  };

  const paginationControlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.25rem',
  };

  const pageButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? 'var(--color-primary)' : 'var(--color-grey-600)',
    backgroundColor: isActive ? 'var(--color-red-050)' : 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    color: 'var(--color-grey-500)',
  };

  // Pagination helpers
  const getPaginationPages = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

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
      <header style={headerStyle}>
        <div style={headerContentStyle}>
          <h1 style={titleStyle}>{t("dashboard.nav.my_events")}</h1>
          <p style={subtitleStyle}>{t("dashboard.events_view.subtitle")}</p>
        </div>
        <button
          style={primaryButtonStyle}
          onClick={handleCreateEvent}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
          }}
        >
          <IconAdd size={18} primary="white" secondary="rgba(255,255,255,0.5)" />
          {t("dashboard.new_event")}
        </button>
      </header>

      {/* Filters */}
      <div style={filtersContainerStyle}>
        <div style={searchWrapperStyle}>
          <div style={searchIconStyle}>
            <IconSearch size={18} primary="var(--color-grey-400)" secondary="var(--color-grey-300)" />
          </div>
          <input
            type="text"
            style={searchInputStyle}
            placeholder={t("dashboard.events_view.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-focus)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-grey-100)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-light)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <select
          style={{
            ...selectStyle,
            borderColor: statusFilter !== "ALL" ? 'var(--color-primary)' : 'var(--color-border-light)',
          }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">{t("dashboard.events_view.filter_status")}</option>
          <option value="PUBLISHED">{t("dashboard.events_view.status.PUBLISHED")}</option>
          <option value="DRAFT">{t("dashboard.events_view.status.DRAFT")}</option>
          <option value="COMPLETED">{t("dashboard.events_view.status.COMPLETED")}</option>
          <option value="CANCELLED">{t("dashboard.events_view.status.CANCELLED")}</option>
        </select>

        {hasActiveFilters && (
          <button
            style={clearButtonStyle}
            onClick={handleClearFilters}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-grey-050)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {t("dashboard.events_view.clear_filters")}
          </button>
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
            <div style={paginationStyle}>
              <p style={paginationInfoStyle}>
                {t("dashboard.events_view.pagination.showing")}{" "}
                <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>
                {" "}-{" "}
                <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}</strong>
                {" "}{t("dashboard.events_view.pagination.of")}{" "}
                <strong>{filteredEvents.length}</strong>
                {" "}{t("dashboard.events_view.pagination.events")}
              </p>
              <div style={paginationControlsStyle}>
                <button
                  style={pageButtonStyle(false)}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                {getPaginationPages().map((page) => (
                  <button
                    key={page}
                    style={pageButtonStyle(currentPage === page)}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  style={pageButtonStyle(false)}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>
            <IconAdd size={28} primary="var(--color-grey-400)" secondary="var(--color-grey-300)" />
          </div>
          <h3 style={emptyTitleStyle}>
            {hasActiveFilters
              ? t("dashboard.events_view.table.empty")
              : t("dashboard.events_view.empty.title", "No tienes eventos")}
          </h3>
          <p style={emptyDescStyle}>
            {hasActiveFilters
              ? t("dashboard.events_view.empty.no_results", "No se encontraron eventos con los filtros aplicados")
              : t("dashboard.events_view.empty.description", "Crea tu primer evento para comenzar")}
          </p>
          {!hasActiveFilters && (
            <button
              style={primaryButtonStyle}
              onClick={handleCreateEvent}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              }}
            >
              <IconAdd size={18} primary="white" secondary="rgba(255,255,255,0.5)" />
              {t("dashboard.new_event")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
