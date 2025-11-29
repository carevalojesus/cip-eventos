import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { Event, EventStatus } from "@/types/event";
import { EventRow } from "./EventRow";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

interface EventTableProps {
  events: Event[];
  onNavigate?: (path: string) => void;
  pagination?: PaginationProps;
}

const statusVariantMap: Record<EventStatus, "success" | "neutral" | "info" | "danger"> = {
  PUBLISHED: "success",
  DRAFT: "neutral",
  COMPLETED: "info",
  CANCELLED: "danger",
};

export const EventTable: React.FC<EventTableProps> = ({ events, onNavigate, pagination }) => {
  const { t } = useTranslation();

  const getPaginationPages = () => {
    if (!pagination) return [];
    const { currentPage, totalPages } = pagination;
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

  return (
    <div className="rui-table-container">
      {/* Header - Nueva estructura: EVENTO, FECHA, UBICACIÓN, INSCRITOS, ESTADO, ACCIONES */}
      <div className="rui-table-header-row">
        <div className="rui-table-header-cell">
          {t("dashboard.events_view.table.event")}
        </div>
        <div className="rui-table-header-cell">
          {t("dashboard.events_view.table.date")}
        </div>
        <div className="rui-table-header-cell">
          {t("dashboard.events_view.table.location", "Ubicación")}
        </div>
        <div className="rui-table-header-cell rui-table-header-cell--center">
          {t("dashboard.events_view.table.enrolled", "Inscritos")}
        </div>
        <div className="rui-table-header-cell">
          {t("dashboard.events_view.table.status")}
        </div>
        <div className="rui-table-header-cell rui-table-header-cell--right">
          {t("dashboard.events_view.table.actions")}
        </div>
      </div>

      {/* Body */}
      <div>
        {events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            statusVariantMap={statusVariantMap}
            onNavigate={onNavigate}
          />
        ))}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="rui-empty-state">
            <div className="rui-empty-state-icon">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="rui-empty-state-title">
              {t("dashboard.events_view.table.empty_title", "No hay eventos")}
            </h3>
            <p className="rui-empty-state-description">
              {t("dashboard.events_view.table.empty")}
            </p>
          </div>
        )}
      </div>

      {/* Paginación - Dentro de la tabla */}
      {pagination && (
        <div className="rui-pagination">
          <p className="rui-pagination-info">
            {t("dashboard.events_view.pagination.showing")}{" "}
            <span className="rui-pagination-info-bold">
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
            </span>{" "}
            {t("dashboard.events_view.pagination.to")}{" "}
            <span className="rui-pagination-info-bold">
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
            </span>{" "}
            {t("dashboard.events_view.pagination.of")}{" "}
            <span className="rui-pagination-info-bold">{pagination.totalItems}</span>{" "}
            {t("dashboard.events_view.pagination.events")}
          </p>
          <div className="rui-pagination-controls">
            <button
              className="rui-pagination-btn"
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPaginationPages().map((page) => (
              <button
                key={page}
                className={`rui-pagination-btn ${pagination.currentPage === page ? "rui-pagination-btn--active" : ""}`}
                onClick={() => pagination.onPageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="rui-pagination-btn"
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
