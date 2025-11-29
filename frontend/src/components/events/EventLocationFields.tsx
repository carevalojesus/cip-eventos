import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
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
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-medium text-foreground">Ubicación Presencial</h2>
      </div>
      <div className="space-y-4">
        <FormField
          control={control}
          name="locationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre del Lugar <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <LocationAutocomplete
                  value={field.value}
                  onSelect={handleLocationSelect}
                  onInputChange={field.onChange}
                  placeholder="Buscar o escribir nombre del lugar..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="locationAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Dirección <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej: Av. Pevas Cuadra 4"
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="locationCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Ciudad <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Lima" className="bg-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="locationReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Frente al Parque..." className="bg-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="locationMapLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link de Mapa (Google Maps)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://maps.google.com/..." className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
