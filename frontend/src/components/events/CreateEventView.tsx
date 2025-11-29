import React from "react";
import { useCreateEvent } from "@/hooks/useCreateEvent";
import { CreateEventForm } from "./CreateEventForm";
import { getCurrentLocale, routes } from "@/lib/routes";

interface CreateEventViewProps {
  onNavigate?: (path: string) => void;
}

export const CreateEventView: React.FC<CreateEventViewProps> = ({
  onNavigate,
}) => {
  const locale = getCurrentLocale();
  const {
    form,
    types,
    categories,
    modalities,
    loading,
    submitting,
    onSubmit,
    onSaveDraft,
  } = useCreateEvent();

  const handleCancel = () => {
    const eventsPath = routes[locale].events;
    if (onNavigate) {
      onNavigate(eventsPath);
    } else {
      window.history.back();
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <CreateEventForm
      form={form}
      types={types}
      categories={categories}
      modalities={modalities}
      onSubmit={onSubmit}
      onSaveDraft={onSaveDraft}
      submitting={submitting}
      onCancel={handleCancel}
    />
  );
};

