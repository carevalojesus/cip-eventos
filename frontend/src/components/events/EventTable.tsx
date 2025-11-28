import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Globe, Video } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Event, EventStatus } from "@/types/event";
import { EventRow } from "./EventRow";

interface EventTableProps {
  events: Event[];
  onNavigate?: (path: string) => void;
}

const statusVariantMap: Record<EventStatus, "success" | "gray" | "default" | "destructive"> = {
  PUBLISHED: "success",
  DRAFT: "gray",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export const EventTable: React.FC<EventTableProps> = ({ events, onNavigate }) => {
  const { t } = useTranslation();

  const getModalityIcon = useCallback((modalityName: string) => {
    const name = modalityName.toLowerCase();
    if (name.includes('virtual')) return Globe;
    if (name.includes('híbrido') || name.includes('hybrid')) return Video;
    return MapPin;
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[320px] px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.events_view.table.event")}
              </TableHead>
              <TableHead className="w-[180px] px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.events_view.table.date")}
              </TableHead>
              <TableHead className="w-[120px] px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.events_view.table.modality")}
              </TableHead>
              <TableHead className="w-[200px] px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.events_view.table.location", "Ubicación")}
              </TableHead>
              <TableHead className="w-[100px] px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.events_view.table.status")}
              </TableHead>
              <TableHead className="w-[60px] px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.events_view.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                statusVariantMap={statusVariantMap}
                getModalityIcon={getModalityIcon}
                onNavigate={onNavigate}
              />
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t("dashboard.events_view.table.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

