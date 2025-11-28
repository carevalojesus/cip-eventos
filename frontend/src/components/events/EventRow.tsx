import React from "react";
import { useTranslation } from "react-i18next";
import { Calendar, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Event, EventStatus, EventModality } from "@/types/event";
import type { LucideIcon } from "lucide-react";

interface EventRowProps {
  event: Event;
  statusVariantMap: Record<EventStatus, "success" | "gray" | "default" | "destructive">;
  getModalityIcon: (modalityName: string) => LucideIcon;
}

export const EventRow = React.memo<EventRowProps>(({ event, statusVariantMap, getModalityIcon }) => {
  const { t } = useTranslation();

  const getStatusLabel = (status: EventStatus) => {
    return t(`dashboard.events_view.status.${status}`, status);
  };

  const getModalityLabel = (modality: EventModality) => {
    return modality.name;
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

  const variant = statusVariantMap[event.status] || "default";
  const ModalityIcon = getModalityIcon(event.modality.name);

  return (
    <TableRow className="hover:bg-gray-50">
      {/* Evento (título + categoría) */}
      <TableCell className="px-4 py-3 max-w-[320px]">
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="font-medium text-gray-900 truncate">{event.title}</span>
          <span className="text-xs text-gray-500 truncate">
            {event.category?.name || event.type?.name || ""}
          </span>
        </div>
      </TableCell>

      {/* Fecha y hora */}
      <TableCell className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-900">{startDate.date}</span>
          <span className="text-xs text-gray-500">{startDate.time}</span>
        </div>
      </TableCell>

      {/* Modalidad */}
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <ModalityIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">{getModalityLabel(event.modality)}</span>
        </div>
      </TableCell>

      {/* Ubicación */}
      <TableCell className="px-4 py-3 max-w-[200px]">
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-sm text-gray-900 truncate">
            {event.location?.name || (event.virtualAccess ? "Virtual" : "—")}
          </span>
          {event.location?.city && (
            <span className="text-xs text-gray-500 truncate">{event.location.city}</span>
          )}
        </div>
      </TableCell>

      {/* Estado */}
      <TableCell className="px-4 py-3">
        <Badge variant={variant}>
          {getStatusLabel(event.status)}
        </Badge>
      </TableCell>

      {/* Acciones */}
      <TableCell className="px-4 py-3 text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("common.view")}</span>
        </Button>
      </TableCell>
    </TableRow>
  );
});
