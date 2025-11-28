import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { eventsService } from "@/services/events.service";
import { logger } from "@/utils/logger";
import { requiresLocation, requiresVirtualAccess } from "@/constants/modalities";
import type { Event, EventType, EventCategory, EventModality } from "@/types/event";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createEditEventSchema = (t: any) =>
  z.object({
    title: z.string().min(1, t("form.required")),
    summary: z.string().max(150, t("form.max_length").replace("{{count}}", "150")).optional(),
    description: z.string().min(1, t("form.required")),
    typeId: z.string().min(1, t("form.required")),
    categoryId: z.string().min(1, t("form.required")),
    modalityId: z.string().min(1, t("form.required")),
    startAt: z.string().min(1, t("form.required")),
    endAt: z.string().min(1, t("form.required")),
    // Location fields
    locationName: z.string().optional(),
    locationAddress: z.string().optional(),
    locationCity: z.string().optional(),
    locationReference: z.string().optional(),
    locationMapLink: z.string().url(t("form.invalid_url") || "URL inválida").optional().or(z.literal("")),
    // Virtual fields
    virtualPlatform: z.string().optional(),
    virtualMeetingUrl: z.string().url(t("form.invalid_url") || "URL inválida").optional().or(z.literal("")),
    virtualMeetingPassword: z.string().optional(),
    virtualInstructions: z.string().optional(),
  });

export type EditEventFormValues = z.infer<ReturnType<typeof createEditEventSchema>>;

export const useEventDetails = (eventId: string) => {
  const { t } = useTranslation();
  const [event, setEvent] = useState<Event | null>(null);
  const [types, setTypes] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [modalities, setModalities] = useState<EventModality[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(createEditEventSchema(t)),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      typeId: "",
      categoryId: "",
      modalityId: "",
      startAt: "",
      endAt: "",
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

  // Función para formatear fecha para input datetime-local
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

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

        // Poblar el formulario con los datos del evento
        form.reset({
          title: eventData.title || "",
          summary: eventData.summary || "",
          description: eventData.description || "",
          typeId: eventData.type?.id?.toString() || "",
          categoryId: eventData.category?.id?.toString() || "",
          modalityId: eventData.modality?.id?.toString() || "",
          startAt: formatDateForInput(eventData.startAt),
          endAt: formatDateForInput(eventData.endAt),
          locationName: eventData.location?.name || "",
          locationAddress: eventData.location?.address || "",
          locationCity: eventData.location?.city || "",
          locationReference: eventData.location?.reference || "",
          locationMapLink: eventData.location?.mapLink || "",
          virtualPlatform: eventData.virtualAccess?.platform || "",
          virtualMeetingUrl: eventData.virtualAccess?.meetingUrl || "",
          virtualMeetingPassword: eventData.virtualAccess?.meetingPassword || "",
          virtualInstructions: eventData.virtualAccess?.instructions || "",
        });
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
  }, [eventId, t]);

  const onSubmit = async (data: EditEventFormValues) => {
    setSaving(true);
    try {
      const modalityId = parseInt(data.modalityId);
      const isPresential = requiresLocation(modalityId);
      const isVirtual = requiresVirtualAccess(modalityId);

      const payload = {
        title: data.title,
        summary: data.summary || undefined,
        description: data.description,
        typeId: parseInt(data.typeId),
        categoryId: parseInt(data.categoryId),
        modalityId: modalityId,
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

      const updatedEvent = await eventsService.update(eventId, payload);
      setEvent(updatedEvent);
      return true;
    } catch (err) {
      logger.error("Error updating event:", err);
      setError(t("errors.unknown"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publishEvent = async () => {
    setSaving(true);
    try {
      const updatedEvent = await eventsService.publish(eventId);
      setEvent(updatedEvent);
      return true;
    } catch (err) {
      logger.error("Error publishing event:", err);
      setError(t("errors.unknown"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const refetch = async () => {
    setLoading(true);
    try {
      const eventData = await eventsService.findById(eventId);
      setEvent(eventData);
    } catch (err) {
      logger.error("Error refetching event:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    event,
    form,
    types,
    categories,
    modalities,
    loading,
    saving,
    error,
    onSubmit,
    publishEvent,
    refetch,
  };
};
