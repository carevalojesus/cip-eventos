/**
 * EventDetailAdminView Component
 *
 * Vista de detalle del evento para SuperAdmin.
 * Layout 2 columnas: Main (tabs) + Sidebar (info rápida).
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Info,
  MapPin,
  Buildings,
  CalendarBlank,
  Ticket,
  Tag,
  Gift,
  Users,
  ChartBar,
  Certificate,
  Gear,
  PencilSimple,
  XCircle,
} from "@phosphor-icons/react";
import { eventsService } from "@/services/events.service";
import { EventStatus } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EventAdminStatusBadge, EventAdminModalityBadge, PublishEventModal } from "./components";
import {
  EventInfoTab,
  EventSessionsTab,
  EventTicketsTab,
  EventRegistrationsTab,
  EventOrganizersTab,
  EventCouponsTab,
  EventCourtesiesTab,
} from "./tabs";
import "./EventDetailAdminView.css";

interface EventDetailAdminViewProps {
  eventId: string;
  onNavigate: (path: string) => void;
}

type TabId =
  | "info"
  | "location"
  | "organizers"
  | "sessions"
  | "tickets"
  | "coupons"
  | "courtesies"
  | "registrations"
  | "reports"
  | "certificates"
  | "settings";

interface TabConfig {
  id: TabId;
  labelKey: string;
  defaultLabel: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: "info", labelKey: "events.tabs.info", defaultLabel: "Información", icon: <Info size={18} /> },
  { id: "organizers", labelKey: "events.tabs.organizers", defaultLabel: "Organizadores", icon: <Buildings size={18} /> },
  { id: "sessions", labelKey: "events.tabs.sessions", defaultLabel: "Sesiones", icon: <CalendarBlank size={18} /> },
  { id: "tickets", labelKey: "events.tabs.tickets", defaultLabel: "Entradas", icon: <Ticket size={18} /> },
  { id: "coupons", labelKey: "events.tabs.coupons", defaultLabel: "Cupones", icon: <Tag size={18} /> },
  { id: "courtesies", labelKey: "events.tabs.courtesies", defaultLabel: "Cortesías", icon: <Gift size={18} /> },
  { id: "registrations", labelKey: "events.tabs.registrations", defaultLabel: "Inscripciones", icon: <Users size={18} /> },
  { id: "reports", labelKey: "events.tabs.reports", defaultLabel: "Reportes", icon: <ChartBar size={18} /> },
];

export const EventDetailAdminView: React.FC<EventDetailAdminViewProps> = ({
  eventId,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const queryClient = useQueryClient();

  // Query para obtener el evento completo
  const { data: event, isLoading } = useQuery({
    queryKey: ["event-admin-detail", eventId],
    queryFn: () => eventsService.findByIdFull(eventId),
    enabled: !!eventId,
  });

  // Mutations
  const publishMutation = useMutation({
    mutationFn: () => eventsService.publish(eventId),
    onSuccess: () => {
      toast.success(t("events.toast.publish_success", "Evento publicado"));
      queryClient.invalidateQueries({ queryKey: ["event-admin-detail", eventId] });
      setShowPublishModal(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t("events.toast.publish_error", "Error al publicar");
      toast.error(message);
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => eventsService.unpublish(eventId),
    onSuccess: () => {
      toast.success(t("events.toast.unpublish_success", "Evento despublicado"));
      queryClient.invalidateQueries({ queryKey: ["event-admin-detail", eventId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t("events.toast.unpublish_error", "Error al despublicar");
      toast.error(message);
    },
  });

  const handleUnpublish = () => {
    unpublishMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["event-admin-detail", eventId] });
  };

  const renderTabContent = () => {
    if (!event) return null;

    switch (activeTab) {
      case "info":
        return <EventInfoTab event={event} />;
      case "organizers":
        return <EventOrganizersTab event={event} onRefresh={handleRefresh} />;
      case "sessions":
        return <EventSessionsTab event={event} />;
      case "tickets":
        return <EventTicketsTab event={event} />;
      case "coupons":
        return <EventCouponsTab event={event} />;
      case "courtesies":
        return <EventCourtesiesTab event={event} />;
      case "registrations":
        return <EventRegistrationsTab event={event} />;
      default:
        return (
          <div className="event-detail-admin__placeholder">
            <p>{t("events.tabs.coming_soon", "Esta sección estará disponible próximamente.")}</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="lg" padding="md">
        <EventDetailSkeleton />
      </PageContainer>
    );
  }

  if (!event) {
    return (
      <PageContainer maxWidth="lg" padding="md">
        <div className="event-detail-admin__not-found">
          <h2>{t("events.detail.not_found", "Evento no encontrado")}</h2>
          <Button variant="secondary" onClick={() => onNavigate("/eventos")}>
            <ArrowLeft size={18} />
            {t("common.back", "Volver")}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" padding="md">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t("events.admin.title", "Eventos"), href: "/eventos" },
          { label: event.title }
        ]}
      />

      {/* Back button */}
      <button
        type="button"
        className="event-detail-admin__back"
        onClick={() => onNavigate("/eventos")}
      >
        <ArrowLeft size={16} />
        {t("events.detail.back_to_list", "Volver a la lista")}
      </button>

      {/* Header con acciones */}
      <div className="event-detail-admin__header">
        <div className="event-detail-admin__header-info">
          <h1 className="event-detail-admin__title">{event.title}</h1>
          <div className="event-detail-admin__header-badges">
            <EventAdminStatusBadge status={event.status} size="sm" />
            {event.modality && (
              <EventAdminModalityBadge modalityName={event.modality.name} size="sm" />
            )}
          </div>
        </div>
        <div className="event-detail-admin__header-actions">
          <Button
            variant="secondary"
            onClick={() => onNavigate(`/eventos/${event.id}/editar`)}
          >
            <PencilSimple size={16} />
            {t("events.actions.edit", "Editar")}
          </Button>
          {event.status === EventStatus.DRAFT && (
            <Button
              variant="primary"
              onClick={() => setShowPublishModal(true)}
            >
              {t("events.actions.publish", "Publicar")}
            </Button>
          )}
          {event.status === EventStatus.PUBLISHED && (
            <Button
              variant="secondary"
              onClick={handleUnpublish}
            >
              <XCircle size={16} />
              {t("events.actions.unpublish", "Despublicar")}
            </Button>
          )}
        </div>
      </div>

      <div className="event-detail-admin">

        {/* Main Content */}
        <div className="event-detail-admin__layout">
          {/* Left: Main Content */}
          <div className="event-detail-admin__main">
            {/* Event Card */}
            <div className="event-detail-admin__event-card">
              <div className="event-detail-admin__event-image-container">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="event-detail-admin__event-image"
                  />
                ) : (
                  <div className="event-detail-admin__event-image-placeholder">
                    <CalendarBlank size={48} />
                  </div>
                )}
              </div>
              <div className="event-detail-admin__event-info">
                <p className="event-detail-admin__event-slug">/{event.slug}</p>
                <div className="event-detail-admin__event-dates">
                  <CalendarBlank size={16} />
                  <span>
                    {formatDate(event.startAt)} • {formatTime(event.startAt)} -{" "}
                    {formatTime(event.endAt)}
                  </span>
                </div>
                {event.location && (
                  <div className="event-detail-admin__event-location">
                    <MapPin size={16} />
                    <span>{event.location.address}, {event.location.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="event-detail-admin__tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`event-detail-admin__tab ${
                    activeTab === tab.id ? "event-detail-admin__tab--active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {t(tab.labelKey, tab.defaultLabel)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="event-detail-admin__tab-content" role="tabpanel">
              {renderTabContent()}
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="event-detail-admin__sidebar">
            {/* Quick Stats */}
            <div className="event-detail-admin__sidebar-card">
              <h3 className="event-detail-admin__sidebar-card-title">
                {t("events.sidebar.quick_stats", "Estadísticas Rápidas")}
              </h3>
              <div className="event-detail-admin__stats-grid">
                <div className="event-detail-admin__stat">
                  <span className="event-detail-admin__stat-value">
                    {event.enrolledCount ?? 0}
                  </span>
                  <span className="event-detail-admin__stat-label">
                    {t("events.sidebar.enrolled", "Inscritos")}
                  </span>
                </div>
                <div className="event-detail-admin__stat">
                  <span className="event-detail-admin__stat-value">
                    {event.sessions?.length ?? 0}
                  </span>
                  <span className="event-detail-admin__stat-label">
                    {t("events.sidebar.sessions", "Sesiones")}
                  </span>
                </div>
                <div className="event-detail-admin__stat">
                  <span className="event-detail-admin__stat-value">
                    {event.tickets?.length ?? 0}
                  </span>
                  <span className="event-detail-admin__stat-label">
                    {t("events.sidebar.ticket_types", "Tipos de Entrada")}
                  </span>
                </div>
                <div className="event-detail-admin__stat">
                  <span className="event-detail-admin__stat-value">
                    {event.speakers?.length ?? 0}
                  </span>
                  <span className="event-detail-admin__stat-label">
                    {t("events.sidebar.speakers", "Ponentes")}
                  </span>
                </div>
              </div>
            </div>

            {/* Organizers */}
            <div className="event-detail-admin__sidebar-card">
              <h3 className="event-detail-admin__sidebar-card-title">
                <Buildings size={18} />
                {t("events.sidebar.organizers", "Organizadores")}
              </h3>
              <div className="event-detail-admin__organizers">
                {event.organizers?.map((org) => (
                  <div key={org.id} className="event-detail-admin__organizer">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="event-detail-admin__organizer-logo"
                      />
                    ) : (
                      <div className="event-detail-admin__organizer-logo-placeholder">
                        <Buildings size={20} />
                      </div>
                    )}
                    <span className="event-detail-admin__organizer-name">{org.name}</span>
                  </div>
                ))}
                {(!event.organizers || event.organizers.length === 0) && (
                  <p className="event-detail-admin__no-data">
                    {t("events.sidebar.no_organizers", "Sin organizadores")}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="event-detail-admin__sidebar-card">
              <h3 className="event-detail-admin__sidebar-card-title">
                {t("events.sidebar.metadata", "Información")}
              </h3>
              <div className="event-detail-admin__metadata">
                <div className="event-detail-admin__metadata-item">
                  <span className="event-detail-admin__metadata-label">ID</span>
                  <span className="event-detail-admin__metadata-value">
                    {event.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="event-detail-admin__metadata-item">
                  <span className="event-detail-admin__metadata-label">
                    {t("events.sidebar.type", "Tipo")}
                  </span>
                  <span className="event-detail-admin__metadata-value">
                    {event.type?.name || "-"}
                  </span>
                </div>
                <div className="event-detail-admin__metadata-item">
                  <span className="event-detail-admin__metadata-label">
                    {t("events.sidebar.category", "Categoría")}
                  </span>
                  <span className="event-detail-admin__metadata-value">
                    {event.category?.name || "-"}
                  </span>
                </div>
                {event.hasCertificate && (
                  <div className="event-detail-admin__metadata-item">
                    <span className="event-detail-admin__metadata-label">
                      {t("events.sidebar.certificate_hours", "Horas académicas")}
                    </span>
                    <span className="event-detail-admin__metadata-value">
                      {event.certificateHours ?? 0}h
                    </span>
                  </div>
                )}
                <div className="event-detail-admin__metadata-item">
                  <span className="event-detail-admin__metadata-label">
                    {t("events.sidebar.timezone", "Zona horaria")}
                  </span>
                  <span className="event-detail-admin__metadata-value">
                    {event.timezone || "America/Lima"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Event Modal */}
      <PublishEventModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={() => publishMutation.mutate()}
        event={event}
        isPublishing={publishMutation.isPending}
      />
    </PageContainer>
  );
};

// Skeleton Component
const EventDetailSkeleton: React.FC = () => {
  return (
    <div className="event-detail-admin">
      <div className="event-detail-admin__header">
        <Skeleton width={150} height={32} />
      </div>
      <div className="event-detail-admin__layout">
        <div className="event-detail-admin__main">
          <div className="event-detail-admin__event-card">
            <Skeleton width={200} height={150} style={{ borderRadius: "var(--radius-lg)" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Skeleton width={90} height={28} style={{ borderRadius: "var(--radius-full)" }} />
                <Skeleton width={100} height={28} style={{ borderRadius: "var(--radius-full)" }} />
              </div>
              <Skeleton width="80%" height={28} />
              <Skeleton width={150} height={16} />
              <Skeleton width={200} height={16} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-4)" }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} width={100} height={40} style={{ borderRadius: "var(--radius-md)" }} />
            ))}
          </div>
          <Skeleton width="100%" height={400} style={{ borderRadius: "var(--radius-lg)" }} />
        </div>
        <div className="event-detail-admin__sidebar">
          <Skeleton width="100%" height={180} style={{ borderRadius: "var(--radius-lg)" }} />
          <Skeleton width="100%" height={120} style={{ borderRadius: "var(--radius-lg)" }} />
          <Skeleton width="100%" height={200} style={{ borderRadius: "var(--radius-lg)" }} />
        </div>
      </div>
    </div>
  );
};

export default EventDetailAdminView;
