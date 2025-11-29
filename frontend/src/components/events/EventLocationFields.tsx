import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { LocationAutocomplete } from "./LocationAutocomplete";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";
import type { EventLocation } from "@/types/event";

interface EventLocationFieldsProps {
  form: UseFormReturn<CreateEventFormValues>;
}

export const EventLocationFields: React.FC<EventLocationFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control, setValue } = form;

  const handleLocationSelect = (location: EventLocation | null) => {
    if (location) {
      setValue("locationName", location.name || location.address);
      setValue("locationAddress", location.address);
      setValue("locationCity", location.city);
      setValue("locationReference", location.reference || "");
      setValue("locationMapLink", location.mapLink || "");
    }
  };

  return (
    <div className="rui-form-card">
      <h2 className="rui-form-section-title">
        {t("create_event.location.title", "Ubicación Presencial")}
      </h2>

      {/* Nombre del Lugar */}
      <div className="rui-form-group">
        <FormField
          control={control}
          name="locationName"
          render={({ field }) => (
            <FormItem>
              <label className="rui-form-label">
                {t("create_event.location.name", "Nombre del Lugar")}
                <span className="rui-form-label-required">*</span>
              </label>
              <FormControl>
                <LocationAutocomplete
                  value={field.value}
                  onSelect={handleLocationSelect}
                  onInputChange={field.onChange}
                  placeholder={t("create_event.location.name_placeholder", "Buscar o escribir nombre del lugar...")}
                />
              </FormControl>
              <FormMessage className="rui-form-error" />
            </FormItem>
          )}
        />
      </div>

      {/* Dirección */}
      <div className="rui-form-group">
        <FormField
          control={control}
          name="locationAddress"
          render={({ field }) => (
            <FormItem>
              <label className="rui-form-label">
                {t("create_event.location.address", "Dirección")}
                <span className="rui-form-label-required">*</span>
              </label>
              <FormControl>
                <input
                  {...field}
                  type="text"
                  className="rui-form-input"
                  placeholder={t("create_event.location.address_placeholder", "Ej: Av. Pevas Cuadra 4")}
                />
              </FormControl>
              <FormMessage className="rui-form-error" />
            </FormItem>
          )}
        />
      </div>

      {/* Ciudad y Referencia */}
      <div className="rui-form-row">
        <div className="rui-form-group">
          <FormField
            control={control}
            name="locationCity"
            render={({ field }) => (
              <FormItem>
                <label className="rui-form-label">
                  {t("create_event.location.city", "Ciudad")}
                  <span className="rui-form-label-required">*</span>
                </label>
                <FormControl>
                  <input
                    {...field}
                    type="text"
                    className="rui-form-input"
                    placeholder={t("create_event.location.city_placeholder", "Lima")}
                  />
                </FormControl>
                <FormMessage className="rui-form-error" />
              </FormItem>
            )}
          />
        </div>

        <div className="rui-form-group">
          <FormField
            control={control}
            name="locationReference"
            render={({ field }) => (
              <FormItem>
                <label className="rui-form-label">
                  {t("create_event.location.reference", "Referencia")}
                </label>
                <FormControl>
                  <input
                    {...field}
                    type="text"
                    className="rui-form-input"
                    placeholder={t("create_event.location.reference_placeholder", "Frente al Parque...")}
                  />
                </FormControl>
                <FormMessage className="rui-form-error" />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Link de Mapa */}
      <div className="rui-form-group">
        <FormField
          control={control}
          name="locationMapLink"
          render={({ field }) => (
            <FormItem>
              <label className="rui-form-label">
                {t("create_event.location.map_link", "Link de Mapa (Google Maps)")}
              </label>
              <FormControl>
                <input
                  {...field}
                  type="text"
                  className="rui-form-input"
                  placeholder="https://maps.google.com/..."
                />
              </FormControl>
              <span className="rui-form-hint">
                {t("create_event.location.map_hint", "Copia el enlace desde Google Maps para facilitar la ubicación")}
              </span>
              <FormMessage className="rui-form-error" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
