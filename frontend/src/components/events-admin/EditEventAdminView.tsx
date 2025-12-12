/**
 * EditEventAdminView Component
 *
 * Vista de edición de evento para SuperAdmin usando componentes RUI.
 * Layout 2 columnas: Izquierda (info básica, imagen) | Derecha (configuración, ubicación, virtual)
 */
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "axios";
import {
  ArrowLeft,
  X,
  FloppyDisk,
  Image as ImageIcon,
  CalendarBlank,
  MapPin,
  VideoCamera,
  Copy,
  Check,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form/form-select";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { FormDateTimePicker } from "@/components/ui/form/form-datetime-picker";
import { Skeleton } from "@/components/ui/skeleton";

import { eventsService } from "@/services/events.service";
import { logger } from "@/utils/logger";
import { requiresLocation, requiresVirtualAccess } from "@/constants/modalities";
import { createEventSchema, type CreateEventFormValues } from "@/hooks/useCreateEvent";
import type { Event, EventType, EventCategory, EventModality } from "@/types/event";

import "./EditEventAdminView.css";

interface EditEventAdminViewProps {
  eventId: string;
  onNavigate: (path: string) => void;
}

const MAX_SUMMARY_LENGTH = 150;

export const EditEventAdminView: React.FC<EditEventAdminViewProps> = ({
  eventId,
  onNavigate,
}) => {
  const { t } = useTranslation();

  const [event, setEvent] = useState<Event | null>(null);
  const [types, setTypes] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [modalities, setModalities] = useState<EventModality[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageTimestamp, setImageTimestamp] = useState<number>(Date.now());

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showExistingImage, setShowExistingImage] = useState(false);

  // Summary character count
  const [summaryLength, setSummaryLength] = useState(0);

  // Slug copy state
  const [slugCopied, setSlugCopied] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema(t)),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      typeId: "",
      categoryId: "",
      modalityId: "",
      startAt: "",
      endAt: "",
      coverImage: null,
      locationName: "",
      locationAddress: "",
      locationCity: "",
      locationReference: "",
      locationMapLink: "",
      virtualPlatform: "",
      virtualMeetingUrl: "",
      virtualMeetingPassword: "",
      virtualInstructions: "",
    },
  });

  const selectedModalityId = watch("modalityId");
  const summaryValue = watch("summary") || "";

  const modalityId = selectedModalityId ? parseInt(selectedModalityId) : 0;
  const showLocation = requiresLocation(modalityId);
  const showVirtual = requiresVirtualAccess(modalityId);

  // Cargar datos del evento y metadatos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eventData, typesData, categoriesData, modalitiesData] = await Promise.all([
          eventsService.findByIdFull(eventId),
          eventsService.getTypes(),
          eventsService.getCategories(),
          eventsService.getModalities(),
        ]);

        setEvent(eventData);
        setTypes(typesData);
        setCategories(categoriesData);
        setModalities(modalitiesData);
        setImageTimestamp(Date.now());

        // Poblar el formulario con los datos del evento
        const formData = {
          title: eventData.title || "",
          summary: eventData.summary || "",
          description: eventData.description || "",
          typeId: eventData.type?.id?.toString() || "",
          categoryId: eventData.category?.id?.toString() || "",
          modalityId: eventData.modality?.id?.toString() || "",
          startAt: eventData.startAt || "",
          endAt: eventData.endAt || "",
          coverImage: null,
          locationName: eventData.location?.name || "",
          locationAddress: eventData.location?.address || "",
          locationCity: eventData.location?.city || "",
          locationReference: eventData.location?.reference || "",
          locationMapLink: eventData.location?.mapLink || "",
          virtualPlatform: eventData.virtualAccess?.platform || "",
          virtualMeetingUrl: eventData.virtualAccess?.meetingUrl || "",
          virtualMeetingPassword: eventData.virtualAccess?.meetingPassword || "",
          virtualInstructions: eventData.virtualAccess?.instructions || "",
        };

        reset(formData);
        setSummaryLength((eventData.summary || "").length);

        if (eventData.imageUrl) {
          setShowExistingImage(true);
        }
      } catch (err) {
        logger.error("Error loading event details:", err);
        setError(t("errors.network"));
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId, t, reset]);

  // Update image preview when file changes
  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setImagePreview(null);
  }, [imageFile]);

  const handleBack = () => {
    onNavigate(`/eventos/${eventId}`);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error(t("create_event.image.invalid_type", "Tipo de archivo no válido"));
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error(t("create_event.image.too_large", "La imagen no debe superar 5MB"));
        return;
      }
      setImageFile(selectedFile);
      setValue("coverImage", selectedFile);
      setShowExistingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue("coverImage", null);
  };

  const handleRemoveExistingImage = () => {
    setShowExistingImage(false);
  };

  const handleCopySlug = async () => {
    if (event?.slug) {
      await navigator.clipboard.writeText(`/${event.slug}`);
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 2000);
    }
  };

  const onSubmit = async (data: CreateEventFormValues) => {
    setSubmitting(true);

    try {
      const modalityIdNum = parseInt(data.modalityId);
      const isPresential = requiresLocation(modalityIdNum);
      const isVirtual = requiresVirtualAccess(modalityIdNum);

      const payload = {
        title: data.title,
        summary: data.summary || undefined,
        description: data.description,
        typeId: parseInt(data.typeId),
        categoryId: parseInt(data.categoryId),
        modalityId: modalityIdNum,
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
        location: isPresential && data.locationAddress && data.locationCity ? {
          name: data.locationName || undefined,
          address: data.locationAddress,
          city: data.locationCity,
          reference: data.locationReference || undefined,
          mapLink: data.locationMapLink || undefined,
        } : undefined,
        virtualAccess: isVirtual && data.virtualMeetingUrl ? {
          platform: data.virtualPlatform || "Zoom",
          meetingUrl: data.virtualMeetingUrl,
          meetingPassword: data.virtualMeetingPassword || undefined,
          instructions: data.virtualInstructions || undefined,
        } : undefined,
      };

      // Si hay imagen nueva, usar FormData
      if (data.coverImage) {
        const formData = new FormData();
        formData.append('coverImage', data.coverImage);
        formData.append('data', JSON.stringify(payload));
        await eventsService.updateWithImage(eventId, formData);
      } else {
        await eventsService.update(eventId, payload);
      }

      toast.success(t("edit_event.success_title", "Evento actualizado"), {
        description: t("edit_event.success_description", "Los cambios han sido guardados correctamente."),
      });

      // Navegar de vuelta a gestión del evento
      setTimeout(() => {
        handleBack();
      }, 1000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        logger.error("Backend validation error:", JSON.stringify(err.response.data, null, 2));
        toast.error(t("edit_event.error_title", "Error al actualizar"), {
          description: err.response.data.message || t("edit_event.error_description", "Por favor, revisa los datos e intenta nuevamente."),
        });
      } else {
        logger.error("Error updating event:", err);
        toast.error(t("edit_event.error_title", "Error al actualizar"), {
          description: t("edit_event.error_unknown", "Ocurrió un error inesperado. Intenta nuevamente."),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getSummaryCounterClass = () => {
    if (summaryLength > MAX_SUMMARY_LENGTH) return "edit-event-admin__counter--error";
    if (summaryLength > MAX_SUMMARY_LENGTH - 10) return "edit-event-admin__counter--warning";
    return "";
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer maxWidth="lg" padding="md">
        <EditEventSkeleton />
      </PageContainer>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <PageContainer maxWidth="lg" padding="md">
        <div className="edit-event-admin__error">
          <h2>{error || t("errors.unknown")}</h2>
          <Button variant="secondary" onClick={handleBack}>
            <ArrowLeft size={18} />
            {t("form.back", "Volver")}
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
          { label: event.title, href: `/eventos/${eventId}` },
          { label: t("edit_event.breadcrumb.title", "Editar") }
        ]}
      />

      {/* Back button */}
      <button
        type="button"
        className="edit-event-admin__back"
        onClick={handleBack}
      >
        <ArrowLeft size={16} />
        {t("edit_event.back", "Volver al detalle")}
      </button>

      {/* Header */}
      <div className="edit-event-admin__header">
        <div>
          <h1 className="edit-event-admin__title">
            {t("edit_event.title", "Editar Evento")}
          </h1>
          <p className="edit-event-admin__subtitle">
            {t("edit_event.subtitle", "Modifica la información del evento.")}
          </p>
        </div>
        <div className="edit-event-admin__header-actions">
          <Button variant="secondary" onClick={handleBack} disabled={submitting}>
            <X size={16} />
            {t("form.cancel", "Cancelar")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={submitting}
            isLoading={submitting}
            loadingText={t("form.loading", "Guardando...")}
          >
            <FloppyDisk size={16} />
            {t("form.save_changes", "Guardar Cambios")}
          </Button>
        </div>
      </div>

      {/* Form Layout */}
      <form onSubmit={handleSubmit(onSubmit)} className="edit-event-admin__layout">
        {/* Left Column: Basic Info + Image */}
        <div className="edit-event-admin__main">
          {/* Información Básica */}
          <div className="edit-event-admin__card">
            <h2 className="edit-event-admin__card-title">
              {t("create_event.basic.title", "Información Básica")}
            </h2>

            {/* Título y Slug */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("create_event.basic.event_title", "Título")}
                    placeholder={t("create_event.basic.event_title_placeholder", "Nombre del evento")}
                    error={errors.title?.message}
                    inputSize="md"
                  />
                )}
              />

              {/* Slug (solo lectura) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <label style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-grey-700)" }}>
                  {t("create_event.basic.slug", "Slug (URL)")}
                </label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  height: "var(--button-height-md)",
                  padding: "0 var(--space-3)",
                  backgroundColor: "var(--color-grey-050)",
                  border: "1px solid var(--color-grey-200)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-grey-600)",
                }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    /{event?.slug || "..."}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySlug}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "var(--space-1)",
                      marginLeft: "var(--space-2)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: slugCopied ? "var(--color-green-600)" : "var(--color-grey-500)",
                      transition: "color 150ms ease",
                    }}
                    title={t("form.copy", "Copiar")}
                  >
                    {slugCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div>
              <Controller
                control={control}
                name="summary"
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("create_event.basic.summary", "Resumen Corto")}
                    placeholder={t("create_event.basic.summary_placeholder", "Descripción breve")}
                    error={errors.summary?.message}
                    inputSize="md"
                    onChange={(e) => {
                      field.onChange(e);
                      setSummaryLength(e.target.value.length);
                    }}
                  />
                )}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-1)" }}>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-grey-500)" }}>
                  {t("create_event.basic.summary_hint", "Se muestra en las tarjetas del listado")}
                </span>
                <span className={`edit-event-admin__counter ${getSummaryCounterClass()}`}>
                  {summaryLength}/{MAX_SUMMARY_LENGTH}
                </span>
              </div>
            </div>

            {/* Descripción */}
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <FormTextarea
                  {...field}
                  label={t("create_event.basic.description", "Descripción Detallada")}
                  placeholder={t("create_event.basic.description_placeholder", "Información completa del evento...")}
                  error={errors.description?.message}
                  textareaSize="lg"
                  required
                />
              )}
            />

            {/* Tipo y Categoría */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <Controller
                control={control}
                name="typeId"
                render={({ field }) => (
                  <FormSelect
                    label={t("create_event.basic.type", "Tipo de Evento")}
                    value={field.value}
                    onChange={field.onChange}
                    options={types.map(type => ({ value: type.id.toString(), label: type.name }))}
                    placeholder={t("form.select", "Seleccionar...")}
                    error={errors.typeId?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <FormSelect
                    label={t("create_event.basic.category", "Categoría / Capítulo")}
                    value={field.value}
                    onChange={field.onChange}
                    options={categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))}
                    placeholder={t("form.select", "Seleccionar...")}
                    error={errors.categoryId?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Imagen del Evento */}
          <div className="edit-event-admin__card">
            <h2 className="edit-event-admin__card-title">
              <ImageIcon size={20} />
              {t("create_event.image.title", "Imagen del Evento")}
            </h2>

            <input
              type="file"
              id="cover-image-input"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />

            {showExistingImage && event.imageUrl && !imageFile ? (
              <div className="edit-event-admin__image-preview">
                <img
                  src={`${event.imageUrl}?t=${imageTimestamp}`}
                  alt={t("create_event.image.current", "Imagen actual")}
                  className="edit-event-admin__image"
                />
                <div className="edit-event-admin__image-overlay" />
                <div className="edit-event-admin__image-info">
                  {t("create_event.image.current", "Imagen actual")}
                </div>
                <button
                  type="button"
                  className="edit-event-admin__image-remove"
                  onClick={handleRemoveExistingImage}
                >
                  <X size={14} />
                </button>
              </div>
            ) : imagePreview && imageFile ? (
              <div className="edit-event-admin__image-preview">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="edit-event-admin__image"
                />
                <div className="edit-event-admin__image-overlay" />
                <div className="edit-event-admin__image-info">
                  {imageFile.name} • {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <button
                  type="button"
                  className="edit-event-admin__image-remove"
                  onClick={handleRemoveImage}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className="edit-event-admin__image-upload"
                onClick={() => document.getElementById("cover-image-input")?.click()}
              >
                <ImageIcon size={48} weight="duotone" />
                <p className="edit-event-admin__image-upload-text">
                  {t("create_event.image.drag_text", "Arrastra una imagen o")}{" "}
                  <strong>{t("create_event.image.click_text", "haz clic para subir")}</strong>
                </p>
                <p className="edit-event-admin__image-upload-hint">
                  {t("create_event.image.hint", "PNG, JPG o WebP • Máximo 5MB • Recomendado: 1200x630px")}
                </p>
              </div>
            )}

            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-grey-500)", marginTop: "var(--space-3)" }}>
              {t("create_event.image.banner_hint", "Esta imagen se mostrará como banner del evento.")}
            </p>
          </div>
        </div>

        {/* Right Column: Configuration + Location + Virtual */}
        <div className="edit-event-admin__sidebar">
          {/* Configuración */}
          <div className="edit-event-admin__card">
            <h2 className="edit-event-admin__card-title">
              <CalendarBlank size={20} />
              {t("create_event.configuration", "Configuración")}
            </h2>

            {/* Modalidad */}
            <Controller
              control={control}
              name="modalityId"
              render={({ field }) => (
                <FormSelect
                  label={t("create_event.modality", "Modalidad")}
                  value={field.value}
                  onChange={field.onChange}
                  options={modalities.map(mod => ({ value: mod.id.toString(), label: mod.name }))}
                  placeholder={t("form.select", "Seleccionar...")}
                  error={errors.modalityId?.message}
                  required
                />
              )}
            />

            {/* Fecha y Hora de Inicio */}
            <Controller
              control={control}
              name="startAt"
              render={({ field }) => (
                <FormDateTimePicker
                  label={t("create_event.start", "Inicio")}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.startAt?.message}
                  required
                />
              )}
            />

            {/* Fecha y Hora de Fin */}
            <Controller
              control={control}
              name="endAt"
              render={({ field }) => (
                <FormDateTimePicker
                  label={t("create_event.end", "Fin")}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.endAt?.message}
                  required
                  minDate={watch("startAt")}
                />
              )}
            />
          </div>

          {/* Ubicación Presencial */}
          {showLocation && (
            <div className="edit-event-admin__card">
              <h2 className="edit-event-admin__card-title">
                <MapPin size={20} />
                {t("create_event.location.title", "Ubicación Presencial")}
              </h2>

              <Controller
                control={control}
                name="locationName"
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("create_event.location.name", "Nombre del Lugar")}
                    placeholder={t("create_event.location.name_placeholder", "Buscar o escribir nombre del lugar...")}
                    error={errors.locationName?.message}
                    inputSize="md"
                  />
                )}
              />

              <Controller
                control={control}
                name="locationAddress"
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("create_event.location.address", "Dirección")}
                    placeholder={t("create_event.location.address_placeholder", "Ej: Av. Pevas Cuadra 4")}
                    error={errors.locationAddress?.message}
                    inputSize="md"
                  />
                )}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <Controller
                  control={control}
                  name="locationCity"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label={t("create_event.location.city", "Ciudad")}
                      placeholder={t("create_event.location.city_placeholder", "Lima")}
                      error={errors.locationCity?.message}
                      inputSize="md"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="locationReference"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label={t("create_event.location.reference", "Referencia")}
                      placeholder={t("create_event.location.reference_placeholder", "Frente al Parque...")}
                      error={errors.locationReference?.message}
                      inputSize="md"
                    />
                  )}
                />
              </div>

              <Controller
                control={control}
                name="locationMapLink"
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("create_event.location.map_link", "Link de Mapa (Google Maps)")}
                    placeholder="https://maps.google.com/..."
                    error={errors.locationMapLink?.message}
                    hint={t("create_event.location.map_hint", "Copia el enlace desde Google Maps para facilitar la ubicación")}
                    inputSize="md"
                  />
                )}
              />
            </div>
          )}

          {/* Accesos Virtuales */}
          {showVirtual && (
            <div className="edit-event-admin__card">
              <h2 className="edit-event-admin__card-title">
                <VideoCamera size={20} />
                {t("create_event.virtual.title", "Accesos Virtuales")}
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <Controller
                  control={control}
                  name="virtualPlatform"
                  render={({ field }) => (
                    <FormSelect
                      label={t("create_event.virtual.platform", "Plataforma")}
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "Zoom", label: t("create_event.virtual.platforms.zoom", "Zoom") },
                        { value: "Google Meet", label: t("create_event.virtual.platforms.google_meet", "Google Meet") },
                        { value: "Microsoft Teams", label: t("create_event.virtual.platforms.teams", "Microsoft Teams") },
                        { value: "Other", label: t("create_event.virtual.platforms.other", "Otro") },
                      ]}
                      placeholder={t("form.select", "Seleccionar...")}
                      error={errors.virtualPlatform?.message}
                      required
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="virtualMeetingPassword"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label={t("create_event.virtual.password", "Contraseña")}
                      placeholder={t("create_event.virtual.password_placeholder", "Ej: CIP2024")}
                      error={errors.virtualMeetingPassword?.message}
                      inputSize="md"
                    />
                  )}
                />
              </div>

              <Controller
                control={control}
                name="virtualMeetingUrl"
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("create_event.virtual.meeting_url", "Link de Reunión")}
                    placeholder={t("create_event.virtual.meeting_url_placeholder", "https://zoom.us/j/...")}
                    error={errors.virtualMeetingUrl?.message}
                    hint={t("create_event.virtual.meeting_url_hint", "El enlace se enviará a los inscritos antes del evento")}
                    inputSize="md"
                  />
                )}
              />

              <Controller
                control={control}
                name="virtualInstructions"
                render={({ field }) => (
                  <FormTextarea
                    {...field}
                    label={t("create_event.virtual.instructions", "Instrucciones Adicionales")}
                    placeholder={t("create_event.virtual.instructions_placeholder", "Instrucciones para unirse a la reunión...")}
                    error={errors.virtualInstructions?.message}
                    textareaSize="sm"
                  />
                )}
              />
            </div>
          )}
        </div>
      </form>
    </PageContainer>
  );
};

// Skeleton Component
const EditEventSkeleton: React.FC = () => {
  return (
    <div>
      <Skeleton width={150} height={32} style={{ marginBottom: "var(--space-4)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--space-6)", marginTop: "var(--space-6)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <Skeleton width="100%" height={400} style={{ borderRadius: "var(--radius-lg)" }} />
          <Skeleton width="100%" height={200} style={{ borderRadius: "var(--radius-lg)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Skeleton width="100%" height={300} style={{ borderRadius: "var(--radius-lg)" }} />
          <Skeleton width="100%" height={200} style={{ borderRadius: "var(--radius-lg)" }} />
        </div>
      </div>
    </div>
  );
};

export default EditEventAdminView;
