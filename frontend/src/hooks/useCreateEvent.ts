import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { eventsService } from "@/services/events.service";
import { logger } from "@/utils/logger";
import { MODALITY_IDS, requiresLocation, requiresVirtualAccess } from "@/constants/modalities";
import { getCurrentLocale, routes } from "@/lib/routes";
import type { EventType, EventCategory, EventModality } from "@/types/event";

// Schema definition
import { useTranslation } from "react-i18next";

// ... existing imports ...

// Schema definition wrapper
export const createEventSchema = (t: any) => z.object({
  title: z.string().min(1, t("form.required")),
  summary: z.string().max(150, t("form.max_length").replace("{{count}}", "150")).optional(),
  description: z.string().min(1, t("form.required")),
  typeId: z.string().min(1, t("form.required")),
  categoryId: z.string().min(1, t("form.required")),
  modalityId: z.string().min(1, t("form.required")),
  startAt: z.string().min(1, t("form.required")),
  endAt: z.string().min(1, t("form.required")),
  // Image field
  coverImage: z.instanceof(File).nullable().optional(),
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
}).refine((data) => {
  const modalityId = parseInt(data.modalityId);

  // Si requiere ubicación física, validar campos obligatorios
  if (requiresLocation(modalityId)) {
    if (!data.locationName || data.locationName.trim() === "") {
      return false;
    }
    if (!data.locationAddress || data.locationAddress.trim() === "") {
      return false;
    }
    if (!data.locationCity || data.locationCity.trim() === "") {
      return false;
    }
  }

  return true;
}, {
  message: t("form.required"),
  path: ["locationName"],
}).refine((data) => {
  const modalityId = parseInt(data.modalityId);

  // Si requiere acceso virtual, validar campos obligatorios
  if (requiresVirtualAccess(modalityId)) {
    if (!data.virtualPlatform || data.virtualPlatform.trim() === "") {
      return false;
    }
    if (!data.virtualMeetingUrl || data.virtualMeetingUrl.trim() === "") {
      return false;
    }
  }

  return true;
}, {
  message: t("form.required"),
  path: ["virtualMeetingUrl"],
}).refine((data) => {
  if (!data.startAt) return true;
  const start = new Date(data.startAt);
  // Allow 1 minute grace period for "now"
  const now = new Date();
  now.setMinutes(now.getMinutes() - 1);
  return start > now;
}, {
  message: t("form.date_future"),
  path: ["startAt"],
}).refine((data) => {
  if (!data.startAt || !data.endAt) return true;
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  return end > start;
}, {
  message: t("form.date_end_after_start"),
  path: ["endAt"],
});

export type CreateEventFormValues = z.infer<ReturnType<typeof createEventSchema>>;

export const useCreateEvent = () => {
  const { t } = useTranslation();
  const [types, setTypes] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [modalities, setModalities] = useState<EventModality[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateEventFormValues>({
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

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const createEvent = async (data: CreateEventFormValues, status: "DRAFT" | "PUBLISHED") => {
    setSubmitting(true);
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
        modalityId: parseInt(data.modalityId),
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
        status, // DRAFT o PUBLISHED
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

      // Si hay imagen, usar FormData
      if (data.coverImage) {
        const formData = new FormData();
        formData.append('coverImage', data.coverImage);
        formData.append('data', JSON.stringify(payload));
        await eventsService.createEventWithImage(formData);
      } else {
        await eventsService.createEvent(payload);
      }

      const isDraft = status === "DRAFT";
      toast.success(
        isDraft ? t("create_event.toast.draft_success", "Borrador guardado") : t("create_event.toast.publish_success", "Evento publicado"),
        {
          description: isDraft
            ? t("create_event.toast.draft_description", "El evento se guardó como borrador. Puedes editarlo y publicarlo después.")
            : t("create_event.toast.publish_description", "El evento ya está visible en el calendario."),
        }
      );

      const locale = getCurrentLocale();
      setTimeout(() => {
        window.location.href = routes[locale].events;
      }, 1500);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error("Backend validation error:", JSON.stringify(error.response.data, null, 2));
        toast.error(t("create_event.toast.error", "Error al crear el evento"), {
          description: error.response.data.message || t("create_event.toast.error_description", "Por favor, revisa los datos e intenta nuevamente."),
        });
      } else {
        logger.error("Error creating event:", error);
        toast.error(t("create_event.toast.error", "Error al crear el evento"), {
          description: t("create_event.toast.error_unexpected", "Ocurrió un error inesperado. Intenta nuevamente."),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (data: CreateEventFormValues) => {
    await createEvent(data, "PUBLISHED");
  };

  const onSaveDraft = async (data: CreateEventFormValues) => {
    await createEvent(data, "DRAFT");
  };

  return {
    form,
    types,
    categories,
    modalities,
    loading,
    submitting,
    onSubmit,
    onSaveDraft,
  };
};
