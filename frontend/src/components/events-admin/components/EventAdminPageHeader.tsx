/**
 * EventAdminPageHeader Component
 *
 * Header de la página de eventos usando el componente PageHeader estándar.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "@phosphor-icons/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

interface EventAdminPageHeaderProps {
  onCreateEvent: () => void;
  showCreateButton?: boolean;
  totalEvents?: number;
}

export const EventAdminPageHeader: React.FC<EventAdminPageHeaderProps> = ({
  onCreateEvent,
  showCreateButton = true,
  totalEvents,
}) => {
  const { t } = useTranslation();

  const subtitle = totalEvents !== undefined
    ? t("events.admin.subtitle_count", "{{count}} eventos en el sistema", {
        count: totalEvents,
      })
    : t("events.admin.subtitle", "Administra todos los eventos del sistema");

  return (
    <PageHeader
      title={t("events.admin.title", "Gestión de Eventos")}
      subtitle={subtitle}
      action={
        showCreateButton ? (
          <Button variant="primary" size="md" onClick={onCreateEvent}>
            <Plus size={18} weight="bold" />
            {t("events.admin.create_event", "Crear Evento")}
          </Button>
        ) : undefined
      }
    />
  );
};

export default EventAdminPageHeader;
