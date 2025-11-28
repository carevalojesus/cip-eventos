import React, { useState } from "react";
import { type UseFormReturn, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Save, X, ChevronDown } from "lucide-react";
import { format, isValid } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

import { EventBasicInfoFields } from "./EventBasicInfoFields";
import { EventLocationFields } from "./EventLocationFields";
import { EventVirtualFields } from "./EventVirtualFields";
import { EventImageUpload } from "./EventImageUpload";

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
  const { handleSubmit, watch, control, setValue, formState: { errors } } = form;
  const selectedModalityId = watch("modalityId");
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const selectedModalityName = modalities.find(m => m.id.toString() === selectedModalityId)?.name.toLowerCase() || "";
  const showLocation = selectedModalityName.includes('presencial') || selectedModalityName.includes('híbrido');
  const showVirtual = selectedModalityName.includes('virtual') || selectedModalityName.includes('híbrido');

  return (
    <Form {...form}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("dashboard.events_view.create_title", "Crear Nuevo Evento")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("dashboard.events_view.create_subtitle", "Complete la información para publicar un evento en el calendario del CIP.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            {t("form.cancel", "Cancelar")}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={submitting}>
            <Save className="mr-2 h-4 w-4" />
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
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Configuración</h2>
            <div className="space-y-4">
              <FormField
                control={control}
                name="modalityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={control}
                name="startAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Inicio <span className="text-red-500">*</span></FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover open={startOpen} onOpenChange={setStartOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <ChevronDown className="mr-2 h-4 w-4 opacity-50" />
                              {field.value ? new Date(field.value).toLocaleDateString() : "Seleccionar fecha"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const timeStr = field.value ? format(new Date(field.value), "HH:mm") : "09:00";
                                const dateStr = format(date, "yyyy-MM-dd");
                                field.onChange(`${dateStr}T${timeStr}`);
                                setStartOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={field.value && isValid(new Date(field.value)) ? format(new Date(field.value), "HH:mm") : "09:00"}
                        onChange={(e) => {
                          const timeStr = e.target.value;
                          if (!timeStr) return;
                          const dateStr = field.value && isValid(new Date(field.value)) ? format(new Date(field.value), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
                          const newDate = new Date(`${dateStr}T${timeStr}`);
                          if (isValid(newDate)) {
                            field.onChange(`${dateStr}T${timeStr}`);
                          }
                        }}
                        className="bg-background"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="endAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fin <span className="text-red-500">*</span></FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover open={endOpen} onOpenChange={setEndOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <ChevronDown className="mr-2 h-4 w-4 opacity-50" />
                              {field.value ? new Date(field.value).toLocaleDateString() : "Seleccionar fecha"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const timeStr = field.value ? format(new Date(field.value), "HH:mm") : "18:00";
                                const dateStr = format(date, "yyyy-MM-dd");
                                field.onChange(`${dateStr}T${timeStr}`);
                                setEndOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={field.value && isValid(new Date(field.value)) ? format(new Date(field.value), "HH:mm") : "18:00"}
                        onChange={(e) => {
                          const timeStr = e.target.value;
                          if (!timeStr) return;
                          const dateStr = field.value && isValid(new Date(field.value)) ? format(new Date(field.value), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
                          const newDate = new Date(`${dateStr}T${timeStr}`);
                          if (isValid(newDate)) {
                            field.onChange(`${dateStr}T${timeStr}`);
                          }
                        }}
                        className="bg-background"
                      />
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
  );
};
