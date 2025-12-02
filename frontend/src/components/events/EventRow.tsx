import React from "react";
import { useTranslation } from "react-i18next";
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

  // TODO: Implementar nueva UI
  return null;
});
