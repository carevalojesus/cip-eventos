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
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const variant = statusVariantMap[event.status] || "default";
  const ModalityIcon = getModalityIcon(event.modality.name);

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="px-6 py-4 font-medium">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{event.title}</span>
          {event.location && (
            <span className="text-xs text-gray-500">{event.location.address}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatDate(event.startAt)}</span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <span className="text-sm text-gray-900">
          {(event as any).organizer?.name || (event as any).organizers?.[0]?.name || "—"}
        </span>
      </TableCell>
      <TableCell className="px-6 py-4">
        <span className="text-sm text-gray-900">
          {event.location?.name || event.location?.address || "—"}
        </span>
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-2">
          <ModalityIcon className="h-4 w-4 text-gray-400" />
          <span>{getModalityLabel(event.modality)}</span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <Badge variant={variant}>
          {getStatusLabel(event.status)}
        </Badge>
      </TableCell>
      <TableCell className="px-6 py-4 text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("common.view")}</span>
        </Button>
      </TableCell>
    </TableRow>
  );
});
