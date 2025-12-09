import React from "react";
import { useTranslation } from "react-i18next";
import { QrCode } from "lucide-react";
import {
  IconCalendar,
  IconLocation,
  IconDownload,
} from "@/components/icons/DuotoneIcons";
import type { Event, EventStatus } from "@/types/event";

interface GeneralTabProps {
  event: Event;
  isAdmin?: boolean;
  onEdit?: () => void;
  onChangeStatus?: (status: EventStatus) => Promise<boolean>;
  publishing?: boolean;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  event,
}) => {
  const { t } = useTranslation();

  // Formateo de fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Calcular estadísticas
  const totalStock = event.tickets?.reduce((acc, t) => acc + t.stock, 0) || 0;
  const enrolledCount = event.enrolledCount ?? 0;
  const occupancyPercent = totalStock > 0 ? Math.round((enrolledCount / totalStock) * 100) : 0;
  const availableSpots = totalStock - enrolledCount;

  // Calcular ingresos (simulado)
  const totalRevenue = event.tickets?.reduce((acc, t) => {
    const price = typeof t.price === "string" ? parseFloat(t.price) : t.price;
    return acc + (price * 0); // 0 ventas por ahora
  }, 0) || 0;

  const getGoogleMapsUrl = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-6)",
  };

  const twoColumnStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "var(--space-6)",
  };

  const mainColumnStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-5)",
  };

  const sidebarStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
  };

  // Card base style (igual que EventCard en EventsView)
  const cardStyle: React.CSSProperties = {
    padding: "var(--space-5)",
    background: "var(--color-bg-primary)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-sm)",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-base)",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    margin: "0 0 var(--space-4) 0",
  };

  // Hero card style
  const heroCardStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: "var(--radius-xl)",
    overflow: "hidden",
    background: "var(--color-grey-100)",
    minHeight: "280px",
  };

  const heroImageStyle: React.CSSProperties = {
    width: "100%",
    height: "280px",
    objectFit: "cover",
  };

  const heroPlaceholderStyle: React.CSSProperties = {
    width: "100%",
    height: "280px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, var(--color-grey-100) 0%, var(--color-grey-200) 100%)",
  };

  const statusBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: "var(--space-4)",
    right: "var(--space-4)",
    padding: "6px 12px",
    fontSize: "var(--font-size-xs)",
    fontWeight: 500,
    borderRadius: "var(--radius-md)",
    background: event.status === "PUBLISHED" ? "var(--color-green-100)" :
                event.status === "DRAFT" ? "var(--color-red-050)" :
                event.status === "CANCELLED" ? "var(--color-grey-100)" :
                "var(--color-cyan-100)",
    color: event.status === "PUBLISHED" ? "var(--color-green-700)" :
           event.status === "DRAFT" ? "var(--color-red-600)" :
           event.status === "CANCELLED" ? "var(--color-grey-600)" :
           "var(--color-cyan-700)",
  };

  // Content below hero
  const heroContentStyle: React.CSSProperties = {
    padding: "var(--space-5)",
  };

  const typeBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    padding: "4px 12px",
    fontSize: "var(--font-size-xs)",
    fontWeight: 500,
    color: "var(--color-action)",
    background: "var(--color-cyan-050)",
    borderRadius: "var(--radius-md)",
    marginBottom: "var(--space-3)",
  };

  const heroTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xl)",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    margin: "0 0 var(--space-2) 0",
    lineHeight: "var(--line-height-tight)",
  };

  const heroDescriptionStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-grey-600)",
    margin: 0,
    lineHeight: "var(--line-height-normal)",
  };

  // Ocupación card
  const occupationCardStyle: React.CSSProperties = {
    ...cardStyle,
  };

  const occupationHeaderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--space-3)",
  };

  const occupationTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-base)",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    margin: 0,
  };

  const occupationStatsStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--space-3)",
  };

  const occupationCountStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-grey-700)",
  };

  const occupationPercentStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 600,
    color: occupancyPercent >= 80 ? "var(--color-warning-dark)" : "var(--color-action)",
  };

  const progressBarContainerStyle: React.CSSProperties = {
    width: "100%",
    height: "8px",
    background: "var(--color-grey-100)",
    borderRadius: "var(--radius-full)",
    overflow: "hidden",
    marginBottom: "var(--space-2)",
  };

  const progressBarStyle: React.CSSProperties = {
    height: "100%",
    width: `${occupancyPercent}%`,
    background: occupancyPercent >= 80 ? "var(--color-warning)" : "var(--color-warning)",
    borderRadius: "var(--radius-full)",
    transition: "width 0.3s ease",
  };

  const availableSpotsStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-grey-500)",
    margin: 0,
  };

  // Sidebar card
  const sidebarCardStyle: React.CSSProperties = {
    ...cardStyle,
  };

  // Date block style (colored block with day/month)
  const dateBlockStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "56px",
    padding: "var(--space-2) var(--space-3)",
    background: "var(--color-action)",
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
  };

  const dateDayStyle: React.CSSProperties = {
    fontSize: "var(--font-size-2xl)",
    fontWeight: 700,
    color: "white",
    lineHeight: 1,
  };

  const dateMonthStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    fontWeight: 600,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const dateInfoStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
  };

  const dateWeekdayStyle: React.CSSProperties = {
    fontSize: "var(--font-size-base)",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    textTransform: "capitalize",
    margin: 0,
  };

  const dateTimeStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-grey-600)",
    margin: 0,
  };

  // Location card styles
  const locationHeaderStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--space-3)",
  };

  const locationIconWrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    background: "var(--color-cyan-050)",
    borderRadius: "var(--radius-lg)",
    flexShrink: 0,
  };

  const locationDetailsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const locationNameStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 600,
    color: "var(--color-grey-900)",
    margin: 0,
  };

  const locationAddressStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-grey-500)",
    margin: 0,
  };

  // QR card
  const qrCardStyle: React.CSSProperties = {
    ...cardStyle,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const qrPlaceholderStyle: React.CSSProperties = {
    width: "140px",
    height: "140px",
    background: "var(--color-grey-050)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "var(--space-3)",
  };

  const downloadLinkStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: "var(--color-action)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  };

  return (
    <div style={containerStyle}>
      {/* Two Column Layout */}
      <div style={twoColumnStyle}>
        {/* Main Column */}
        <div style={mainColumnStyle}>
          {/* Hero Card */}
          <div style={heroCardStyle}>
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} style={heroImageStyle} loading="lazy" decoding="async" />
            ) : (
              <div style={heroPlaceholderStyle}>
                <IconCalendar size={48} primary="var(--color-grey-300)" secondary="var(--color-grey-200)" />
              </div>
            )}

            {/* Status Badge */}
            <span style={statusBadgeStyle}>
              {t(`event_management.general.status.${event.status}`)}
            </span>
          </div>

          {/* Content Card */}
          <div style={cardStyle}>
            {/* Type Badge */}
            {event.type && (
              <span style={typeBadgeStyle}>{event.type.name}</span>
            )}

            {/* Title */}
            <h2 style={heroTitleStyle}>{event.title}</h2>

            {/* Description */}
            {event.summary && (
              <p style={heroDescriptionStyle}>{event.summary}</p>
            )}
            {!event.summary && event.description && (
              <p style={heroDescriptionStyle}>
                {event.description.split('\n')[0]}
              </p>
            )}
          </div>

          {/* Ocupación Card */}
          <div style={occupationCardStyle}>
            <div style={occupationHeaderStyle}>
              <h3 style={occupationTitleStyle}>{t("event_management.general.occupation")}</h3>
            </div>

            <div style={occupationStatsStyle}>
              <span style={occupationCountStyle}>
                {enrolledCount} de {totalStock}
              </span>
              <span style={occupationPercentStyle}>{occupancyPercent}%</span>
            </div>

            <div style={progressBarContainerStyle}>
              <div style={progressBarStyle} />
            </div>

            <p style={availableSpotsStyle}>
              {t("event_management.general.available_spots", { count: availableSpots })}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div style={sidebarStyle}>
          {/* Fecha y Hora */}
          <div style={sidebarCardStyle}>
            <h3 style={cardTitleStyle}>{t("event_management.general.date_time")}</h3>
            <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
              <div style={dateBlockStyle}>
                <span style={dateDayStyle}>{new Date(event.startAt).getDate()}</span>
                <span style={dateMonthStyle}>
                  {new Date(event.startAt).toLocaleDateString("es-PE", { month: "short" }).toUpperCase()}
                </span>
              </div>
              <div style={dateInfoStyle}>
                <p style={dateWeekdayStyle}>
                  {new Date(event.startAt).toLocaleDateString("es-PE", { weekday: "long" })}
                </p>
                <p style={dateTimeStyle}>
                  {formatTime(event.startAt)} - {formatTime(event.endAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          {event.location && (
            <div style={sidebarCardStyle}>
              <h3 style={cardTitleStyle}>{t("event_management.general.location")}</h3>
              <div style={locationHeaderStyle}>
                <div style={locationIconWrapperStyle}>
                  <IconLocation size={22} primary="var(--color-cyan-600)" secondary="var(--color-cyan-200)" />
                </div>
                <div style={locationDetailsStyle}>
                  <p style={locationNameStyle}>
                    {event.location.name || event.location.address}
                  </p>
                  <p style={locationAddressStyle}>
                    {event.location.name ? event.location.address : event.location.city}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Código QR */}
          <div style={qrCardStyle}>
            <h3 style={{ ...cardTitleStyle, alignSelf: "flex-start" }}>{t("event_management.general.qr_code")}</h3>
            <div style={qrPlaceholderStyle}>
              <QrCode size={64} color="var(--color-grey-400)" />
            </div>
            <button style={downloadLinkStyle}>
              <IconDownload size={16} primary="var(--color-action)" secondary="var(--color-action-light)" />
              {t("event_management.general.download_qr")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
