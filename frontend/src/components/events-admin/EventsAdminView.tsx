/**
 * EventsAdminView Component
 *
 * Vista principal de la lista de eventos para SuperAdmin.
 * Incluye filtros, tabla con selección y paginación.
 */
import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { eventsService } from "@/services/events.service";
import { PageContainer } from "@/components/ui/page-container";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  EventAdminPageHeader,
  EventAdminFilters,
  EventAdminTable,
  EventAdminSkeleton,
  EventAdminEmptyState,
  CreateEventDrawer,
} from "./components";
import type { Event } from "@/types/event";
import { EventStatus } from "@/types/event";
import "./EventsAdminView.css";

interface EventsAdminViewProps {
  onNavigate: (path: string) => void;
}

export const EventsAdminView: React.FC<EventsAdminViewProps> = ({
  onNavigate,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Estado de filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedModality, setSelectedModality] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Estado de selección
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Paginación (server-side)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Estado del drawer de crear evento
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  // Queries
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["events-admin", page, limit],
    queryFn: () => eventsService.findAllPaginated(page, limit),
  });

  const { data: types = [] } = useQuery({
    queryKey: ["event-types"],
    queryFn: eventsService.getTypes,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["event-categories"],
    queryFn: eventsService.getCategories,
  });

  const { data: modalities = [] } = useQuery({
    queryKey: ["event-modalities"],
    queryFn: eventsService.getModalities,
  });

  // Mutations
  const publishMutation = useMutation({
    mutationFn: (id: string) => eventsService.publish(id),
    onSuccess: () => {
      toast.success(t("events.toast.publish_success", "Evento publicado"), {
        description: t("events.toast.publish_description", "El evento ya está visible para los participantes."),
      });
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      if (message?.includes("location") || message?.includes("ubicación")) {
        toast.error(t("events.toast.publish_needs_location", "Falta configurar la ubicación"), {
          description: t("events.toast.edit_to_add", "Edita el evento para agregar la información requerida."),
        });
      } else if (message?.includes("virtual")) {
        toast.error(t("events.toast.publish_needs_virtual", "Falta configurar el acceso virtual"), {
          description: t("events.toast.edit_to_add", "Edita el evento para agregar la información requerida."),
        });
      } else if (message?.includes("ticket")) {
        toast.error(t("events.toast.publish_needs_tickets", "Falta crear al menos un tipo de entrada"), {
          description: t("events.toast.edit_to_add", "Edita el evento para agregar la información requerida."),
        });
      } else {
        toast.error(t("events.toast.publish_error", "Error al publicar evento"), {
          description: message || t("events.toast.try_again", "Intenta nuevamente."),
        });
      }
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => eventsService.unpublish(id),
    onSuccess: () => {
      toast.success(t("events.toast.unpublish_success", "Evento despublicado"));
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t("events.toast.unpublish_error", "Error al despublicar");
      toast.error(message);
    },
  });

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    if (!eventsData?.data) return [];

    return eventsData.data.filter((event) => {
      // Búsqueda por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesSlug = event.slug.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSlug) return false;
      }

      // Filtro por estado
      if (selectedStatus !== "all" && event.status !== selectedStatus) {
        return false;
      }

      // Filtro por modalidad
      if (selectedModality !== "all" && String(event.modality?.id) !== selectedModality) {
        return false;
      }

      // Filtro por tipo
      if (selectedType !== "all" && String(event.type?.id) !== selectedType) {
        return false;
      }

      // Filtro por categoría
      if (selectedCategory !== "all" && String(event.category?.id) !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [eventsData?.data, searchQuery, selectedStatus, selectedModality, selectedType, selectedCategory]);

  // Handlers
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(filteredEvents.map((e) => e.id));
      } else {
        setSelectedIds([]);
      }
    },
    [filteredEvents]
  );

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  }, []);

  const handleView = useCallback(
    (event: Event) => {
      onNavigate(`/eventos/${event.id}`);
    },
    [onNavigate]
  );

  const handleEdit = useCallback(
    (event: Event) => {
      onNavigate(`/eventos/${event.id}/editar`);
    },
    [onNavigate]
  );

  const handlePublish = useCallback(
    (event: Event) => {
      publishMutation.mutate(event.id);
    },
    [publishMutation]
  );

  const handleUnpublish = useCallback(
    (event: Event) => {
      unpublishMutation.mutate(event.id);
    },
    [unpublishMutation]
  );

  const handleDelete = useCallback((event: Event) => {
    // TODO: Implementar delete con confirmación
    console.log("Delete event:", event.id);
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implementar exportación CSV
    console.log("Export events");
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedModality("all");
    setSelectedType("all");
    setSelectedCategory("all");
  }, []);

  const hasActiveFilters =
    searchQuery ||
    selectedStatus !== "all" ||
    selectedModality !== "all" ||
    selectedType !== "all" ||
    selectedCategory !== "all";

  const totalEvents = eventsData?.meta?.total ?? 0;

  return (
    <PageContainer maxWidth="lg" padding="md">
      <EventAdminPageHeader
        onCreateEvent={() => setIsCreateDrawerOpen(true)}
        totalEvents={totalEvents}
      />

      <EventAdminFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedModality={selectedModality}
        onModalityChange={setSelectedModality}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        types={types}
        categories={categories}
        modalities={modalities}
        onExport={handleExport}
        onClearFilters={handleClearFilters}
      />

      {isLoadingEvents ? (
        <EventAdminSkeleton />
      ) : filteredEvents.length === 0 ? (
        <EventAdminEmptyState
          hasFilters={hasActiveFilters}
          onCreateEvent={() => setIsCreateDrawerOpen(true)}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <>
          <EventAdminTable
            events={filteredEvents}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onView={handleView}
            onEdit={handleEdit}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onDelete={handleDelete}
          />

          {eventsData?.meta && eventsData.meta.totalPages > 1 && (
            <TablePagination
              currentPage={page}
              totalPages={eventsData.meta.totalPages}
              totalItems={eventsData.meta.total}
              startIndex={(page - 1) * limit + 1}
              endIndex={Math.min(page * limit, eventsData.meta.total)}
              pageNumbers={Array.from(
                { length: Math.min(5, eventsData.meta.totalPages) },
                (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, eventsData.meta.totalPages - 4));
                  return start + i;
                }
              ).filter(n => n <= eventsData.meta.totalPages)}
              onPageChange={setPage}
              onNextPage={() => setPage(page + 1)}
              onPrevPage={() => setPage(page - 1)}
              isFirstPage={page === 1}
              isLastPage={page === eventsData.meta.totalPages}
              itemLabel={t("events.label", "eventos")}
            />
          )}
        </>
      )}

      {/* Create Event Drawer */}
      <CreateEventDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["events-admin"] });
        }}
      />
    </PageContainer>
  );
};

export default EventsAdminView;
