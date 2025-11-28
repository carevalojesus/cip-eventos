import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { eventsService } from "@/services/events.service";
import { logger } from "@/utils/logger";
import { MODALITY_IDS, requiresLocation, requiresVirtualAccess } from "@/constants/modalities";
import type { EventType, EventCategory, EventModality } from "@/types/event";

// Schema definition
export const createEventSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  summary: z.string().max(150, "El resumen no puede exceder 150 caracteres").optional(),
  description: z.string().min(1, "La descripción es obligatoria"),
  typeId: z.string().min(1, "El tipo de evento es obligatorio"),
  categoryId: z.string().min(1, "La categoría es obligatoria"),
  modalityId: z.string().min(1, "La modalidad es obligatoria"),
  startAt: z.string().min(1, "La fecha de inicio es obligatoria"),
  endAt: z.string().min(1, "La fecha de fin es obligatoria"),
  // Location fields
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationReference: z.string().optional(),
  locationMapLink: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  // Virtual fields
  virtualPlatform: z.string().optional(),
  virtualMeetingUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
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
  message: "Para eventos presenciales o híbridos, el nombre del lugar, dirección y ciudad son obligatorios",
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
  message: "Para eventos virtuales o híbridos, la plataforma y URL de reunión son obligatorias",
  path: ["virtualMeetingUrl"],
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

export const useCreateEvent = () => {
  const [types, setTypes] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [modalities, setModalities] = useState<EventModality[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
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
      locationCity: "Lima",
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

  const onSubmit = async (data: CreateEventFormValues) => {
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

      await eventsService.createEvent(payload);
      window.location.href = "/dashboard/events";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error("Backend validation error:", JSON.stringify(error.response.data, null, 2));
      }
      logger.error("Error creating event:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    types,
    categories,
    modalities,
    loading,
    submitting,
    onSubmit,
  };
};
