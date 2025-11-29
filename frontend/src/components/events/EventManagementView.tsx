import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Settings,
  Ticket,
  Calendar,
  Users,
  UserCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Breadcrumb as BreadcrumbData } from "@/components/dashboard/DashboardApp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "./tabs/GeneralTab";
import { PlaceholderTab } from "./tabs/PlaceholderTab";
import { useEventDetails } from "@/hooks/useEventDetails";
import { getCurrentLocale, routes } from "@/lib/routes";
import type { EventStatus } from "@/types/event";

interface EventManagementViewProps {
  eventId: string;
  onNavigate?: (path: string) => void;
  onBreadcrumbsChange?: (breadcrumbs: BreadcrumbData[]) => void;
}

const statusVariantMap: Record<EventStatus, "success" | "gray" | "info" | "destructive"> = {
  PUBLISHED: "success",
  DRAFT: "gray",
  COMPLETED: "info",
  CANCELLED: "destructive",
};

export const EventManagementView: React.FC<EventManagementViewProps> = ({ eventId, onNavigate, onBreadcrumbsChange }) => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();
  const [activeTab, setActiveTab] = useState("general");

  const {
    event,
    loading,
    saving,
    error,
    publishEvent,
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

  const tabs = [
    { id: "general", label: t("event_management.tabs.general"), icon: Settings },
    { id: "tickets", label: t("event_management.tabs.tickets"), icon: Ticket },
    { id: "agenda", label: t("event_management.tabs.agenda"), icon: Calendar },
    { id: "participants", label: t("event_management.tabs.participants"), icon: Users },
    { id: "attendees", label: t("event_management.tabs.attendees"), icon: UserCheck },
  ];

  // Report breadcrumbs to parent
  useEffect(() => {
    if (onBreadcrumbsChange) {
      const eventsPath = routes[locale].events;
      onBreadcrumbsChange([
        { label: t("event_management.breadcrumb.back"), href: eventsPath },
        { label: t("event_management.breadcrumb.title") },
      ]);
    }
    // Cleanup breadcrumbs when unmounting
    return () => {
      onBreadcrumbsChange?.([]);
    };
  }, [onBreadcrumbsChange, locale, t]);

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
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              {error || t("errors.unknown")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleBack}>
            {t("event_management.breadcrumb.back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
          {event.title}
        </h1>
        <Badge variant={statusVariantMap[event.status]}>
          {t(`dashboard.events_view.status.${event.status}`)}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="general" className="mt-6">
          <GeneralTab event={event} onEdit={handleEdit} onChangeStatus={changeStatus} publishing={saving} />
        </TabsContent>
        <TabsContent value="tickets" className="mt-6">
          <PlaceholderTab
            title={t("event_management.tabs.tickets")}
            description={t("event_management.coming_soon")}
            icon={Ticket}
          />
        </TabsContent>
        <TabsContent value="agenda" className="mt-6">
          <PlaceholderTab
            title={t("event_management.tabs.agenda")}
            description={t("event_management.coming_soon")}
            icon={Calendar}
          />
        </TabsContent>
        <TabsContent value="participants" className="mt-6">
          <PlaceholderTab
            title={t("event_management.tabs.participants")}
            description={t("event_management.coming_soon")}
            icon={Users}
          />
        </TabsContent>
        <TabsContent value="attendees" className="mt-6">
          <PlaceholderTab
            title={t("event_management.tabs.attendees")}
            description={t("event_management.coming_soon")}
            icon={UserCheck}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
