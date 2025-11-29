import React from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Eye, Users, Pencil, Copy, Trash2, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentLocale, routes } from "@/lib/routes";
import type { Event, EventStatus } from "@/types/event";

interface EventRowProps {
  event: Event;
  statusVariantMap: Record<EventStatus, "success" | "neutral" | "info" | "danger">;
  onNavigate?: (path: string) => void;
}

export const EventRow = React.memo<EventRowProps>(({ event, statusVariantMap, onNavigate }) => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();

  const getStatusLabel = (status: EventStatus) => {
    return t(`dashboard.events_view.status.${status}`, status);
  };

  const handleViewDetails = () => {
    const path = routes[locale].eventsManage(event.id.toString());
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const handleViewEnrolled = () => {
    // TODO: Navegar a vista de inscritos
    console.log("View enrolled:", event.id);
  };

  const handleEdit = () => {
    // TODO: Abrir modal de edición o navegar
    console.log("Edit event:", event.id);
  };

  const handleDuplicate = () => {
    // TODO: Duplicar evento
    console.log("Duplicate event:", event.id);
  };

  const handleDelete = () => {
    // TODO: Mostrar confirmación y eliminar
    console.log("Delete event:", event.id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return { date: "", time: "" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const startDate = formatDate(event.startAt);
  const variant = statusVariantMap[event.status] || "neutral";

  // Determinar si es evento virtual (para mostrar badge)
  const isVirtual = event.modality?.name?.toLowerCase().includes("virtual");
  const isHybrid = event.modality?.name?.toLowerCase().includes("híbrido") ||
                   event.modality?.name?.toLowerCase().includes("hybrid");

  // Usar dato real del backend, o 0 si no existe
  const enrolledCount = event.enrolledCount ?? 0;
  const isHighEnrollment = enrolledCount >= 50;

  return (
    <div className="rui-table-row">
      {/* EVENTO */}
      <div className="rui-event-cell">
        <span className="rui-event-title" onClick={handleViewDetails}>
          {event.title}
        </span>
        <span className="rui-event-category">
          {event.category?.name || event.type?.name || ""}
        </span>
      </div>

      {/* FECHA */}
      <div className="rui-date-cell">
        <span className="rui-date-primary">{startDate.date}</span>
        <span className="rui-date-secondary">{startDate.time}</span>
      </div>

      {/* UBICACIÓN */}
      <div className="rui-location-cell">
        {event.location?.name ? (
          <>
            <span className="rui-location-name">{event.location.name}</span>
            {event.location.city && (
              <span className="rui-location-city">{event.location.city}</span>
            )}
          </>
        ) : isVirtual || event.virtualAccess ? (
          <span className="rui-location-badge">
            <Globe className="h-3 w-3" />
            {t("dashboard.events_view.modality.virtual")}
          </span>
        ) : isHybrid ? (
          <span className="rui-location-badge">
            <Globe className="h-3 w-3" />
            {t("dashboard.events_view.modality.hybrid")}
          </span>
        ) : (
          <span className="rui-location-name">—</span>
        )}
      </div>

      {/* INSCRITOS (NUEVA COLUMNA) */}
      <div className="rui-inscritos-cell">
        <span className={`rui-inscritos-number ${isHighEnrollment ? "rui-inscritos-number--highlight" : ""}`}>
          {enrolledCount}
        </span>
        <span className="rui-inscritos-label">{t("dashboard.events_view.table.enrolled_label")}</span>
      </div>

      {/* ESTADO */}
      <div>
        <span className={`rui-badge rui-badge--${variant}`}>
          {getStatusLabel(event.status)}
        </span>
      </div>

      {/* ACCIONES - Refactoring UI */}
      <div className="rui-actions-cell">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rui-actions-button">
              <MoreHorizontal className="rui-actions-button-icon" />
              <span className="sr-only">{t("dashboard.events_view.actions.title")}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="rui-dropdown">
            {/* Acciones de vista */}
            <DropdownMenuItem className="rui-dropdown-item" onClick={handleViewDetails}>
              <Eye className="rui-dropdown-item-icon" />
              {t("dashboard.events_view.actions.view_details")}
            </DropdownMenuItem>
            <DropdownMenuItem className="rui-dropdown-item" onClick={handleViewEnrolled}>
              <Users className="rui-dropdown-item-icon" />
              {t("dashboard.events_view.actions.view_enrolled")}
              <span className="rui-dropdown-item-badge">{enrolledCount}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="rui-dropdown-separator" />

            {/* Acciones de edición */}
            <DropdownMenuItem className="rui-dropdown-item" onClick={handleEdit}>
              <Pencil className="rui-dropdown-item-icon" />
              {t("dashboard.events_view.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem className="rui-dropdown-item" onClick={handleDuplicate}>
              <Copy className="rui-dropdown-item-icon" />
              {t("dashboard.events_view.actions.duplicate")}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="rui-dropdown-separator" />

            {/* Acción destructiva - SEPARADA */}
            <DropdownMenuItem className="rui-dropdown-item rui-dropdown-item--danger" onClick={handleDelete}>
              <Trash2 className="rui-dropdown-item-icon" />
              {t("dashboard.events_view.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
