import React from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const EventTableSkeleton: React.FC = () => {
  const { t } = useTranslation();

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
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Skeleton className="h-4 w-[140px]" />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Skeleton className="h-4 w-[120px]" />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Skeleton className="h-5 w-[80px] rounded-full" />
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
