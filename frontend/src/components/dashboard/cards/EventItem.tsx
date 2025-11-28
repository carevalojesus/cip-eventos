import React from "react";
import { useTranslation } from "react-i18next";

interface EventItemProps {
  title: string;
  date: string;
  attendees: number;
  status: "published" | "draft" | "completed" | "cancelled";
}

const statusConfig = {
  published: {
    className: "bg-green-100 text-green-800",
  },
  draft: {
    className: "bg-yellow-100 text-yellow-800",
  },
  completed: {
    className: "bg-blue-100 text-blue-800",
  },
  cancelled: {
    className: "bg-red-100 text-red-800",
  },
};

/**
 * EventItem Component
 * Reusable component for displaying event information with i18n support
 */
export const EventItem = React.memo<EventItemProps>(({
  title,
  date,
  attendees,
  status,
}) => {
  const { t } = useTranslation();
  const statusInfo = statusConfig[status];

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none text-gray-900">
          {title}
        </p>
        <p className="text-sm text-gray-500">{date}</p>
      </div>
      <div className="font-medium text-gray-700 text-sm">
        {t("dashboard.upcoming_events.attendees", { count: attendees })}
      </div>
      <div
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}
      >
        {t(`dashboard.upcoming_events.status.${status}`)}
      </div>
    </div>
  );
});
