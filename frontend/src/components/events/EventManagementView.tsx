import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { GeneralTab } from "./tabs/GeneralTab";
import { TicketsTab } from "./tabs/TicketsTab";
import { PlaceholderTab } from "./tabs/PlaceholderTab";
import { useEventDetails } from "@/hooks/useEventDetails";
import { getCurrentLocale, routes } from "@/lib/routes";

interface EventManagementViewProps {
  eventId: string;
  onNavigate?: (path: string) => void;
}

export const EventManagementView: React.FC<EventManagementViewProps> = ({ eventId, onNavigate }) => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();
  const [activeTab, setActiveTab] = useState("general");

  const {
    event,
    loading,
    saving,
    error,
    changeStatus,
  } = useEventDetails(eventId);

  const handleBack = () => {
    const eventsPath = routes[locale].events;
    if (onNavigate) {
      onNavigate(eventsPath);
    } else {
      window.location.href = eventsPath;
    }
  };

  const handleEdit = () => {
    const editPath = routes[locale].eventsEdit(eventId);
    if (onNavigate) {
      onNavigate(editPath);
    } else {
      window.location.href = editPath;
    }
  };

  // Tabs SIN iconos - solo texto
  const tabs = [
    { id: "general", label: t("event_management.tabs.general") },
    { id: "tickets", label: t("event_management.tabs.tickets") },
    { id: "agenda", label: t("event_management.tabs.agenda") },
    { id: "participants", label: t("event_management.tabs.participants") },
    { id: "attendees", label: t("event_management.tabs.attendees") },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="rui-event-detail">
        <button className="rui-breadcrumb-back" onClick={handleBack}>
          <ArrowLeft className="rui-breadcrumb-back-icon" />
          {t("event_management.breadcrumb.back")}
        </button>
        <div className="rui-alert rui-alert--error">
          <AlertCircle className="rui-alert-icon" />
          <p className="rui-alert-message">{error || t("errors.unknown")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rui-event-detail">
      {/* Breadcrumb */}
      <button className="rui-breadcrumb-back" onClick={handleBack}>
        <ArrowLeft className="rui-breadcrumb-back-icon" />
        {t("event_management.breadcrumb.back")}
      </button>

      {/* Tabs - SIN iconos */}
      <nav className="rui-event-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`rui-event-tab ${activeTab === tab.id ? "rui-event-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Contents */}
      {activeTab === "general" && (
        <GeneralTab event={event} onEdit={handleEdit} onChangeStatus={changeStatus} publishing={saving} />
      )}
      {activeTab === "tickets" && (
        <TicketsTab eventId={eventId} />
      )}
      {activeTab === "agenda" && (
        <PlaceholderTab
          title={t("event_management.tabs.agenda")}
          description={t("event_management.coming_soon")}
        />
      )}
      {activeTab === "participants" && (
        <PlaceholderTab
          title={t("event_management.tabs.participants")}
          description={t("event_management.coming_soon")}
        />
      )}
      {activeTab === "attendees" && (
        <PlaceholderTab
          title={t("event_management.tabs.attendees")}
          description={t("event_management.coming_soon")}
        />
      )}
    </div>
  );
};
