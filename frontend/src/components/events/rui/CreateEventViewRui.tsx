import React from "react";
import { useCreateEvent } from "@/hooks/useCreateEvent";
import { CreateEventFormRui } from "./CreateEventFormRui";
import { getCurrentLocale, routes } from "@/lib/routes";

interface CreateEventViewRuiProps {
  onNavigate?: (path: string) => void;
}

export const CreateEventViewRui: React.FC<CreateEventViewRuiProps> = ({
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
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          color: "#857F72",
          fontSize: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <CreateEventFormRui
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
