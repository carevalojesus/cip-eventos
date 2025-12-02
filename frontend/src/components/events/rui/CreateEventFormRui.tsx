import React, { useState } from "react";
import { type UseFormReturn, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/rui-input";
import { Button } from "@/components/ui/rui-button";
import {
  FormTextarea,
  FormCard,
  FormRow,
  FormGroup,
  FormSelect,
  FormDateTimePicker,
  FormImageUpload,
} from "@/components/ui/rui/form";
import { ModalitySelector } from "@/components/ui/rui/ModalitySelector";
import { IconAdd } from "@/components/icons/DuotoneIcons";

import { requiresLocation, requiresVirtualAccess } from "@/constants/modalities";
import type { EventType, EventCategory, EventModality } from "@/types/event";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";

interface CreateEventFormRuiProps {
  form: UseFormReturn<CreateEventFormValues>;
  types: EventType[];
  categories: EventCategory[];
  modalities: EventModality[];
  onSubmit: (data: CreateEventFormValues) => Promise<void>;
  onSaveDraft: (data: CreateEventFormValues) => Promise<void>;
  submitting: boolean;
  onCancel: () => void;
}

export const CreateEventFormRui: React.FC<CreateEventFormRuiProps> = ({
  form,
  types,
  categories,
  modalities,
  onSubmit,
  onSaveDraft,
  submitting,
  onCancel,
}) => {
  const { t } = useTranslation();
  const {
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = form;

  const selectedModalityId = watch("modalityId");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const modalityId = selectedModalityId ? parseInt(selectedModalityId) : 0;
  const showLocation = requiresLocation(modalityId);
  const showVirtual = requiresVirtualAccess(modalityId);

  const handleCreate = handleSubmit(() => {
    setShowConfirmDialog(true);
  });

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    const data = form.getValues();
    await onSaveDraft(data);
  };

  // Styles - Two column layout with emphasis on form (Refactoring UI)
  const containerStyle: React.CSSProperties = {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "var(--space-6)",
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: "var(--space-6)",
  };

  const backButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "0",
    marginBottom: "var(--space-3)",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 150ms ease",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xl)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    marginBottom: "var(--space-1)",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
  };

  // Section row: label column left + card with form right
  const sectionRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: "var(--space-6)",
    paddingBottom: "var(--space-6)",
    marginBottom: "var(--space-6)",
    borderBottom: "1px solid var(--color-grey-100)",
  };

  const sectionLabelStyle: React.CSSProperties = {
    paddingTop: "var(--space-4)",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    marginBottom: "var(--space-1)",
  };

  const sectionDescStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-muted)",
    lineHeight: 1.5,
  };

  // Card container for form fields
  const formCardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-5)",
  };

  const formFieldsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
  };

  // Row for 2 fields side by side
  const twoColRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--space-4)",
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "var(--space-4)",
    marginTop: "var(--space-6)",
    paddingTop: "var(--space-5)",
    borderTop: "1px solid var(--color-grey-100)",
  };

  const cancelLinkStyle: React.CSSProperties = {
    padding: "0",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 150ms ease",
  };

  // Dialog styles
  const dialogOverlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: "var(--color-background)",
    borderRadius: "var(--space-3)",
    padding: "var(--space-6)",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  };

  const dialogTitleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    marginBottom: "var(--space-2)",
  };

  const dialogDescStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-secondary)",
    marginBottom: "var(--space-6)",
    lineHeight: 1.5,
  };

  const dialogActionsStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "var(--space-3)",
  };

  // Options for selects
  const typeOptions = types.map((type) => ({
    value: type.id.toString(),
    label: type.name,
  }));

  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  const platformOptions = [
    { value: "Zoom", label: "Zoom" },
    { value: "Google Meet", label: "Google Meet" },
    { value: "Microsoft Teams", label: "Microsoft Teams" },
    { value: "Other", label: t("create_event.virtual.other", "Otro") },
  ];

  return (
    <>
      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <button
            type="button"
            style={backButtonStyle}
            onClick={onCancel}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t("create_event.back", "Volver")}
          </button>
          <h1 style={titleStyle}>
            {t("dashboard.events_view.create_title", "Crear Nuevo Evento")}
          </h1>
          <p style={subtitleStyle}>
            {t(
              "dashboard.events_view.create_subtitle",
              "Complete la información para publicar un evento en el calendario del CIP."
            )}
          </p>
        </header>

        {/* Section 1: Basic Info */}
        <div style={sectionRowStyle}>
          <div style={sectionLabelStyle}>
            <h2 style={sectionTitleStyle}>
              {t("create_event.basic.title", "Información Básica")}
            </h2>
            <p style={sectionDescStyle}>
              {t("create_event.basic.description", "Datos principales del evento.")}
            </p>
          </div>
          <div style={formCardStyle}>
            <div style={formFieldsStyle}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("create_event.basic.event_title", "Título del Evento")}
                    placeholder={t("create_event.basic.event_title_placeholder", "Nombre del evento")}
                    error={errors.title?.message}
                    required
                  />
                )}
              />
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("create_event.basic.summary", "Resumen Corto")}
                    placeholder={t("create_event.basic.summary_placeholder", "Descripción breve que se muestra en las tarjetas")}
                    error={errors.summary?.message}
                    maxLength={150}
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <FormTextarea
                    {...field}
                    label={t("create_event.basic.detailed_description", "Descripción")}
                    placeholder={t("create_event.basic.detailed_description_placeholder", "Información completa del evento...")}
                    error={errors.description?.message}
                    required
                    rows={4}
                  />
                )}
              />
              <div style={twoColRowStyle}>
                <Controller
                  name="typeId"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      label={t("create_event.basic.type", "Tipo")}
                      value={field.value}
                      onChange={field.onChange}
                      options={typeOptions}
                      placeholder={t("form.select", "Seleccionar...")}
                      error={errors.typeId?.message}
                    />
                  )}
                />
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      label={t("create_event.basic.category", "Categoría")}
                      value={field.value}
                      onChange={field.onChange}
                      options={categoryOptions}
                      placeholder={t("form.select", "Seleccionar...")}
                      error={errors.categoryId?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Schedule & Modality */}
        <div style={sectionRowStyle}>
          <div style={sectionLabelStyle}>
            <h2 style={sectionTitleStyle}>
              {t("create_event.config.title", "Fecha y Modalidad")}
            </h2>
            <p style={sectionDescStyle}>
              {t("create_event.config.description", "Cuándo y cómo se realizará.")}
            </p>
          </div>
          <div style={formCardStyle}>
            <div style={formFieldsStyle}>
              <div style={twoColRowStyle}>
                <Controller
                  name="startAt"
                  control={control}
                  render={({ field }) => (
                    <FormDateTimePicker
                      label={t("create_event.config.start", "Inicio")}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.startAt?.message}
                      required
                    />
                  )}
                />
                <Controller
                  name="endAt"
                  control={control}
                  render={({ field }) => (
                    <FormDateTimePicker
                      label={t("create_event.config.end", "Fin")}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.endAt?.message}
                      required
                    />
                  )}
                />
              </div>
              <Controller
                name="modalityId"
                control={control}
                render={({ field }) => (
                  <ModalitySelector
                    modalities={modalities}
                    value={field.value || ""}
                    onChange={field.onChange}
                    error={errors.modalityId?.message}
                    required
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Location (conditional) */}
        {showLocation && (
          <div style={sectionRowStyle}>
            <div style={sectionLabelStyle}>
              <h2 style={sectionTitleStyle}>
                {t("create_event.location.title", "Ubicación")}
              </h2>
              <p style={sectionDescStyle}>
                {t("create_event.location.description", "Lugar físico del evento.")}
              </p>
            </div>
            <div style={formCardStyle}>
              <div style={formFieldsStyle}>
                <div style={twoColRowStyle}>
                  <Controller
                    name="locationName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label={t("create_event.location.name", "Nombre del Lugar")}
                        placeholder={t("create_event.location.name_placeholder", "Ej: Auditorio CIP")}
                        error={errors.locationName?.message}
                      />
                    )}
                  />
                  <Controller
                    name="locationCity"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label={t("create_event.location.city", "Ciudad")}
                        placeholder="Lima"
                        error={errors.locationCity?.message}
                      />
                    )}
                  />
                </div>
                <Controller
                  name="locationAddress"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label={t("create_event.location.address", "Dirección")}
                      placeholder={t("create_event.location.address_placeholder", "Ej: Av. Pevas Cuadra 4")}
                      error={errors.locationAddress?.message}
                    />
                  )}
                />
                <div style={twoColRowStyle}>
                  <Controller
                    name="locationReference"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label={t("create_event.location.reference", "Referencia")}
                        placeholder={t("create_event.location.reference_placeholder", "Frente al Parque...")}
                      />
                    )}
                  />
                  <Controller
                    name="locationMapLink"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label={t("create_event.location.map_link", "Link de Mapa")}
                        placeholder="https://maps.google.com/..."
                        error={errors.locationMapLink?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Virtual (conditional) */}
        {showVirtual && (
          <div style={sectionRowStyle}>
            <div style={sectionLabelStyle}>
              <h2 style={sectionTitleStyle}>
                {t("create_event.virtual.title", "Acceso Virtual")}
              </h2>
              <p style={sectionDescStyle}>
                {t("create_event.virtual.description", "Datos de la reunión virtual.")}
              </p>
            </div>
            <div style={formCardStyle}>
              <div style={formFieldsStyle}>
                <div style={twoColRowStyle}>
                  <Controller
                    name="virtualPlatform"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        label={t("create_event.virtual.platform", "Plataforma")}
                        value={field.value || ""}
                        onChange={field.onChange}
                        options={platformOptions}
                        placeholder={t("form.select", "Seleccionar...")}
                        error={errors.virtualPlatform?.message}
                        required
                      />
                    )}
                  />
                  <Controller
                    name="virtualMeetingPassword"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label={t("create_event.virtual.password", "Contraseña")}
                        placeholder="CIP2024"
                      />
                    )}
                  />
                </div>
                <Controller
                  name="virtualMeetingUrl"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label={t("create_event.virtual.meeting_url", "Link de Reunión")}
                      placeholder="https://zoom.us/j/..."
                      error={errors.virtualMeetingUrl?.message}
                    />
                  )}
                />
                <Controller
                  name="virtualInstructions"
                  control={control}
                  render={({ field }) => (
                    <FormTextarea
                      {...field}
                      label={t("create_event.virtual.instructions", "Instrucciones")}
                      placeholder={t("create_event.virtual.instructions_placeholder", "Instrucciones para unirse...")}
                      rows={3}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Image */}
        <div style={{ ...sectionRowStyle, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
          <div style={sectionLabelStyle}>
            <h2 style={sectionTitleStyle}>
              {t("create_event.image.title", "Imagen")}
            </h2>
            <p style={sectionDescStyle}>
              {t("create_event.image.description", "Banner del evento.")}
            </p>
          </div>
          <div style={formCardStyle}>
            <Controller
              name="coverImage"
              control={control}
              render={({ field }) => (
                <FormImageUpload
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={actionsStyle}>
          <button
            type="button"
            style={cancelLinkStyle}
            onClick={onCancel}
            disabled={submitting}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
          >
            {t("form.cancel", "Cancelar")}
          </button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreate}
            disabled={submitting}
            isLoading={submitting}
            loadingText={t("form.loading", "Guardando...")}
          >
            <IconAdd size={16} primary="white" secondary="rgba(255,255,255,0.5)" />
            {t("form.create_event", "Crear Evento")}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          style={dialogOverlayStyle}
          onClick={() => setShowConfirmDialog(false)}
        >
          <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={dialogTitleStyle}>
              {t("create_event.confirm.create_title", "¿Crear evento?")}
            </h2>
            <p style={dialogDescStyle}>
              {t(
                "create_event.confirm.create_description",
                "El evento se guardará como borrador. Podrás editarlo y publicarlo cuando esté listo."
              )}
            </p>
            <div style={dialogActionsStyle}>
              <button
                type="button"
                style={cancelLinkStyle}
                onClick={() => setShowConfirmDialog(false)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                {t("form.cancel", "Cancelar")}
              </button>
              <Button variant="primary" size="md" onClick={handleConfirm}>
                {t("form.create_event", "Crear Evento")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
