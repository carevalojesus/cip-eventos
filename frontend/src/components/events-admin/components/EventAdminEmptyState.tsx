/**
 * EventAdminEmptyState Component
 *
 * Empty state para cuando no hay eventos o no hay resultados de búsqueda.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { CalendarBlank, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface EventAdminEmptyStateProps {
  hasFilters: boolean;
  onCreateEvent: () => void;
  onClearFilters?: () => void;
}

export const EventAdminEmptyState: React.FC<EventAdminEmptyStateProps> = ({
  hasFilters,
  onCreateEvent,
  onClearFilters,
}) => {
  const { t } = useTranslation();

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "var(--space-16) var(--space-8)",
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
  };

  const iconContainerStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--color-grey-100)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "var(--space-4)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-lg)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    marginBottom: "var(--space-2)",
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
    maxWidth: "400px",
    marginBottom: "var(--space-6)",
    lineHeight: "1.5",
  };

  if (hasFilters) {
    return (
      <div style={containerStyle}>
        <div style={iconContainerStyle}>
          <MagnifyingGlass size={36} color="var(--color-grey-400)" weight="duotone" />
        </div>
        <h3 style={titleStyle}>
          {t("events.admin.empty.no_results", "No se encontraron eventos")}
        </h3>
        <p style={descriptionStyle}>
          {t(
            "events.admin.empty.no_results_desc",
            "Intenta ajustar los filtros o buscar con otros términos."
          )}
        </p>
        {onClearFilters && (
          <Button variant="secondary" size="md" onClick={onClearFilters}>
            {t("events.admin.empty.clear_filters", "Limpiar filtros")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={iconContainerStyle}>
        <CalendarBlank size={36} color="var(--color-grey-400)" weight="duotone" />
      </div>
      <h3 style={titleStyle}>
        {t("events.admin.empty.title", "No hay eventos")}
      </h3>
      <p style={descriptionStyle}>
        {t(
          "events.admin.empty.description",
          "Comienza creando tu primer evento. Podrás gestionar todos los detalles, inscripciones y reportes desde aquí."
        )}
      </p>
      <Button variant="primary" size="md" onClick={onCreateEvent}>
        <Plus size={18} weight="bold" />
        {t("events.admin.empty.create_button", "Crear primer evento")}
      </Button>
    </div>
  );
};

export default EventAdminEmptyState;
