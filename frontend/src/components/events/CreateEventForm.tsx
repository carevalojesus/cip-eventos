import React, { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save, Send, CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";

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
  onSaveDraft: (data: CreateEventFormValues) => Promise<void>;
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
  onSaveDraft,
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
  const [pendingAction, setPendingAction] = useState<"publish" | "draft">("publish");

  const modalityId = selectedModalityId ? parseInt(selectedModalityId) : 0;
  const showLocation = requiresLocation(modalityId);
  const showVirtual = requiresVirtualAccess(modalityId);

  const handlePublish = (data: CreateEventFormValues) => {
    setPendingData(data);
    setPendingAction("publish");
    setShowConfirmDialog(true);
  };

  const handleDraft = (data: CreateEventFormValues) => {
    setPendingData(data);
    setPendingAction("draft");
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (pendingData) {
      setShowConfirmDialog(false);
      if (pendingAction === "publish") {
        await onSubmit(pendingData);
      } else {
        await onSaveDraft(pendingData);
      }
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
        <div>
          {/* Page Header - Refactoring UI */}
          <header className="rui-form-page-header">
            <button className="rui-breadcrumb-back" onClick={onCancel}>
              <ArrowLeft className="rui-breadcrumb-back-icon" />
              {t("create_event.back", "Volver")}
            </button>
            <h1 className="rui-form-page-title">
              {t("dashboard.events_view.create_title", "Crear Nuevo Evento")}
            </h1>
            <p className="rui-form-page-subtitle">
              {t("dashboard.events_view.create_subtitle", "Complete la información para publicar un evento en el calendario del CIP.")}
            </p>
          </header>

          {/* Form Layout - 2 columns */}
          <div className="rui-form-layout">
            {/* Main Column */}
            <div className="rui-form-main">
              <EventBasicInfoFields form={form} types={types} categories={categories} />
              <EventImageUpload form={form} />
            </div>

            {/* Sidebar Column */}
            <div className="rui-form-sidebar">
              {/* Configuration Card */}
              <div className="rui-form-card">
                <h2 className="rui-form-section-title">
                  {t("create_event.config.title", "Configuración")}
                </h2>

                {/* Modalidad */}
                <div className="rui-form-group">
                  <FormField
                    control={control}
                    name="modalityId"
                    render={({ field }) => (
                      <FormItem>
                        <label className="rui-form-label">
                          {t("create_event.config.modality", "Modalidad")}
                          <span className="rui-form-label-required">*</span>
                        </label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rui-select-trigger">
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
                        <FormMessage className="rui-form-error" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fecha y Hora de Inicio */}
                <div className="rui-form-group">
                  <FormField
                    control={control}
                    name="startAt"
                    render={({ field }) => {
                      const hasValue = field.value && isValid(new Date(field.value));
                      const currentTime = hasValue ? format(new Date(field.value), "HH:mm") : null;

                      return (
                        <FormItem>
                          <label className="rui-form-label">
                            {t("create_event.config.start", "Inicio")}
                            <span className="rui-form-label-required">*</span>
                          </label>
                          <div className="rui-form-row">
                            {/* Date Picker */}
                            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <button
                                    type="button"
                                    className={`rui-datetime-btn ${!hasValue ? "rui-datetime-btn--placeholder" : ""}`}
                                  >
                                    <CalendarIcon className="rui-datetime-btn-icon" />
                                    {hasValue
                                      ? format(new Date(field.value), "EEE, d MMM", { locale: es })
                                      : t("form.date", "Fecha")}
                                  </button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  locale={es}
                                  captionLayout="dropdown"
                                  selected={hasValue ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      const timeStr = currentTime || "09:00";
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
                                <button
                                  type="button"
                                  className={`rui-datetime-btn ${!currentTime ? "rui-datetime-btn--placeholder" : ""}`}
                                >
                                  <Clock className="rui-datetime-btn-icon" />
                                  {currentTime || t("form.time", "Hora")}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-28 p-0" align="start">
                                <ScrollArea className="h-64">
                                  <div className="rui-time-list">
                                    {timeOptions.map((time) => (
                                      <button
                                        key={time}
                                        type="button"
                                        className={`rui-time-option ${currentTime === time ? "rui-time-option--selected" : ""}`}
                                        onClick={() => {
                                          const dateStr = hasValue
                                            ? format(new Date(field.value), "yyyy-MM-dd")
                                            : format(new Date(), "yyyy-MM-dd");
                                          field.onChange(`${dateStr}T${time}`);
                                          setStartTimeOpen(false);
                                        }}
                                      >
                                        {time}
                                      </button>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage className="rui-form-error" />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Fecha y Hora de Fin */}
                <div className="rui-form-group">
                  <FormField
                    control={control}
                    name="endAt"
                    render={({ field }) => {
                      const hasValue = field.value && isValid(new Date(field.value));
                      const currentTime = hasValue ? format(new Date(field.value), "HH:mm") : null;

                      return (
                        <FormItem>
                          <label className="rui-form-label">
                            {t("create_event.config.end", "Fin")}
                            <span className="rui-form-label-required">*</span>
                          </label>
                          <div className="rui-form-row">
                            {/* Date Picker */}
                            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <button
                                    type="button"
                                    className={`rui-datetime-btn ${!hasValue ? "rui-datetime-btn--placeholder" : ""}`}
                                  >
                                    <CalendarIcon className="rui-datetime-btn-icon" />
                                    {hasValue
                                      ? format(new Date(field.value), "EEE, d MMM", { locale: es })
                                      : t("form.date", "Fecha")}
                                  </button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  locale={es}
                                  captionLayout="dropdown"
                                  selected={hasValue ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      const timeStr = currentTime || "18:00";
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
                                <button
                                  type="button"
                                  className={`rui-datetime-btn ${!currentTime ? "rui-datetime-btn--placeholder" : ""}`}
                                >
                                  <Clock className="rui-datetime-btn-icon" />
                                  {currentTime || t("form.time", "Hora")}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-28 p-0" align="start">
                                <ScrollArea className="h-64">
                                  <div className="rui-time-list">
                                    {timeOptions.map((time) => (
                                      <button
                                        key={time}
                                        type="button"
                                        className={`rui-time-option ${currentTime === time ? "rui-time-option--selected" : ""}`}
                                        onClick={() => {
                                          const dateStr = hasValue
                                            ? format(new Date(field.value), "yyyy-MM-dd")
                                            : format(new Date(), "yyyy-MM-dd");
                                          field.onChange(`${dateStr}T${time}`);
                                          setEndTimeOpen(false);
                                        }}
                                      >
                                        {time}
                                      </button>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage className="rui-form-error" />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </div>

              {/* Location Card - Conditional */}
              {showLocation && (
                <div className="rui-conditional-section">
                  <EventLocationFields form={form} />
                </div>
              )}

              {/* Virtual Card - Conditional */}
              {showVirtual && (
                <div className="rui-conditional-section">
                  <EventVirtualFields form={form} />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions - At the end */}
          <div className="rui-form-actions">
            <button
              type="button"
              className="rui-btn-form-tertiary"
              onClick={onCancel}
              disabled={submitting}
            >
              {t("form.cancel", "Cancelar")}
            </button>
            <button
              type="button"
              className="rui-btn-form-secondary"
              onClick={handleSubmit(handleDraft)}
              disabled={submitting}
            >
              {submitting && pendingAction === "draft" ? (
                <Loader2 className="rui-btn-form-secondary-icon animate-spin" />
              ) : (
                <Save className="rui-btn-form-secondary-icon" />
              )}
              {submitting && pendingAction === "draft"
                ? t("form.loading", "Guardando...")
                : t("form.save_draft", "Guardar Borrador")}
            </button>
            <button
              type="button"
              className="rui-btn-form-primary"
              onClick={handleSubmit(handlePublish)}
              disabled={submitting}
            >
              {submitting && pendingAction === "publish" ? (
                <Loader2 className="rui-btn-form-primary-icon animate-spin" />
              ) : (
                <Send className="rui-btn-form-primary-icon" />
              )}
              {submitting && pendingAction === "publish"
                ? t("form.loading", "Guardando...")
                : t("form.publish_event", "Publicar Evento")}
            </button>
          </div>
        </div>
      </Form>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "publish"
                ? t("create_event.confirm.publish_title", "¿Publicar evento?")
                : t("create_event.confirm.draft_title", "¿Guardar borrador?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "publish"
                ? t("create_event.confirm.publish_description", "El evento será visible públicamente en el calendario. Podrás editarlo o despublicarlo después.")
                : t("create_event.confirm.draft_description", "El evento se guardará como borrador. Podrás editarlo y publicarlo cuando esté listo.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave}>
              {t("form.cancel", "Cancelar")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              {pendingAction === "publish"
                ? t("form.publish_event", "Publicar Evento")
                : t("form.save_draft", "Guardar Borrador")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
