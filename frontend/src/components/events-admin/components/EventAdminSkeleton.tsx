/**
 * EventAdminSkeleton Component
 *
 * Skeleton loader para la tabla de eventos administrativos.
 */
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface EventAdminSkeletonProps {
  rows?: number;
}

export const EventAdminSkeleton: React.FC<EventAdminSkeletonProps> = ({
  rows = 8,
}) => {
  return (
    <div className="events-admin__skeleton">
      {/* Header skeleton */}
      <div className="events-admin__skeleton-header">
        <Skeleton width={18} height={18} />
        <Skeleton width="60px" height={14} />
        <Skeleton width="120px" height={14} />
        <Skeleton width="100px" height={14} />
        <Skeleton width="80px" height={14} />
        <Skeleton width="80px" height={14} />
        <Skeleton width="90px" height={14} />
        <Skeleton width="80px" height={14} />
        <div />
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="events-admin__skeleton-row">
          <Skeleton width={18} height={18} />

          {/* Imagen */}
          <Skeleton width={64} height={48} style={{ borderRadius: "var(--radius-md)" }} />

          {/* Título y Slug */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Skeleton width={160 + Math.random() * 80} height={14} />
            <Skeleton width={100 + Math.random() * 40} height={12} />
          </div>

          {/* Organizador */}
          <Skeleton width={100 + Math.random() * 40} height={14} />

          {/* Fecha */}
          <Skeleton width={90} height={14} />

          {/* Estado Badge */}
          <Skeleton width={80} height={24} style={{ borderRadius: "var(--radius-full)" }} />

          {/* Modalidad Badge */}
          <Skeleton width={90} height={24} style={{ borderRadius: "var(--radius-full)" }} />

          {/* Inscripciones */}
          <Skeleton width={50} height={14} />

          {/* Actions */}
          <Skeleton width={28} height={28} style={{ borderRadius: "var(--radius-md)" }} />
        </div>
      ))}
    </div>
  );
};

export default EventAdminSkeleton;
