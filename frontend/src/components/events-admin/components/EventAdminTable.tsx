/**
 * EventAdminTable Component
 *
 * Tabla de eventos con selección múltiple, columnas completas y acciones.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { EventAdminStatusBadge } from "./EventAdminStatusBadge";
import { EventAdminModalityBadge } from "./EventAdminModalityBadge";
import { EventAdminActions } from "./EventAdminActions";
import { Checkbox } from "@/components/ui/checkbox";
import type { Event } from "@/types/event";

interface EventAdminTableProps {
  events: Event[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onView: (event: Event) => void;
  onEdit: (event: Event) => void;
  onPublish: (event: Event) => void;
  onUnpublish: (event: Event) => void;
  onDelete: (event: Event) => void;
}

export const EventAdminTable: React.FC<EventAdminTableProps> = ({
  events,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onView,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}) => {
  const { t } = useTranslation();

  const allSelected = events.length > 0 && selectedIds.length === events.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < events.length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEventImage = (event: Event) => {
    if (event.imageUrl) {
      return event.imageUrl;
    }
    return `https://placehold.co/120x80/e5e7eb/9ca3af?text=${encodeURIComponent(
      event.title.substring(0, 2).toUpperCase()
    )}`;
  };

  return (
    <div className="events-admin__table-container">
      <table className="events-admin__table">
        <thead>
          <tr>
            <th className="events-admin__th events-admin__th--checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                aria-label={t("events.table.select_all", "Seleccionar todos")}
              />
            </th>
            <th className="events-admin__th events-admin__th--image">
              {t("events.table.image", "Imagen")}
            </th>
            <th className="events-admin__th events-admin__th--title">
              {t("events.table.event", "Evento")}
            </th>
            <th className="events-admin__th events-admin__th--organizer">
              {t("events.table.organizer", "Organizador")}
            </th>
            <th className="events-admin__th events-admin__th--date">
              {t("events.table.date", "Fecha")}
            </th>
            <th className="events-admin__th events-admin__th--status">
              {t("events.table.status", "Estado")}
            </th>
            <th className="events-admin__th events-admin__th--modality">
              {t("events.table.modality", "Modalidad")}
            </th>
            <th className="events-admin__th events-admin__th--enrollments">
              {t("events.table.enrollments", "Inscritos")}
            </th>
            <th className="events-admin__th events-admin__th--actions">
              {t("events.table.actions", "Acciones")}
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isSelected = selectedIds.includes(event.id);
            return (
              <tr
                key={event.id}
                className={`events-admin__tr ${isSelected ? "events-admin__tr--selected" : ""}`}
              >
                <td className="events-admin__td events-admin__td--checkbox">
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => onSelectOne(event.id, e.target.checked)}
                    aria-label={t("events.table.select_event", "Seleccionar evento")}
                  />
                </td>

                <td className="events-admin__td events-admin__td--image">
                  <img
                    src={getEventImage(event)}
                    alt={event.title}
                    className="events-admin__event-image"
                    loading="lazy"
                  />
                </td>

                <td className="events-admin__td events-admin__td--title">
                  <div className="events-admin__event-info">
                    <button
                      className="events-admin__event-title"
                      onClick={() => onView(event)}
                    >
                      {event.title}
                    </button>
                    <span className="events-admin__event-slug">/{event.slug}</span>
                  </div>
                </td>

                <td className="events-admin__td events-admin__td--organizer">
                  <span className="events-admin__organizer-name">
                    {event.organizers?.[0]?.name || "-"}
                  </span>
                </td>

                <td className="events-admin__td events-admin__td--date">
                  <span className="events-admin__date">{formatDate(event.startAt)}</span>
                </td>

                <td className="events-admin__td events-admin__td--status">
                  <EventAdminStatusBadge status={event.status} />
                </td>

                <td className="events-admin__td events-admin__td--modality">
                  <EventAdminModalityBadge modalityName={event.modality?.name || "N/A"} />
                </td>

                <td className="events-admin__td events-admin__td--enrollments">
                  <span className="events-admin__enrollments">
                    {event.enrolledCount ?? 0}
                  </span>
                </td>

                <td className="events-admin__td events-admin__td--actions">
                  <EventAdminActions
                    event={event}
                    onView={() => onView(event)}
                    onEdit={() => onEdit(event)}
                    onPublish={() => onPublish(event)}
                    onUnpublish={() => onUnpublish(event)}
                    onDelete={() => onDelete(event)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EventAdminTable;
