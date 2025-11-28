import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Globe } from "lucide-react";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";

interface EventVirtualFieldsProps {
  form: UseFormReturn<CreateEventFormValues>;
}

export const EventVirtualFields: React.FC<EventVirtualFieldsProps> = ({ form }) => {
  const { control } = form;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm border-l-4 border-l-purple-500">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-purple-500" />
        <h2 className="text-lg font-medium text-gray-900">Accesos Virtuales</h2>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="virtualPlatform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Plataforma <span className="text-red-500">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="Google Meet">Google Meet</SelectItem>
                    <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                    <SelectItem value="Other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="virtualMeetingPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ej: CIP2024" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="virtualMeetingUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Link de Reunión <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://zoom.us/j/..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="virtualInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instrucciones Adicionales</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="Instrucciones para unirse..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
