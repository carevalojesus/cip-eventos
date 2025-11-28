import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { FileText } from "lucide-react";
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
import type { EventType, EventCategory } from "@/types/event";
import type { CreateEventFormValues } from "@/hooks/useCreateEvent";

interface EventBasicInfoFieldsProps {
  form: UseFormReturn<CreateEventFormValues>;
  types: EventType[];
  categories: EventCategory[];
}

export const EventBasicInfoFields: React.FC<EventBasicInfoFieldsProps> = ({
  form,
  types,
  categories,
}) => {
  const { control } = form;

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-medium text-foreground">Información Básica</h2>
      </div>
      <div className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Título del Evento <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej: Semana de la Ingeniería Civil 2024"
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumen Corto</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Breve descripción para tarjetas (max 150 caracteres)"
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Descripción Detallada <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder="Información completa del evento..."
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
            name="typeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Evento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar..." />
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
            control={control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría / Capítulo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar..." />
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
