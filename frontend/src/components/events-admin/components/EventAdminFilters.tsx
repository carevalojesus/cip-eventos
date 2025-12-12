/**
 * EventAdminFilters Component
 *
 * Filtros para la lista de eventos: búsqueda, filtros avanzados, exportar.
 */
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  MagnifyingGlass,
  SlidersHorizontal,
  Export,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";
import { EventStatus } from "@/types/event";
import type { EventType, EventCategory, EventModality } from "@/types/event";

interface EventAdminFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedModality: string;
  onModalityChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  types: EventType[];
  categories: EventCategory[];
  modalities: EventModality[];
  onExport: () => void;
  onClearFilters: () => void;
}

export const EventAdminFilters: React.FC<EventAdminFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedModality,
  onModalityChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  types,
  categories,
  modalities,
  onExport,
  onClearFilters,
}) => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Contar filtros activos
  const activeFiltersCount = [
    selectedStatus,
    selectedModality,
    selectedType,
    selectedCategory,
  ].filter((v) => v && v !== "all").length;

  // Cerrar popover al click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]);

  const statusOptions = [
    { value: "all", label: t("events.filters.all_status", "Todos los estados") },
    { value: EventStatus.PUBLISHED, label: t("events.status.published", "Publicado") },
    { value: EventStatus.DRAFT, label: t("events.status.draft", "Borrador") },
    { value: EventStatus.COMPLETED, label: t("events.status.completed", "Completado") },
    { value: EventStatus.CANCELLED, label: t("events.status.cancelled", "Cancelado") },
    { value: EventStatus.ARCHIVED, label: t("events.status.archived", "Archivado") },
  ];

  const modalityOptions = [
    { value: "all", label: t("events.filters.all_modalities", "Todas las modalidades") },
    ...modalities.map((m) => ({ value: String(m.id), label: m.name })),
  ];

  const typeOptions = [
    { value: "all", label: t("events.filters.all_types", "Todos los tipos") },
    ...types.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  const categoryOptions = [
    { value: "all", label: t("events.filters.all_categories", "Todas las categorías") },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  return (
    <div className="events-admin__filters">
      {/* Search */}
      <div className="events-admin__filters-search">
        <Input
          placeholder={t("events.filters.search_placeholder", "Buscar por título o slug...")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<MagnifyingGlass size={18} />}
        />
      </div>

      {/* Actions */}
      <div className="events-admin__filters-actions">
        {/* Filtros avanzados */}
        <div className="events-admin__filters-popover-container" ref={popoverRef}>
          <Button
            variant={activeFiltersCount > 0 ? "soft" : "secondary"}
            size="md"
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          >
            <SlidersHorizontal
              size={18}
              weight={activeFiltersCount > 0 ? "fill" : "regular"}
            />
            {t("events.filters.filters", "Filtros")}
            {activeFiltersCount > 0 && (
              <span className="events-admin__filters-badge">{activeFiltersCount}</span>
            )}
          </Button>

          {isPopoverOpen && (
            <div className="events-admin__filters-popover">
              <div className="events-admin__filters-popover-header">
                <h4>{t("events.filters.advanced", "Filtros Avanzados")}</h4>
                <button
                  className="events-admin__filters-popover-close"
                  onClick={() => setIsPopoverOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="events-admin__filters-popover-body">
                <SimpleSelect
                  label={t("events.filters.status", "Estado")}
                  value={selectedStatus}
                  onChange={onStatusChange}
                  options={statusOptions}
                />

                <SimpleSelect
                  label={t("events.filters.modality", "Modalidad")}
                  value={selectedModality}
                  onChange={onModalityChange}
                  options={modalityOptions}
                />

                <SimpleSelect
                  label={t("events.filters.type", "Tipo")}
                  value={selectedType}
                  onChange={onTypeChange}
                  options={typeOptions}
                />

                <SimpleSelect
                  label={t("events.filters.category", "Categoría")}
                  value={selectedCategory}
                  onChange={onCategoryChange}
                  options={categoryOptions}
                />
              </div>

              {activeFiltersCount > 0 && (
                <div className="events-admin__filters-popover-footer">
                  <Button variant="ghost" size="sm" onClick={onClearFilters}>
                    {t("events.filters.clear", "Limpiar filtros")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export */}
        <Button variant="secondary" size="md" onClick={onExport}>
          <Export size={18} />
          {t("events.filters.export", "Exportar")}
        </Button>
      </div>
    </div>
  );
};

export default EventAdminFilters;
