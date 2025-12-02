import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import axios from "axios";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/rui/Drawer";
import { Input } from "@/components/ui/rui-input";
import { Button } from "@/components/ui/rui-button";
import {
  FormTextarea,
  FormGroup,
  FormSelect,
} from "@/components/ui/rui/form";
import { DatePicker } from "@/components/ui/rui/DatePicker";
import { TimePicker } from "@/components/ui/rui/TimePicker";
import { ModalitySelector } from "@/components/ui/rui/ModalitySelector";

import { eventsService } from "@/services/events.service";
import { logger } from "@/utils/logger";
import type { EventType, EventCategory, EventModality } from "@/types/event";

interface CreateEventDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (eventId: string) => void;
}

// Schema simplificado para creación rápida
const createQuickEventSchema = (t: (key: string, fallback?: string) => string) =>
  z.object({
    title: z.string().min(1, t("form.required")),
    description: z.string().optional(),
    typeId: z.string().min(1, t("form.required")),
    categoryId: z.string().optional(),
    modalityId: z.string().min(1, t("form.required")),
    startDate: z.string().min(1, t("form.required")),
    startTime: z.string().min(1, t("form.required")),
    endDate: z.string().min(1, t("form.required")),
    endTime: z.string().min(1, t("form.required")),
  });

type QuickEventFormValues = z.infer<ReturnType<typeof createQuickEventSchema>>;

export const CreateEventDrawer: React.FC<CreateEventDrawerProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [types, setTypes] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [modalities, setModalities] = useState<EventModality[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<QuickEventFormValues>({
    resolver: zodResolver(createQuickEventSchema(t)),
    defaultValues: {
      title: "",
      description: "",
      typeId: "",
      categoryId: "",
      modalityId: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Watch startDate para auto-rellenar endDate
  const startDate = watch("startDate");
  useEffect(() => {
    if (startDate && !form.getValues("endDate")) {
      setValue("endDate", startDate);
    }
  }, [startDate, setValue, form]);

  // Cargar metadata cuando se abre el drawer
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [typesData, categoriesData, modalitiesData] = await Promise.all([
          eventsService.getTypes(),
          eventsService.getCategories(),
          eventsService.getModalities(),
        ]);
        setTypes(typesData);
        setCategories(categoriesData);
        setModalities(modalitiesData);
      } catch (error) {
        logger.error("Error loading metadata:", error);
        toast.error(t("common.error", "Error"), {
          description: t("create_event.toast.metadata_error", "Error al cargar los datos del formulario"),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, t]);

  // Reset form cuando se cierra
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const createEvent = async (data: QuickEventFormValues) => {
    setSubmitting(true);
    try {
      // Construir fechas completas
      const startAt = new Date(`${data.startDate}T${data.startTime}`);
      const endAt = new Date(`${data.endDate}T${data.endTime}`);

      // Validar que la fecha/hora de fin sea después de inicio
      if (endAt <= startAt) {
        toast.error(t("form.error", "Error"), {
          description: t("form.date_end_after_start", "La fecha/hora de fin debe ser posterior a la de inicio"),
        });
        setSubmitting(false);
        return;
      }

      const payload = {
        title: data.title,
        description: data.description || data.title,
        typeId: parseInt(data.typeId),
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        modalityId: parseInt(data.modalityId),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        status: "DRAFT" as const,
      };

      const response = await eventsService.createEvent(payload);
      const eventId = response.id;

      toast.success(t("create_event.toast.created", "Evento creado"), {
        description: t("create_event.toast.created_description", "Ahora puedes completar los detalles del evento."),
      });

      onOpenChange(false);

      if (onSuccess && eventId) {
        onSuccess(eventId);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error("Backend validation error:", JSON.stringify(error.response.data, null, 2));
        toast.error(t("create_event.toast.error", "Error al crear el evento"), {
          description: error.response.data.message || t("create_event.toast.error_description", "Revisa los datos e intenta nuevamente."),
        });
      } else {
        logger.error("Error creating event:", error);
        toast.error(t("create_event.toast.error", "Error al crear el evento"), {
          description: t("create_event.toast.error_unexpected", "Ocurrió un error inesperado."),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = handleSubmit(createEvent);

  // Options para selects
  const typeOptions = types.map((type) => ({
    value: type.id.toString(),
    label: type.name,
  }));

  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--space-3)",
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent width="lg">
        <DrawerHeader>
          <DrawerTitle>
            {t("dashboard.events_view.create_title", "Crear Nuevo Evento")}
          </DrawerTitle>
          <DrawerDescription>
            {t("create_event.drawer.subtitle", "Completa la información del evento")}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "var(--space-8)",
                color: "var(--color-text-muted)",
              }}
            >
              {t("common.loading", "Cargando...")}
            </div>
          ) : (
            <form id="create-event-form">
              {/* Nombre del evento */}
              <FormGroup>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label={t("create_event.drawer.name", "Nombre del evento")}
                      placeholder={t("create_event.drawer.name_placeholder", "Ej: Conferencia de Tecnología 2025")}
                      error={errors.title?.message}
                      required
                    />
                  )}
                />
              </FormGroup>

              {/* Descripción */}
              <FormGroup>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormTextarea
                      {...field}
                      label={t("create_event.basic.description", "Descripción")}
                      placeholder={t("create_event.drawer.description_placeholder", "Describe brevemente el evento...")}
                      rows={2}
                    />
                  )}
                />
              </FormGroup>

              {/* Tipo y Categoría en una fila */}
              <FormGroup>
                <div style={rowStyle}>
                  <Controller
                    name="typeId"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        label={t("create_event.drawer.type", "Tipo")}
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
                        label={t("create_event.drawer.category", "Categoría")}
                        value={field.value}
                        onChange={field.onChange}
                        options={categoryOptions}
                        placeholder={t("form.select", "Seleccionar...")}
                      />
                    )}
                  />
                </div>
              </FormGroup>

              {/* Modalidad - Card Selector */}
              <FormGroup>
                <Controller
                  name="modalityId"
                  control={control}
                  render={({ field }) => (
                    <ModalitySelector
                      modalities={modalities}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.modalityId?.message}
                      required
                    />
                  )}
                />
              </FormGroup>

              {/* Fecha y hora de inicio */}
              <FormGroup>
                <div style={rowStyle}>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label={t("create_event.drawer.start_date", "Fecha de inicio")}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.startDate?.message}
                        required
                      />
                    )}
                  />
                  <Controller
                    name="startTime"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        label={t("create_event.drawer.start_time", "Hora")}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.startTime?.message}
                        required
                      />
                    )}
                  />
                </div>
              </FormGroup>

              {/* Fecha y hora de fin */}
              <FormGroup marginBottom="0">
                <div style={rowStyle}>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label={t("create_event.drawer.end_date", "Fecha de término")}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.endDate?.message}
                        required
                      />
                    )}
                  />
                  <Controller
                    name="endTime"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        label={t("create_event.drawer.end_time", "Hora")}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.endTime?.message}
                        required
                      />
                    )}
                  />
                </div>
              </FormGroup>
            </form>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            variant="ghost"
            size="md"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("form.cancel", "Cancelar")}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSubmit}
            disabled={submitting || loading}
            isLoading={submitting}
          >
            {t("create_event.drawer.create_btn", "Crear evento")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
