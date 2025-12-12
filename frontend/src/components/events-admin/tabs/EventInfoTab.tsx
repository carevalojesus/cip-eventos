/**
 * EventInfoTab Component
 *
 * Tab de información general del evento.
 * Usa componentes RUI: Alert, Section, DataField.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Info,
  CalendarBlank,
  Image,
  Certificate,
  Globe,
  MapPin,
} from "@phosphor-icons/react";
import { Alert } from "@/components/ui/rui";
import { Section } from "@/components/ui/section";
import { DataField, DataFieldGroup } from "@/components/ui/data-field";
import type { Event } from "@/types/event";
import { EventStatus } from "@/types/event";

interface EventInfoTabProps {
  event: Event;
}

export const EventInfoTab: React.FC<EventInfoTabProps> = ({ event }) => {
  const { t } = useTranslation();

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-PE", {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  const getStatusInfo = () => {
    switch (event.status) {
      case EventStatus.DRAFT:
        return {
          variant: "neutral" as const,
          title: t("events.info.status_draft_title", "Evento en Borrador"),
          description: t(
            "events.info.status_draft_desc",
            "Este evento aún no está publicado. Los usuarios no pueden verlo ni inscribirse."
          ),
        };
      case EventStatus.PUBLISHED:
        return {
          variant: "success" as const,
          title: t("events.info.status_published_title", "Evento Publicado"),
          description: t(
            "events.info.status_published_desc",
            "Este evento está visible para los usuarios y acepta inscripciones."
          ),
        };
      case EventStatus.COMPLETED:
        return {
          variant: "info" as const,
          title: t("events.info.status_completed_title", "Evento Finalizado"),
          description: t(
            "events.info.status_completed_desc",
            "Este evento ya finalizó. Puedes generar certificados y ver reportes."
          ),
        };
      case EventStatus.CANCELLED:
        return {
          variant: "error" as const,
          title: t("events.info.status_cancelled_title", "Evento Cancelado"),
          description: t(
            "events.info.status_cancelled_desc",
            "Este evento fue cancelado y no acepta más inscripciones."
          ),
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="event-info-tab">
      {/* Status Alert */}
      {statusInfo && (
        <Alert variant={statusInfo.variant} title={statusInfo.title}>
          {statusInfo.description}
        </Alert>
      )}

      {/* Basic Info Section */}
      <Section>
        <Section.Header
          icon={<Info size={18} weight="duotone" />}
          iconVariant="info"
          title={t("events.info.basic_title", "Información Básica")}
          subtitle={t("events.info.basic_subtitle", "Datos principales del evento")}
        />
        <Section.Content>
          {/* Título y Slug - 2 columnas */}
          <DataFieldGroup columns={2}>
            <DataField
              label={t("events.info.title", "Título")}
              value={event.title}
            />
            <DataField
              label={t("events.info.slug", "Slug (URL)")}
              value={`/${event.slug}`}
              copyable
            />
          </DataFieldGroup>

          {/* Tipo, Categoría y Modalidad - 3 columnas */}
          <DataFieldGroup columns={3} className="rui-data-field-group--mt">
            <DataField
              label={t("events.info.type", "Tipo de Evento")}
              value={event.type?.name || "-"}
            />
            <DataField
              label={t("events.info.category", "Categoría")}
              value={event.category?.name || "-"}
            />
            <DataField
              label={t("events.info.modality", "Modalidad")}
              value={event.modality?.name || "-"}
            />
          </DataFieldGroup>

          {/* Resumen - 1 columna */}
          <DataFieldGroup columns={1} className="rui-data-field-group--mt">
            <DataField
              label={t("events.info.summary", "Resumen")}
              value={event.summary || "-"}
            />
          </DataFieldGroup>

          {/* Descripción - 1 columna (textarea style) */}
          <DataFieldGroup columns={1} className="rui-data-field-group--mt">
            <DataField
              label={t("events.info.description", "Descripción")}
              value={event.description}
            />
          </DataFieldGroup>
        </Section.Content>
      </Section>

      {/* Dates Section */}
      <Section>
        <Section.Header
          icon={<CalendarBlank size={18} weight="duotone" />}
          iconVariant="info"
          title={t("events.info.dates_title", "Fechas y Horarios")}
          subtitle={t("events.info.dates_subtitle", "Configuración temporal del evento")}
        />
        <Section.Content>
          <DataFieldGroup>
            <DataField
              label={t("events.info.start_date", "Fecha y Hora de Inicio")}
              value={formatDateTime(event.startAt)}
            />
            <DataField
              label={t("events.info.end_date", "Fecha y Hora de Fin")}
              value={formatDateTime(event.endAt)}
            />
            <DataField
              label={t("events.info.timezone", "Zona Horaria")}
              value={event.timezone || "America/Lima"}
            />
          </DataFieldGroup>
        </Section.Content>
      </Section>

      {/* Location Section */}
      {event.location && (
        <Section>
          <Section.Header
            icon={<MapPin size={18} weight="duotone" />}
            iconVariant="success"
            title={t("events.info.location_title", "Ubicación")}
            subtitle={t("events.info.location_subtitle", "Lugar físico del evento")}
          />
          <Section.Content>
            <DataFieldGroup>
              <DataField
                label={t("events.info.address", "Dirección")}
                value={event.location.address}
              />
              <DataField
                label={t("events.info.city", "Ciudad")}
                value={event.location.city}
              />
              {event.location.reference && (
                <DataField
                  label={t("events.info.reference", "Referencia")}
                  value={event.location.reference}
                />
              )}
              {event.location.mapLink && (
                <DataField
                  label={t("events.info.map_link", "Ver en Mapa")}
                  value={
                    <a
                      href={event.location.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rui-data-field__link"
                    >
                      {t("events.info.open_map", "Abrir en Google Maps")}
                    </a>
                  }
                />
              )}
            </DataFieldGroup>
          </Section.Content>
        </Section>
      )}

      {/* Virtual Access Section */}
      {event.virtualAccess && (
        <Section>
          <Section.Header
            icon={<Globe size={18} weight="duotone" />}
            iconVariant="info"
            title={t("events.info.virtual_title", "Acceso Virtual")}
            subtitle={t("events.info.virtual_subtitle", "Configuración de streaming")}
          />
          <Section.Content>
            <DataFieldGroup>
              <DataField
                label={t("events.info.platform", "Plataforma")}
                value={event.virtualAccess.platform}
              />
              <DataField
                label={t("events.info.meeting_url", "URL de Reunión")}
                value={event.virtualAccess.meetingUrl}
                copyable
              />
              {event.virtualAccess.meetingPassword && (
                <DataField
                  label={t("events.info.meeting_password", "Contraseña")}
                  value="••••••••"
                />
              )}
              {event.virtualAccess.instructions && (
                <DataField
                  label={t("events.info.instructions", "Instrucciones")}
                  value={event.virtualAccess.instructions}
                />
              )}
            </DataFieldGroup>
          </Section.Content>
        </Section>
      )}

      {/* Certificate Section */}
      <Section>
        <Section.Header
          icon={<Certificate size={18} weight="duotone" />}
          iconVariant="warning"
          title={t("events.info.certificate_title", "Configuración de Certificados")}
          subtitle={t("events.info.certificate_subtitle", "Opciones de certificación")}
        />
        <Section.Content>
          <DataFieldGroup>
            <DataField
              label={t("events.info.has_certificate", "Emite Certificados")}
              value={event.hasCertificate ? t("common.yes", "Sí") : t("common.no", "No")}
            />
            {event.hasCertificate && (
              <DataField
                label={t("events.info.certificate_hours", "Horas Académicas")}
                value={`${event.certificateHours ?? 0} horas`}
              />
            )}
          </DataFieldGroup>
        </Section.Content>
      </Section>

      {/* Cover Image Section */}
      <Section>
        <Section.Header
          icon={<Image size={18} weight="duotone" />}
          iconVariant="neutral"
          title={t("events.info.image_title", "Imagen de Portada")}
          subtitle={t("events.info.image_subtitle", "Imagen principal del evento")}
        />
        <Section.Content>
          {event.imageUrl ? (
            <div className="event-info-tab__image-container">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="event-info-tab__image"
              />
            </div>
          ) : (
            <p className="event-info-tab__no-image">
              {t("events.info.no_image", "No se ha configurado una imagen de portada.")}
            </p>
          )}
        </Section.Content>
      </Section>
    </div>
  );
};

export default EventInfoTab;
