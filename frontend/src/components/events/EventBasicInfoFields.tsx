import React, { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/radix-select";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { EventType, EventCategory } from "@/types/event";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";

interface EventBasicInfoFieldsProps {
  form: UseFormReturn<CreateEventFormValues>;
  types: EventType[];
  categories: EventCategory[];
}

const MAX_SUMMARY_LENGTH = 150;

export const EventBasicInfoFields: React.FC<EventBasicInfoFieldsProps> = ({
  form,
  types,
  categories,
}) => {
  const { t } = useTranslation();
  const { control, watch } = form;
  const summaryValue = watch("summary") || "";
  const [summaryLength, setSummaryLength] = useState(summaryValue.length);

  const getCounterClass = () => {
    if (summaryLength > MAX_SUMMARY_LENGTH) return "rui-form-counter--error";
    if (summaryLength > MAX_SUMMARY_LENGTH - 10) return "rui-form-counter--warning";
    return "";
  };

  return (
    <div className="rui-form-card">
      <h2 className="rui-form-section-title">
        {t("create_event.basic.title", "Información Básica")}
      </h2>

      {/* Título del Evento */}
      <div className="rui-form-group">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <label className="rui-form-label">
                {t("create_event.basic.event_title", "Título del Evento")}
                <span className="rui-form-label-required">*</span>
              </label>
              <FormControl>
                <input
                  {...field}
                  type="text"
                  className="rui-form-input"
                  placeholder={t("create_event.basic.event_title_placeholder", "Nombre del evento")}
                />
              </FormControl>
              <span className="rui-form-hint">
                {t("create_event.basic.event_title_hint", "Ej: Congreso de Ingeniería Civil 2024")}
              </span>
              <FormMessage className="rui-form-error" />
            </FormItem>
          )}
        />
      </div>

      {/* Resumen Corto con contador */}
      <div className="rui-form-group">
        <FormField
          control={control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <label className="rui-form-label">
                {t("create_event.basic.summary", "Resumen Corto")}
              </label>
              <FormControl>
                <input
                  {...field}
                  type="text"
                  className="rui-form-input"
                  placeholder={t("create_event.basic.summary_placeholder", "Descripción breve")}
                  maxLength={MAX_SUMMARY_LENGTH + 10}
                  onChange={(e) => {
                    field.onChange(e);
                    setSummaryLength(e.target.value.length);
                  }}
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <span className="rui-form-hint">
                  {t("create_event.basic.summary_hint", "Se muestra en las tarjetas del listado")}
                </span>
                <span className={`rui-form-counter ${getCounterClass()}`}>
                  {summaryLength}/{MAX_SUMMARY_LENGTH}
                </span>
              </div>
              <FormMessage className="rui-form-error" />
            </FormItem>
          )}
        />
      </div>

      {/* Descripción Detallada */}
      <div className="rui-form-group">
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <label className="rui-form-label">
                {t("create_event.basic.description", "Descripción Detallada")}
                <span className="rui-form-label-required">*</span>
              </label>
              <FormControl>
                <textarea
                  {...field}
                  className="rui-form-input rui-form-textarea"
                  rows={6}
                  placeholder={t("create_event.basic.description_placeholder", "Información completa del evento...")}
                />
              </FormControl>
              <FormMessage className="rui-form-error" />
            </FormItem>
          )}
        />
      </div>

      {/* Tipo y Categoría en 2 columnas */}
      <div className="rui-form-row">
        <div className="rui-form-group">
          <FormField
            control={control}
            name="typeId"
            render={({ field }) => (
              <FormItem>
                <label className="rui-form-label">
                  {t("create_event.basic.type", "Tipo de Evento")}
                </label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rui-select-trigger">
                      <SelectValue placeholder={t("form.select", "Seleccionar...")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="rui-form-error" />
              </FormItem>
            )}
          />
        </div>

        <div className="rui-form-group">
          <FormField
            control={control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <label className="rui-form-label">
                  {t("create_event.basic.category", "Categoría / Capítulo")}
                </label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rui-select-trigger">
                      <SelectValue placeholder={t("form.select", "Seleccionar...")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="rui-form-error" />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
