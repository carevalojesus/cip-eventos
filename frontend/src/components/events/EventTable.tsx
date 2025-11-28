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
}

const statusVariantMap: Record<EventStatus, "success" | "gray" | "default" | "destructive"> = {
  PUBLISHED: "success",
  DRAFT: "gray",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export const EventTable: React.FC<EventTableProps> = ({ events }) => {
  const { t } = useTranslation();

  const getModalityIcon = useCallback((modalityName: string) => {
    const name = modalityName.toLowerCase();
    if (name.includes('virtual')) return Globe;
    if (name.includes('híbrido') || name.includes('hybrid')) return Video;
    return MapPin;
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] px-6 py-3 text-xs font-medium uppercase text-gray-700">
                {t("dashboard.events_view.table.event")}
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium uppercase text-gray-700">
                {t("dashboard.events_view.table.date")}
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium uppercase text-gray-700">
                {t("dashboard.events_view.table.organizer", "Organizador")}
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium uppercase text-gray-700">
                {t("dashboard.events_view.table.location", "Ubicación")}
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium uppercase text-gray-700">
                {t("dashboard.events_view.table.modality")}
              </TableHead>
              <TableHead className="px-6 py-3 text-xs font-medium uppercase text-gray-700">
                {t("dashboard.events_view.table.status")}
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-700">
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
              />
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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

