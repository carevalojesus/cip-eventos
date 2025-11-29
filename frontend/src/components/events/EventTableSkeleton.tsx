import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

export const EventTableSkeleton: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="rui-table-container">
      {/* Header - Nueva estructura: EVENTO, FECHA, UBICACIÓN, INSCRITOS, ESTADO, ACCIONES */}
      <div className="rui-table-header-row">
        <div className="rui-table-header-cell">
          {t("dashboard.events_view.table.event")}
        </div>
        <div className="rui-table-header-cell">
          {t("dashboard.events_view.table.date")}
        </div>
        <div className="rui-table-header-cell">
          {t("dashboard.events_view.table.location", "Ubicación")}
        </div>
        <div className="rui-table-header-cell rui-table-header-cell--center">
          {t("dashboard.events_view.table.enrolled", "Inscritos")}
        </div>
        <div className="rui-table-header-cell">
          {t("dashboard.events_view.table.status")}
        </div>
        <div className="rui-table-header-cell rui-table-header-cell--right">
          {t("dashboard.events_view.table.actions")}
        </div>
      </div>

      {/* Skeleton Rows */}
      <div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rui-table-row">
            {/* EVENTO */}
            <div className="rui-event-cell">
              <Skeleton className="h-4 w-[200px] mb-1.5" />
              <Skeleton className="h-3 w-[120px]" />
            </div>

            {/* FECHA */}
            <div className="rui-date-cell">
              <Skeleton className="h-4 w-[80px] mb-1" />
              <Skeleton className="h-3 w-[60px]" />
            </div>

            {/* UBICACIÓN */}
            <div className="rui-location-cell">
              <Skeleton className="h-4 w-[120px] mb-1" />
              <Skeleton className="h-3 w-[80px]" />
            </div>

            {/* INSCRITOS */}
            <div className="rui-inscritos-cell">
              <Skeleton className="h-4 w-[30px] mb-1" />
              <Skeleton className="h-3 w-[50px]" />
            </div>

            {/* ESTADO */}
            <div>
              <Skeleton className="h-6 w-[80px] rounded-full" />
            </div>

            {/* ACCIONES */}
            <div className="rui-actions-cell">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
