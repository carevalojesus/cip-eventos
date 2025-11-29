import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";

interface EventVirtualFieldsProps {
  form: UseFormReturn<CreateEventFormValues>;
}

export const EventVirtualFields: React.FC<EventVirtualFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control } = form;

  return (
    <div className="rui-form-card">
      <h2 className="rui-form-section-title">
        {t("create_event.virtual.title", "Accesos Virtuales")}
      </h2>

      {/* Plataforma y Contraseña */}
      <div className="rui-form-row">
        <div className="rui-form-group">
          <FormField
            control={control}
            name="virtualPlatform"
            render={({ field }) => (
              <FormItem>
                <label className="rui-form-label">
                  {t("create_event.virtual.platform", "Plataforma")}
                  <span className="rui-form-label-required">*</span>
                </label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rui-select-trigger">
                      <SelectValue placeholder={t("form.select", "Seleccionar...")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="Google Meet">Google Meet</SelectItem>
                    <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                    <SelectItem value="Other">{t("create_event.virtual.other", "Otro")}</SelectItem>
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
            name="virtualMeetingPassword"
            render={({ field }) => (
              <FormItem>
                <label className="rui-form-label">
                  {t("create_event.virtual.password", "Contraseña")}
                </label>
                <FormControl>
                  <input
                    {...field}
                    type="text"
                    className="rui-form-input"
                    placeholder={t("create_event.virtual.password_placeholder", "Ej: CIP2024")}
                  />
                </FormControl>
                <FormMessage className="rui-form-error" />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Link de Reunión */}
      <div className="rui-form-group">
        <FormField
          control={control}
          name="virtualMeetingUrl"
          render={({ field }) => (
            <FormItem>
              <label className="rui-form-label">
                {t("create_event.virtual.meeting_url", "Link de Reunión")}
                <span className="rui-form-label-required">*</span>
              </label>
              <FormControl>
                <input
                  {...field}
                  type="text"
                  className="rui-form-input"
                  placeholder="https://zoom.us/j/..."
                />
              </FormControl>
              <span className="rui-form-hint">
                {t("create_event.virtual.meeting_url_hint", "El enlace se enviará a los inscritos antes del evento")}
              </span>
              <FormMessage className="rui-form-error" />
            </FormItem>
          )}
        />
      </div>

      {/* Instrucciones Adicionales */}
      <div className="rui-form-group">
        <FormField
          control={control}
          name="virtualInstructions"
          render={({ field }) => (
            <FormItem>
              <label className="rui-form-label">
                {t("create_event.virtual.instructions", "Instrucciones Adicionales")}
              </label>
              <FormControl>
                <textarea
                  {...field}
                  className="rui-form-input rui-form-textarea"
                  rows={3}
                  placeholder={t("create_event.virtual.instructions_placeholder", "Instrucciones para unirse a la reunión...")}
                  style={{ minHeight: "80px" }}
                />
              </FormControl>
              <FormMessage className="rui-form-error" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
