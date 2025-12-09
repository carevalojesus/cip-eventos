import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IconChevronRight,
  IconUserGroup,
  IconWallet,
  IconTicket,
  IconCheck,
  IconEdit,
  IconShare,
  IconAlertCircle,
  type DuotoneIconProps,
} from "@/components/icons/DuotoneIcons";
import { Button } from "@/components/ui/rui";
import { GeneralTab } from "./tabs/GeneralTab";
import { TicketsTab } from "./tabs/TicketsTab";
import { SessionsTab } from "./tabs/SessionsTab";
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

  // Tabs config (based on backend endpoints)
  const tabs = [
    { id: "general", label: t("event_management.tabs.general") },
    { id: "sessions", label: t("event_management.tabs.sessions") },
    { id: "tickets", label: t("event_management.tabs.tickets") },
    { id: "enrollments", label: t("event_management.tabs.enrollments") },
    { id: "speakers", label: t("event_management.tabs.speakers") },
  ];

  // Calcular estadísticas
  const totalStock = event?.tickets?.reduce((acc, t) => acc + t.stock, 0) || 0;
  const enrolledCount = event?.enrolledCount ?? 0;
  const occupancyPercent = totalStock > 0 ? Math.round((enrolledCount / totalStock) * 100) : 0;
  const ticketsCount = event?.tickets?.length ?? 0;
  const checkInsCount = 0; // TODO: obtener de la API

  // Calcular ingresos
  const totalRevenue = 10560; // TODO: obtener de la API

  // Stats cards config
  const statsCards: Array<{
    id: string;
    label: string;
    value: string;
    subValue: string;
    Icon: React.FC<DuotoneIconProps>;
    iconBg: string;
    iconPrimary: string;
    iconSecondary: string;
  }> = [
    {
      id: "enrolled",
      label: t("event_management.tickets.stats.enrolled"),
      value: enrolledCount.toString(),
      subValue: `de ${totalStock} (${occupancyPercent}%)`,
      Icon: IconUserGroup,
      iconBg: "var(--color-cyan-050)",
      iconPrimary: "var(--color-cyan-600)",
      iconSecondary: "var(--color-cyan-400)",
    },
    {
      id: "revenue",
      label: t("event_management.tickets.stats.revenue"),
      value: `S/ ${totalRevenue.toLocaleString()}`,
      subValue: "",
      Icon: IconWallet,
      iconBg: "var(--color-yellow-100)",
      iconPrimary: "var(--color-yellow-700)",
      iconSecondary: "var(--color-yellow-400)",
    },
    {
      id: "tickets",
      label: t("event_management.tickets.stats.tickets"),
      value: enrolledCount.toString(),
      subValue: "",
      Icon: IconTicket,
      iconBg: "var(--color-green-100)",
      iconPrimary: "var(--color-green-700)",
      iconSecondary: "var(--color-green-400)",
    },
    {
      id: "checkins",
      label: t("event_management.tickets.stats.checkins"),
      value: checkInsCount.toString(),
      subValue: `${occupancyPercent > 0 ? Math.round((checkInsCount / enrolledCount) * 100) : 0}%`,
      Icon: IconCheck,
      iconBg: "var(--color-grey-100)",
      iconPrimary: "var(--color-grey-600)",
      iconSecondary: "var(--color-grey-400)",
    },
  ];

  // Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "var(--space-6)",
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: "var(--space-6)",
  };

  const breadcrumbStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-grey-500)",
    marginBottom: "var(--space-3)",
  };

  const breadcrumbLinkStyle: React.CSSProperties = {
    color: "var(--color-grey-500)",
    textDecoration: "none",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
  };

  const breadcrumbCurrentStyle: React.CSSProperties = {
    color: "var(--color-grey-700)",
  };

  const headerRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "var(--space-4)",
  };

  const titleSectionStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  };

  const backButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "var(--color-bg-primary)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-lg)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xl)",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    margin: 0,
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--space-3)",
  };

  // Stats cards styles
  const statsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "var(--space-4)",
    marginBottom: "var(--space-6)",
  };

  const statCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    padding: "var(--space-4)",
    background: "var(--color-bg-primary)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-sm)",
  };

  const statIconWrapperStyle = (bg: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    background: bg,
    borderRadius: "var(--radius-lg)",
    flexShrink: 0,
  });

  const statContentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-grey-500)",
    margin: 0,
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xl)",
    fontWeight: 700,
    color: "var(--color-grey-900)",
    margin: 0,
    lineHeight: 1,
  };

  const statSubValueStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-grey-400)",
    margin: 0,
  };

  // Tabs styles
  const tabsContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--space-6)",
    borderBottom: "1px solid var(--color-border-light)",
    marginBottom: "var(--space-6)",
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "var(--space-3) 0",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: isActive ? "var(--color-primary)" : "var(--color-grey-500)",
    background: "none",
    border: "none",
    borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
    marginBottom: "-1px",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  });

  // Loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-grey-400)" strokeWidth="2" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-4)",
          background: "var(--color-red-050)",
          border: "1px solid var(--color-red-100)",
          borderRadius: "var(--radius-lg)",
        }}>
          <IconAlertCircle size={20} primary="var(--color-red-500)" secondary="var(--color-red-200)" />
          <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-red-700)" }}>
            {error || t("errors.unknown")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        {/* Breadcrumb */}
        <nav style={breadcrumbStyle}>
          <button style={breadcrumbLinkStyle} onClick={handleBack}>
            {t("event_management.breadcrumb.my_events")}
          </button>
          <IconChevronRight size={14} primary="var(--color-grey-400)" />
          <span style={breadcrumbCurrentStyle}>{t("event_management.breadcrumb.details")}</span>
        </nav>

        {/* Title Row */}
        <div style={headerRowStyle}>
          <div style={titleSectionStyle}>
            <h1 style={titleStyle}>{event.title}</h1>
          </div>

          <div style={actionsStyle}>
            <Button
              variant="secondary"
              size="md"
              icon={<IconShare size={16} primary="var(--color-grey-600)" secondary="var(--color-grey-400)" />}
            >
              {t("event_management.header.share")}
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<IconEdit size={16} primary="white" secondary="white" />}
              onClick={handleEdit}
            >
              {t("event_management.header.edit")}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={statsGridStyle}>
        {statsCards.map((stat) => (
          <div key={stat.id} style={statCardStyle}>
            <div style={statIconWrapperStyle(stat.iconBg)}>
              <stat.Icon size={22} primary={stat.iconPrimary} secondary={stat.iconSecondary} />
            </div>
            <div style={statContentStyle}>
              <p style={statLabelStyle}>{stat.label}</p>
              <p style={statValueStyle}>{stat.value}</p>
              {stat.subValue && (
                <p style={statSubValueStyle}>{stat.subValue}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <nav style={tabsContainerStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={tabStyle(activeTab === tab.id)}
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
      {activeTab === "sessions" && (
        <SessionsTab eventId={eventId} eventStartAt={event.startAt} eventEndAt={event.endAt} />
      )}
      {activeTab === "tickets" && (
        <TicketsTab eventId={eventId} />
      )}
      {activeTab === "enrollments" && (
        <PlaceholderTab
          title={t("event_management.tabs.enrollments")}
          description={t("event_management.placeholder.enrollments")}
        />
      )}
      {activeTab === "speakers" && (
        <PlaceholderTab
          title={t("event_management.tabs.speakers")}
          description={t("event_management.placeholder.speakers")}
        />
      )}
    </div>
  );
};
