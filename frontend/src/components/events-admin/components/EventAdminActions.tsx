/**
 * EventAdminActions Component
 *
 * Menú de acciones para cada evento en la tabla.
 * Usa DropdownMenu de Radix UI con estilos RUI personalizados.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  DotsThree,
  Eye,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Event } from "@/types/event";
import { EventStatus } from "@/types/event";

import "./EventAdminActions.css";

interface EventAdminActionsProps {
  event: Event;
  onView: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}

export const EventAdminActions: React.FC<EventAdminActionsProps> = ({
  event,
  onView,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}) => {
  const { t } = useTranslation();

  const getItemClass = (variant?: "danger" | "success") => {
    let className = "event-actions__item";
    if (variant === "danger") className += " event-actions__item--danger";
    if (variant === "success") className += " event-actions__item--success";
    return className;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="event-actions__trigger"
          aria-label={t("events.actions.menu", "Menú de acciones")}
        >
          <DotsThree size={18} weight="bold" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="event-actions__content">
        {/* Ver detalles */}
        <DropdownMenuItem className={getItemClass()} onClick={onView}>
          <Eye size={16} />
          {t("events.actions.view", "Ver detalles")}
        </DropdownMenuItem>

        {/* Editar */}
        <DropdownMenuItem className={getItemClass()} onClick={onEdit}>
          <PencilSimple size={16} />
          {t("events.actions.edit", "Editar")}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="event-actions__separator" />

        {/* Publicar (solo si es borrador) */}
        {event.status === EventStatus.DRAFT && (
          <DropdownMenuItem className={getItemClass("success")} onClick={onPublish}>
            <CheckCircle size={16} />
            {t("events.actions.publish", "Publicar")}
          </DropdownMenuItem>
        )}

        {/* Despublicar (solo si está publicado) */}
        {event.status === EventStatus.PUBLISHED && (
          <DropdownMenuItem className={getItemClass()} onClick={onUnpublish}>
            <XCircle size={16} />
            {t("events.actions.unpublish", "Despublicar")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="event-actions__separator" />

        {/* Eliminar */}
        <DropdownMenuItem className={getItemClass("danger")} onClick={onDelete}>
          <Trash size={16} />
          {t("events.actions.delete", "Eliminar")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EventAdminActions;
