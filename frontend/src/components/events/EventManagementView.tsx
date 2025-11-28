import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Share2,
  Globe,
  Settings,
  Ticket,
  Calendar,
  Users,
  UserCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "./tabs/GeneralTab";
import { PlaceholderTab } from "./tabs/PlaceholderTab";
import { useEventDetails } from "@/hooks/useEventDetails";
import { getCurrentLocale, routes } from "@/lib/routes";
import type { EventStatus } from "@/types/event";

interface EventManagementViewProps {
  eventId: string;
  onNavigate?: (path: string) => void;
}

const statusVariantMap: Record<EventStatus, "success" | "gray" | "default" | "destructive"> = {
  PUBLISHED: "success",
  DRAFT: "gray",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export const EventManagementView: React.FC<EventManagementViewProps> = ({ eventId, onNavigate }) => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();
  const [activeTab, setActiveTab] = useState("general");

  const {
    event,
    form,
    types,
    categories,
    modalities,
    loading,
    saving,
    error,
    onSubmit,
    publishEvent,
  } = useEventDetails(eventId);

  const handleBack = () => {
    const eventsPath = routes[locale].events;
    if (onNavigate) {
      onNavigate(eventsPath);
    } else {
      window.location.href = eventsPath;
    }
  };

  const handlePublish = async () => {
    const success = await publishEvent();
    if (success) {
      // Podría mostrar un toast de éxito
    }
  };

  const tabs = [
    { id: "general", label: t("event_management.tabs.general"), icon: Settings },
    { id: "tickets", label: t("event_management.tabs.tickets"), icon: Ticket },
    { id: "agenda", label: t("event_management.tabs.agenda"), icon: Calendar },
    { id: "participants", label: t("event_management.tabs.participants"), icon: Users },
    { id: "attendees", label: t("event_management.tabs.attendees"), icon: UserCheck },
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
      <div className="space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={handleBack}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("event_management.breadcrumb.back")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("event_management.breadcrumb.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Title & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {event.title}
            </h1>
            <Badge variant={statusVariantMap[event.status]}>
              {t(`dashboard.events_view.status.${event.status}`)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              {t("event_management.actions.preview")}
            </Button>
            {event.status === "DRAFT" && (
              <Button className="gap-2" onClick={handlePublish} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {t("event_management.actions.publish")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-200">
          <TabsList className="h-auto bg-transparent p-0 w-full justify-start gap-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none hover:text-gray-700 hover:bg-gray-50"
              >
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="general" className="mt-6">
          <GeneralTab
            form={form}
            types={types}
            categories={categories}
            modalities={modalities}
            onSubmit={onSubmit}
            saving={saving}
          />
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
