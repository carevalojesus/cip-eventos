import React from "react";
import { useTranslation } from "react-i18next";
import { Save, MapPin, Monitor, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { requiresLocation, requiresVirtualAccess } from "@/constants/modalities";
import type { EditEventFormValues } from "@/hooks/useEventDetails";
import type { EventType, EventCategory, EventModality } from "@/types/event";

interface GeneralTabProps {
  form: UseFormReturn<EditEventFormValues>;
  types: EventType[];
  categories: EventCategory[];
  modalities: EventModality[];
  onSubmit: (data: EditEventFormValues) => Promise<boolean>;
  saving: boolean;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  form,
  types,
  categories,
  modalities,
  onSubmit,
  saving,
}) => {
  const { t } = useTranslation();
  const modalityId = form.watch("modalityId");
  const modalityIdNum = modalityId ? parseInt(modalityId) : 0;
  const showLocation = requiresLocation(modalityIdNum);
  const showVirtual = requiresVirtualAccess(modalityIdNum);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>{t("event_management.general.basic_info")}</CardTitle>
            <CardDescription>
              {t("event_management.general.basic_info_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("event_management.general.title")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("event_management.general.title_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("event_management.general.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("event_management.general.description_placeholder")}
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo, Categoría, Modalidad */}
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create_event.type")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("create_event.type_placeholder")} />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create_event.category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("create_event.category_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modalityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.general.modality")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("event_management.general.modality_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modalities.map((modality) => (
                          <SelectItem key={modality.id} value={modality.id.toString()}>
                            {modality.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fechas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.general.start_date")}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.general.end_date")}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botón Guardar */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("event_management.actions.save")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación Física y Accesos Virtuales */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ubicación Física */}
          <Card className={!showLocation ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("event_management.location.title")}
              </CardTitle>
              <CardDescription>
                {t("event_management.location.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="locationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.location.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("event_management.location.name_placeholder")}
                        disabled={!showLocation}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.location.address")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("event_management.location.address_placeholder")}
                        disabled={!showLocation}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="locationCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("event_management.location.city")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("event_management.location.city_placeholder")}
                          disabled={!showLocation}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("event_management.location.reference")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("event_management.location.reference_placeholder")}
                          disabled={!showLocation}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="locationMapLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.location.map_link")}</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder={t("event_management.location.map_link_placeholder")}
                        disabled={!showLocation}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Accesos Virtuales */}
          <Card className={!showVirtual ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                {t("event_management.virtual.title")}
              </CardTitle>
              <CardDescription>
                {t("event_management.virtual.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="virtualPlatform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.virtual.platform")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!showVirtual}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("event_management.virtual.platform_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Zoom">Zoom</SelectItem>
                        <SelectItem value="Google Meet">Google Meet</SelectItem>
                        <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                        <SelectItem value="Otro">{t("event_management.virtual.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="virtualMeetingUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.virtual.meeting_url")}</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder={t("event_management.virtual.meeting_url_placeholder")}
                        disabled={!showVirtual}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="virtualMeetingPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.virtual.password")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("event_management.virtual.password_placeholder")}
                        disabled={!showVirtual}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="virtualInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("event_management.virtual.instructions")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("event_management.virtual.instructions_placeholder")}
                        className="min-h-[80px] resize-y"
                        disabled={!showVirtual}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
};
