import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCreateEvent } from "@/hooks/useCreateEvent";
import { CreateEventForm } from "./CreateEventForm";
import { getCurrentLocale, routes } from "@/lib/routes";
import type { Breadcrumb } from "@/components/dashboard/DashboardApp";

interface CreateEventViewProps {
  onNavigate?: (path: string) => void;
  onBreadcrumbsChange?: (breadcrumbs: Breadcrumb[]) => void;
}

export const CreateEventView: React.FC<CreateEventViewProps> = ({
  onNavigate,
  onBreadcrumbsChange,
}) => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();
  const {
    form,
    types,
    categories,
    modalities,
    loading,
    submitting,
    onSubmit,
  } = useCreateEvent();

  // Report breadcrumbs to parent
  useEffect(() => {
    if (onBreadcrumbsChange) {
      const eventsPath = routes[locale].events;
      onBreadcrumbsChange([
        { label: t("event_management.breadcrumb.back"), href: eventsPath },
        { label: t("create_event.breadcrumb.title", "Nuevo Evento") },
      ]);
    }
    return () => {
      onBreadcrumbsChange?.([]);
    };
  }, [onBreadcrumbsChange, locale, t]);

  const handleCancel = () => {
    const eventsPath = routes[locale].events;
    if (onNavigate) {
      onNavigate(eventsPath);
    } else {
      window.history.back();
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <CreateEventForm
      form={form}
      types={types}
      categories={categories}
      modalities={modalities}
      onSubmit={onSubmit}
      submitting={submitting}
      onCancel={handleCancel}
    />
  );
};

