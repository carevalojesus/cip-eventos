/**
 * CreateEventDrawer Component
 *
 * Drawer simplificado para crear un nuevo evento.
 * Solo campos básicos, el resto se configura después.
 */
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isValid } from "date-fns";
import axios from "axios";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FormSelect } from "@/components/ui/form/index";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { FormDateTimePicker } from "@/components/ui/form/form-datetime-picker";

import { eventsService } from "@/services/events.service";
import { logger } from "@/utils/logger";

interface CreateEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Schema simplificado solo para el drawer
const createEventDrawerSchema = z.object({
  title: z.string().min(1, "Campo requerido").min(3, "Mínimo 3 caracteres"),
  summary: z.string().max(150, "Máximo 150 caracteres").optional().or(z.literal("")),
  description: z.string().min(1, "Campo requerido").min(10, "Mínimo 10 caracteres"),
  typeId: z.string().min(1, "Campo requerido"),
  categoryId: z.string().min(1, "Campo requerido"),
  modalityId: z.string().min(1, "Campo requerido"),
  startAt: z.string().min(1, "Campo requerido"),
  endAt: z.string().min(1, "Campo requerido"),
}).refine((data) => {
  if (!data.startAt || !data.endAt) return true;
  return new Date(data.endAt) > new Date(data.startAt);
}, {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["endAt"],
});

type FormValues = z.infer<typeof createEventDrawerSchema>;

// Generar opciones de hora (cada 30 minutos)
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      const time = `${hour}:${minute}`;
      options.push({ value: time, label: time });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export const CreateEventDrawer: React.FC<CreateEventDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [isSameDay, setIsSameDay] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Queries para cargar opciones
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

  const form = useForm<FormValues>({
    resolver: zodResolver(createEventDrawerSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      typeId: "",
      categoryId: "",
      modalityId: "",
      startAt: "",
      endAt: "",
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const startAt = watch("startAt");
  const endAt = watch("endAt");

  // Cuando cambia startAt y es mismo día, actualizar endAt con la misma fecha
  useEffect(() => {
    if (isSameDay && startAt) {
      const startDate = new Date(startAt);
      if (isValid(startDate)) {
        const dateStr = format(startDate, "yyyy-MM-dd");
        let endTime = "18:00";
        if (endAt) {
          const endDate = new Date(endAt);
          if (isValid(endDate)) {
            endTime = format(endDate, "HH:mm");
          }
        }
        setValue("endAt", `${dateStr}T${endTime}`);
      }
    }
  }, [isSameDay, startAt, setValue]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        title: data.title,
        summary: data.summary || undefined,
        description: data.description,
        typeId: parseInt(data.typeId),
        categoryId: parseInt(data.categoryId),
        modalityId: parseInt(data.modalityId),
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
      };

      await eventsService.createEvent(payload);

      toast.success(t("events.toast.create_success", "Evento creado"), {
        description: t("events.toast.create_description", "El evento ha sido creado como borrador."),
      });

      reset();
      setIsSameDay(true);
      onClose();
      onSuccess?.();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error("Backend error:", JSON.stringify(error.response.data, null, 2));
        const message = error.response.data.message;

        if (message?.includes("already exists") || message?.includes("ya existe")) {
          toast.error(t("events.toast.slug_exists", "El slug ya está en uso"), {
            description: t("events.toast.slug_exists_description", "Por favor, utiliza otro título."),
          });
        } else {
          toast.error(t("events.toast.create_error", "Error al crear evento"), {
            description: message || t("events.toast.error_description", "Revisa los datos e intenta nuevamente."),
          });
        }
      } else {
        logger.error("Error creating event:", error);
        toast.error(t("events.toast.create_error", "Error al crear evento"), {
          description: t("events.toast.error_unexpected", "Ocurrió un error inesperado."),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setIsSameDay(true);
    onClose();
  };

  // Obtener hora de inicio para filtrar opciones
  const getStartTime = () => {
    if (startAt) {
      const date = new Date(startAt);
      if (isValid(date)) {
        return format(date, "HH:mm");
      }
    }
    return "00:00";
  };

  // Filtrar opciones de hora de fin (solo después de la hora de inicio)
  const filteredEndTimeOptions = timeOptions.filter((option) => {
    const startTime = getStartTime();
    return option.value > startTime;
  });

  // Obtener hora actual de endAt
  const getEndTime = () => {
    if (endAt) {
      const date = new Date(endAt);
      if (isValid(date)) {
        return format(date, "HH:mm");
      }
    }
    return filteredEndTimeOptions[0]?.value || "18:00";
  };

  // Actualizar solo la hora de endAt
  const handleEndTimeChange = (time: string) => {
    if (startAt) {
      const startDate = new Date(startAt);
      if (isValid(startDate)) {
        const dateStr = format(startDate, "yyyy-MM-dd");
        setValue("endAt", `${dateStr}T${time}`);
      }
    }
  };

  // Options para selects
  const typeOptions = types.map((type) => ({
    value: type.id.toString(),
    label: type.name,
  }));

  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  const modalityOptions = modalities.map((mod) => ({
    value: mod.id.toString(),
    label: mod.name,
  }));

  // Styles
  const sectionStyle: React.CSSProperties = {
    marginBottom: "var(--space-5)",
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
    marginBottom: "var(--space-3)",
  };

  const formFieldsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
  };

  const formRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--space-3)",
  };

  const switchRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--space-3)",
    backgroundColor: "var(--color-grey-050)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-grey-200)",
  };

  const switchLabelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent width="md">
        <DrawerHeader>
          <DrawerTitle>{t("events.create.title", "Crear Evento")}</DrawerTitle>
          <DrawerDescription>
            {t(
              "events.create.subtitle",
              "Complete la información básica del evento. Podrás agregar más detalles después."
            )}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <form id="create-event-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Section 1: Información Básica */}
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>
                {t("events.create.basic_info", "Información Básica")}
              </h3>
              <p style={sectionDescStyle}>
                {t("events.create.basic_info_desc", "Título y descripción del evento.")}
              </p>
              <div style={formFieldsStyle}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      label={t("events.form.title", "Título del Evento")}
                      placeholder={t("events.form.title_placeholder", "Ej: Conferencia de Ingeniería Civil 2025")}
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
                      type="text"
                      label={t("events.form.summary", "Resumen (opcional)")}
                      placeholder={t("events.form.summary_placeholder", "Breve descripción del evento")}
                      error={errors.summary?.message}
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormTextarea
                      {...field}
                      label={t("events.form.description", "Descripción")}
                      placeholder={t("events.form.description_placeholder", "Describe el evento, objetivos, público objetivo...")}
                      error={errors.description?.message}
                      required
                      textareaSize="md"
                      maxLength={1000}
                      showCounter
                    />
                  )}
                />
              </div>
            </div>

            {/* Section 2: Clasificación */}
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>
                {t("events.create.classification", "Clasificación")}
              </h3>
              <p style={sectionDescStyle}>
                {t("events.create.classification_desc", "Tipo, categoría y modalidad del evento.")}
              </p>
              <div style={formFieldsStyle}>
                <div style={formRowStyle}>
                  <Controller
                    name="typeId"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        label={t("events.form.type", "Tipo")}
                        value={field.value}
                        onChange={field.onChange}
                        options={typeOptions}
                        placeholder={t("form.select", "Seleccionar...")}
                        error={errors.typeId?.message}
                        required
                      />
                    )}
                  />
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        label={t("events.form.category", "Categoría")}
                        value={field.value}
                        onChange={field.onChange}
                        options={categoryOptions}
                        placeholder={t("form.select", "Seleccionar...")}
                        error={errors.categoryId?.message}
                        required
                      />
                    )}
                  />
                </div>
                <Controller
                  name="modalityId"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      label={t("events.form.modality", "Modalidad")}
                      value={field.value}
                      onChange={field.onChange}
                      options={modalityOptions}
                      placeholder={t("form.select", "Seleccionar...")}
                      error={errors.modalityId?.message}
                      required
                    />
                  )}
                />
              </div>
            </div>

            {/* Section 3: Fechas */}
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>
                {t("events.create.dates", "Fechas y Horarios")}
              </h3>
              <p style={sectionDescStyle}>
                {t("events.create.dates_desc", "Cuándo inicia y termina el evento.")}
              </p>
              <div style={formFieldsStyle}>
                {/* Same day toggle */}
                <div style={switchRowStyle}>
                  <div style={switchLabelStyle}>
                    <span
                      style={{
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {t("events.form.same_day", "Evento de un solo día")}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {t("events.form.same_day_desc", "Inicia y termina el mismo día")}
                    </span>
                  </div>
                  <Switch
                    checked={isSameDay}
                    onChange={setIsSameDay}
                    size="sm"
                  />
                </div>

                {/* Start datetime */}
                <Controller
                  name="startAt"
                  control={control}
                  render={({ field }) => (
                    <FormDateTimePicker
                      label={t("events.form.start_date", "Fecha y Hora de Inicio")}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.startAt?.message}
                      required
                      minDate={new Date().toISOString()}
                    />
                  )}
                />

                {/* End time (same day) or End datetime (multi-day) */}
                {isSameDay ? (
                  <FormSelect
                    label={t("events.form.end_time", "Hora de Fin")}
                    value={getEndTime()}
                    onChange={handleEndTimeChange}
                    options={filteredEndTimeOptions}
                    placeholder={t("form.select", "Seleccionar...")}
                    error={errors.endAt?.message}
                    required
                  />
                ) : (
                  <Controller
                    name="endAt"
                    control={control}
                    render={({ field }) => (
                      <FormDateTimePicker
                        label={t("events.form.end_date", "Fecha y Hora de Fin")}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.endAt?.message}
                        required
                        minDate={startAt || new Date().toISOString()}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          </form>
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            {t("form.cancel", "Cancelar")}
          </Button>
          <Button
            type="submit"
            form="create-event-form"
            variant="primary"
            disabled={submitting}
            isLoading={submitting}
            loadingText={t("form.loading", "Guardando...")}
          >
            {t("events.create.save_draft", "Guardar Borrador")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateEventDrawer;
