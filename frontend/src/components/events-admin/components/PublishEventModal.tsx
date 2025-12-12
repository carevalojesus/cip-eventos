/**
 * PublishEventModal Component
 *
 * Modal de confirmación para publicar un evento.
 * Muestra validaciones y advertencias según la modalidad.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  WarningCircle,
  MapPin,
  VideoCamera,
  Ticket,
  CalendarBlank,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { Event } from "@/types/event";
import { MODALITY_IDS } from "@/constants/modalities";

interface PublishEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  event: Event;
  isPublishing?: boolean;
}

interface ValidationItem {
  label: string;
  isValid: boolean;
  isRequired: boolean;
}

export const PublishEventModal: React.FC<PublishEventModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  event,
  isPublishing = false,
}) => {
  const { t } = useTranslation();

  // Determinar qué requiere según modalidad
  const modalityId = event.modality?.id || 0;
  const requiresLocation = modalityId === MODALITY_IDS.PRESENTIAL || modalityId === MODALITY_IDS.HYBRID;
  const requiresVirtual = modalityId === MODALITY_IDS.VIRTUAL || modalityId === MODALITY_IDS.HYBRID;

  // Validaciones
  const validations: ValidationItem[] = [
    {
      label: t("events.publish.has_location", "Ubicación configurada"),
      isValid: !!event.location?.address && !!event.location?.city,
      isRequired: requiresLocation,
    },
    {
      label: t("events.publish.has_virtual", "Acceso virtual configurado"),
      isValid: !!event.virtualAccess?.platform && !!event.virtualAccess?.meetingUrl,
      isRequired: requiresVirtual,
    },
    {
      label: t("events.publish.has_tickets", "Al menos un tipo de entrada"),
      isValid: (event.tickets?.length || 0) > 0,
      isRequired: true,
    },
    {
      label: t("events.publish.has_sessions", "Al menos una sesión"),
      isValid: (event.sessions?.length || 0) > 0,
      isRequired: false,
    },
  ];

  // Filtrar solo las validaciones relevantes
  const relevantValidations = validations.filter(v => v.isRequired || v.isValid);

  // Verificar si hay errores bloqueantes
  const hasBlockingErrors = validations.some(v => v.isRequired && !v.isValid);

  // Contar warnings (recomendados pero no requeridos)
  const warnings = validations.filter(v => !v.isRequired && !v.isValid);

  const getIcon = (label: string) => {
    if (label.includes("Ubicación")) return <MapPin size={16} />;
    if (label.includes("virtual")) return <VideoCamera size={16} />;
    if (label.includes("entrada")) return <Ticket size={16} />;
    if (label.includes("sesión")) return <CalendarBlank size={16} />;
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("events.publish.title", "Publicar Evento")}
          </DialogTitle>
          <DialogDescription>
            {t("events.publish.description", "Revisa que el evento tenga toda la información necesaria antes de publicarlo.")}
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Nombre del evento */}
          <div style={{
            padding: "var(--space-3)",
            backgroundColor: "var(--color-grey-050)",
            borderRadius: "var(--radius-md)"
          }}>
            <p style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0
            }}>
              {event.title}
            </p>
            <p style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              margin: "var(--space-1) 0 0 0"
            }}>
              {event.modality?.name}
            </p>
          </div>

          {/* Lista de validaciones */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {relevantValidations.map((validation, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-3)",
                  backgroundColor: validation.isValid ? "var(--color-green-050)" : "var(--color-red-050)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                {validation.isValid ? (
                  <CheckCircle size={18} color="var(--color-success)" weight="fill" />
                ) : (
                  <WarningCircle size={18} color="var(--color-danger)" weight="fill" />
                )}
                <span style={{ flex: 1 }}>{validation.label}</span>
                {validation.isRequired && !validation.isValid && (
                  <span style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-danger)",
                    fontWeight: 500
                  }}>
                    {t("events.publish.required", "Requerido")}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Alerta de error si hay validaciones fallidas */}
          {hasBlockingErrors && (
            <Alert variant="danger">
              {t("events.publish.missing_required", "Completa los campos requeridos antes de publicar. Puedes editarlos haciendo clic en 'Editar'.")}
            </Alert>
          )}

          {/* Warning de recomendaciones */}
          {!hasBlockingErrors && warnings.length > 0 && (
            <Alert variant="warning">
              {t("events.publish.recommendations", "Recomendamos agregar sesiones para mejorar la experiencia de los participantes.")}
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isPublishing}>
            {t("form.cancel", "Cancelar")}
          </Button>
          {hasBlockingErrors ? (
            <Button variant="primary" onClick={onClose}>
              {t("events.actions.edit", "Editar Evento")}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onConfirm}
              disabled={isPublishing}
              isLoading={isPublishing}
              loadingText={t("events.publish.publishing", "Publicando...")}
            >
              {t("events.actions.publish", "Publicar")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishEventModal;
