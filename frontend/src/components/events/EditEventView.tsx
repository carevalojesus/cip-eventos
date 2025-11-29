import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "axios";
import { Save, X, CalendarIcon, Clock, Settings2, Loader2, ArrowLeft } from "lucide-react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { EventBasicInfoFields } from "./EventBasicInfoFields";
import { EventLocationFields } from "./EventLocationFields";
import { EventVirtualFields } from "./EventVirtualFields";
import { EventImageUpload } from "./EventImageUpload";

import { eventsService } from "@/services/events.service";
import { logger } from "@/utils/logger";
import { requiresLocation, requiresVirtualAccess } from "@/constants/modalities";
import { getCurrentLocale, routes } from "@/lib/routes";
import { createEventSchema, type CreateEventFormValues } from "@/hooks/useCreateEvent";
import type { Breadcrumb } from "@/components/dashboard/DashboardApp";
import type { Event, EventType, EventCategory, EventModality } from "@/types/event";

interface EditEventViewProps {
  eventId: string;
  onNavigate?: (path: string) => void;
  onBreadcrumbsChange?: (breadcrumbs: Breadcrumb[]) => void;
}

// Generar opciones de hora (cada 30 minutos)
const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

// Función para formatear fecha para input datetime-local
const formatDateForForm = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

export const EditEventView: React.FC<EditEventViewProps> = ({
  eventId,
  onNavigate,
  onBreadcrumbsChange,
}) => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();

  const [event, setEvent] = useState<Event | null>(null);
  const [types, setTypes] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [modalities, setModalities] = useState<EventModality[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageTimestamp, setImageTimestamp] = useState<number>(Date.now());

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<CreateEventFormValues | null>(null);

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

  const { handleSubmit, watch, control, reset } = form;
  const selectedModalityId = watch("modalityId");

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
        reset({
          title: eventData.title || "",
          summary: eventData.summary || "",
          description: eventData.description || "",
          typeId: eventData.type?.id?.toString() || "",
          categoryId: eventData.category?.id?.toString() || "",
          modalityId: eventData.modality?.id?.toString() || "",
          startAt: formatDateForForm(eventData.startAt),
          endAt: formatDateForForm(eventData.endAt),
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
  }, [eventId, t, reset]);

  // Report breadcrumbs to parent
  useEffect(() => {
    if (onBreadcrumbsChange) {
      const eventsPath = routes[locale].events;
      const managePath = routes[locale].eventsManage(eventId);
      onBreadcrumbsChange([
        { label: t("event_management.breadcrumb.back"), href: eventsPath },
        { label: event?.title || t("event_management.breadcrumb.title"), href: managePath },
        { label: t("edit_event.breadcrumb.title", "Editar") },
      ]);
    }
    return () => {
      onBreadcrumbsChange?.([]);
    };
  }, [onBreadcrumbsChange, locale, t, eventId, event?.title]);

  const handleBack = () => {
    const managePath = routes[locale].eventsManage(eventId);
    if (onNavigate) {
      onNavigate(managePath);
    } else {
      window.location.href = managePath;
    }
  };

  const handleFormSubmit = (data: CreateEventFormValues) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;

    setShowConfirmDialog(false);
    setSubmitting(true);

    try {
      const data = pendingData;
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
      setPendingData(null);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmDialog(false);
    setPendingData(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              {error || t("errors.unknown")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleBack}>
            {t("form.back", "Volver")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {t("edit_event.title", "Editar Evento")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("edit_event.subtitle", "Modifica la información del evento.")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleBack} disabled={submitting}>
                <X className="mr-2 h-4 w-4" />
                {t("form.cancel", "Cancelar")}
              </Button>
              <Button onClick={handleSubmit(handleFormSubmit)} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {submitting ? t("form.loading", "Guardando...") : t("form.save_changes", "Guardar Cambios")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              <EventBasicInfoFields form={form} types={types} categories={categories} />
              <EventImageUpload form={form} existingImageUrl={event.imageUrl ? `${event.imageUrl}?t=${imageTimestamp}` : undefined} />
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Configuration Card */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-medium text-foreground">
                    {t("create_event.configuration", "Configuración")}
                  </h2>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="modalityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("create_event.modality", "Modalidad")} <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder={t("form.select", "Seleccionar...")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modalities.map((mod) => (
                              <SelectItem key={mod.id} value={mod.id.toString()}>
                                {mod.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha y Hora de Inicio */}
                  <FormField
                    control={control}
                    name="startAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("create_event.start", "Inicio")} <span className="text-red-500">*</span></FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Date Picker */}
                          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal bg-white",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                  {field.value ? format(new Date(field.value), "dd/MM/yyyy") : t("form.date", "Fecha")}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                locale={es}
                                captionLayout="dropdown"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const timeStr = field.value && isValid(new Date(field.value))
                                      ? format(new Date(field.value), "HH:mm")
                                      : "09:00";
                                    const dateStr = format(date, "yyyy-MM-dd");
                                    field.onChange(`${dateStr}T${timeStr}`);
                                    setStartDateOpen(false);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                          {/* Time Picker */}
                          <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-white",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <Clock className="mr-2 h-4 w-4 text-slate-500" />
                                {field.value && isValid(new Date(field.value))
                                  ? format(new Date(field.value), "HH:mm")
                                  : "09:00"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 p-0" align="start">
                              <ScrollArea className="h-60">
                                <div className="p-1">
                                  {timeOptions.map((time) => (
                                    <Button
                                      key={time}
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "w-full justify-start font-normal",
                                        field.value && isValid(new Date(field.value)) &&
                                          format(new Date(field.value), "HH:mm") === time &&
                                          "bg-slate-100 text-slate-900"
                                      )}
                                      onClick={() => {
                                        const dateStr = field.value && isValid(new Date(field.value))
                                          ? format(new Date(field.value), "yyyy-MM-dd")
                                          : format(new Date(), "yyyy-MM-dd");
                                        field.onChange(`${dateStr}T${time}`);
                                        setStartTimeOpen(false);
                                      }}
                                    >
                                      {time}
                                    </Button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha y Hora de Fin */}
                  <FormField
                    control={control}
                    name="endAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("create_event.end", "Fin")} <span className="text-red-500">*</span></FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Date Picker */}
                          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal bg-white",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                  {field.value ? format(new Date(field.value), "dd/MM/yyyy") : t("form.date", "Fecha")}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                locale={es}
                                captionLayout="dropdown"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const timeStr = field.value && isValid(new Date(field.value))
                                      ? format(new Date(field.value), "HH:mm")
                                      : "18:00";
                                    const dateStr = format(date, "yyyy-MM-dd");
                                    field.onChange(`${dateStr}T${timeStr}`);
                                    setEndDateOpen(false);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                          {/* Time Picker */}
                          <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-white",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <Clock className="mr-2 h-4 w-4 text-slate-500" />
                                {field.value && isValid(new Date(field.value))
                                  ? format(new Date(field.value), "HH:mm")
                                  : "18:00"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 p-0" align="start">
                              <ScrollArea className="h-60">
                                <div className="p-1">
                                  {timeOptions.map((time) => (
                                    <Button
                                      key={time}
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "w-full justify-start font-normal",
                                        field.value && isValid(new Date(field.value)) &&
                                          format(new Date(field.value), "HH:mm") === time &&
                                          "bg-slate-100 text-slate-900"
                                      )}
                                      onClick={() => {
                                        const dateStr = field.value && isValid(new Date(field.value))
                                          ? format(new Date(field.value), "yyyy-MM-dd")
                                          : format(new Date(), "yyyy-MM-dd");
                                        field.onChange(`${dateStr}T${time}`);
                                        setEndTimeOpen(false);
                                      }}
                                    >
                                      {time}
                                    </Button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location Card - appears when presencial or híbrido */}
              {showLocation && <EventLocationFields form={form} />}

              {/* Virtual Card - appears when virtual or híbrido */}
              {showVirtual && <EventVirtualFields form={form} />}
            </div>
          </div>
        </div>
      </Form>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("edit_event.confirm_title", "¿Guardar cambios?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("edit_event.confirm_description", "Los cambios se aplicarán inmediatamente al evento.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave}>{t("form.cancel", "Cancelar")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              {t("form.save_changes", "Guardar Cambios")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
