import React, { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Save, X, CalendarIcon, Clock, Settings2, Loader2 } from "lucide-react";
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

import { requiresLocation, requiresVirtualAccess } from "@/constants/modalities";
import type { EventType, EventCategory, EventModality } from "@/types/event";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";

interface CreateEventFormProps {
  form: UseFormReturn<CreateEventFormValues>;
  types: EventType[];
  categories: EventCategory[];
  modalities: EventModality[];
  onSubmit: (data: CreateEventFormValues) => Promise<void>;
  submitting: boolean;
  onCancel: () => void;
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

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  form,
  types,
  categories,
  modalities,
  onSubmit,
  submitting,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { handleSubmit, watch, control } = form;
  const selectedModalityId = watch("modalityId");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<CreateEventFormValues | null>(null);

  const modalityId = selectedModalityId ? parseInt(selectedModalityId) : 0;
  const showLocation = requiresLocation(modalityId);
  const showVirtual = requiresVirtualAccess(modalityId);

  const handleFormSubmit = (data: CreateEventFormValues) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (pendingData) {
      setShowConfirmDialog(false);
      await onSubmit(pendingData);
      setPendingData(null);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmDialog(false);
    setPendingData(null);
  };

  return (
    <>
      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("dashboard.events_view.create_title", "Crear Nuevo Evento")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.events_view.create_subtitle", "Complete la información para publicar un evento en el calendario del CIP.")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onCancel} disabled={submitting}>
                <X className="mr-2 h-4 w-4" />
                {t("form.cancel", "Cancelar")}
              </Button>
              <Button onClick={handleSubmit(handleFormSubmit)} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {submitting ? t("form.loading", "Guardando...") : t("form.save_event", "Guardar Evento")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              <EventBasicInfoFields form={form} types={types} categories={categories} />
              <EventImageUpload form={form} />
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Configuration Card */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-medium text-foreground">Configuración</h2>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="modalityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalidad <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccionar..." />
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
                        <FormLabel>Inicio <span className="text-red-500">*</span></FormLabel>
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
                                  {field.value ? format(new Date(field.value), "dd/MM/yyyy") : "Fecha"}
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
                        <FormLabel>Fin <span className="text-red-500">*</span></FormLabel>
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
                                  {field.value ? format(new Date(field.value), "dd/MM/yyyy") : "Fecha"}
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
            <AlertDialogTitle>¿Guardar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de crear un nuevo evento. Una vez guardado, podrás editarlo o publicarlo desde la vista de gestión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Guardar Evento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
