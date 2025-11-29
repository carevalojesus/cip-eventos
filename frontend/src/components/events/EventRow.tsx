import React from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Settings, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentLocale, routes } from "@/lib/routes";
import type { Event, EventStatus, EventModality } from "@/types/event";
import type { LucideIcon } from "lucide-react";

interface EventRowProps {
  event: Event;
  statusVariantMap: Record<EventStatus, "success" | "gray" | "info" | "destructive">;
  getModalityIcon: (modalityName: string) => LucideIcon;
  onNavigate?: (path: string) => void;
}

export const EventRow = React.memo<EventRowProps>(({ event, statusVariantMap, getModalityIcon, onNavigate }) => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();

  const getStatusLabel = (status: EventStatus) => {
    return t(`dashboard.events_view.status.${status}`, status);
  };

  const handleManage = () => {
    const path = routes[locale].eventsManage(event.id.toString());
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const handleEdit = () => {
    // TODO: Abrir modal de edición rápida o navegar a edición
    console.log("Edit event:", event.id);
  };

  const handleDelete = () => {
    // TODO: Mostrar confirmación y eliminar
    console.log("Delete event:", event.id);
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
    <TableRow className="hover:bg-muted/50">
      {/* Evento (título + categoría + fecha en móvil) */}
      <TableCell className="px-4 py-3">
        <div className="flex flex-col min-w-0 gap-0.5 overflow-hidden">
          <span className="font-medium text-foreground truncate">{event.title}</span>
          <span className="text-xs text-muted-foreground truncate">
            {event.category?.name || event.type?.name || ""}
          </span>
          {/* Mostrar fecha en móvil */}
          <span className="text-xs text-muted-foreground sm:hidden">
            {startDate.date} · {startDate.time}
          </span>
        </div>
      </TableCell>

      {/* Fecha y hora - oculto en móvil */}
      <TableCell className="hidden sm:table-cell px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">{startDate.date}</span>
          <span className="text-xs text-muted-foreground">{startDate.time}</span>
        </div>
      </TableCell>

      {/* Modalidad - oculto en móvil y tablet pequeña */}
      <TableCell className="hidden md:table-cell px-4 py-3">
        <div className="flex items-center gap-1.5">
          <ModalityIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-foreground">{getModalityLabel(event.modality)}</span>
        </div>
      </TableCell>

      {/* Ubicación - oculto hasta pantallas grandes */}
      <TableCell className="hidden lg:table-cell px-4 py-3">
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-sm text-foreground line-clamp-1">
            {event.location?.name || (event.virtualAccess ? "Virtual" : "—")}
          </span>
          {event.location?.city && (
            <span className="text-xs text-muted-foreground">{event.location.city}</span>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t("dashboard.events_view.actions.title")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer" onClick={handleManage}>
              <Settings className="mr-2 h-4 w-4" />
              {t("dashboard.events_view.actions.manage")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("dashboard.events_view.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("dashboard.events_view.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
