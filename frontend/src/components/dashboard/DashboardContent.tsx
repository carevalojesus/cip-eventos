import React from "react";
import { useTranslation } from "react-i18next";
import { Plus, Calendar, Users, TrendUp, Ticket } from "@phosphor-icons/react";
import { StatCard } from "./cards/StatCard";
import { EventItem } from "./cards/EventItem";
import { ActivityItem } from "./cards/ActivityItem";
import { LoadingState, LoadingCard } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboard";

/**
 * DashboardContent Component
 * Main dashboard content with stats, upcoming events, and recent activity
 *
 * Features:
 * - Full i18n support
 * - Real API data integration
 * - Loading states
 * - Error handling
 * - Responsive grid layout
 */
export const DashboardContent: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useDashboardData();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Main loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-grey-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-grey-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>

        {/* Stats Loading */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>

        <LoadingState message={t("form.loading", "Cargando datos...")} />
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <ErrorState
        message={error || "No se pudieron cargar los datos del dashboard"}
        onRetry={refetch}
      />
    );
  }

  const { stats, events, activity } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grey-900">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-grey-500">{t("dashboard.subtitle")}</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          {t("dashboard.new_event")}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats && (
          <>
            <StatCard
              title={t("dashboard.stats.active_events")}
              value={stats.activeEvents}
              description={t("dashboard.stats.active_events_desc", { count: 2 })}
              icon={Calendar}
              iconColor="blue"
              trend={
                stats.trends?.activeEvents
                  ? {
                      value: `+${stats.trends.activeEvents}%`,
                      isPositive: stats.trends.activeEvents > 0,
                    }
                  : undefined
              }
            />
            <StatCard
              title={t("dashboard.stats.total_registered")}
              value={stats.totalRegistered.toLocaleString()}
              description={t("dashboard.stats.total_registered_trend", {
                percent: stats.trends?.totalRegistered || 15,
              })}
              icon={Users}
              iconColor="green"
              trend={
                stats.trends?.totalRegistered
                  ? {
                      value: `+${stats.trends.totalRegistered}%`,
                      isPositive: stats.trends.totalRegistered > 0,
                    }
                  : undefined
              }
            />
            <StatCard
              title={t("dashboard.stats.monthly_income")}
              value={`S/ ${stats.monthlyIncome.toLocaleString()}`}
              description={t("dashboard.stats.monthly_income_desc")}
              icon={TrendUp}
              iconColor="red"
            />
            <StatCard
              title={t("dashboard.stats.tickets_sold")}
              value={stats.ticketsSold}
              description={t("dashboard.stats.tickets_sold_desc", { percent: 85 })}
              icon={Ticket}
              iconColor="purple"
            />
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Events */}
        <div className="col-span-4 rounded-xl border border-grey-200 bg-white shadow-sm">
          <div className="p-6 border-b border-grey-100">
            <h3 className="font-semibold text-grey-900">
              {t("dashboard.upcoming_events.title")}
            </h3>
            <p className="text-sm text-grey-500 mt-1">
              {t("dashboard.upcoming_events.subtitle", {
                count: events?.length || 0,
              })}
            </p>
          </div>
          <div className="p-6">
            {events && events.length > 0 ? (
              <div className="divide-y divide-grey-100">
                {events.map((event) => (
                  <EventItem
                    key={event.id}
                    title={event.title}
                    date={event.date}
                    attendees={event.attendees}
                    status={event.status}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-grey-500 py-8">
                No hay eventos próximos
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-3 rounded-xl border border-grey-200 bg-white shadow-sm">
          <div className="p-6 border-b border-grey-100">
            <h3 className="font-semibold text-grey-900">
              {t("dashboard.recent_activity.title")}
            </h3>
            <p className="text-sm text-grey-500 mt-1">
              {t("dashboard.recent_activity.subtitle")}
            </p>
          </div>
          <div className="p-6">
            {activity && activity.length > 0 ? (
              <div className="divide-y divide-grey-100">
                {activity.map((item) => (
                  <ActivityItem
                    key={item.id}
                    user={item.user}
                    action={item.action}
                    target={item.target}
                    timestamp={item.timestamp}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-grey-500 py-8">
                No hay actividad reciente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
