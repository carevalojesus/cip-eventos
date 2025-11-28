import React from "react";
import { useCreateEvent } from "@/hooks/useCreateEvent";
import { CreateEventForm } from "./CreateEventForm";

export const CreateEventView: React.FC = () => {
  const {
    form,
    types,
    categories,
    modalities,
    loading,
    submitting,
    onSubmit,
  } = useCreateEvent();

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
      submitting={submitting}
      onCancel={() => window.history.back()}
    />
  );
};

