import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Event, EventStatus } from "@/types/event";
import { IconCalendar, IconLocation, IconClock } from "@/components/icons/DuotoneIcons";
import { getCurrentLocale } from "@/lib/routes";

interface EventCardProps {
  event: Event;
  onManage: () => void;
}

// Status badge config
const statusConfig: Record<EventStatus, {
  bg: string;
  text: string;
  dot: string;
}> = {
  PUBLISHED: {
    bg: 'var(--color-green-050)',
    text: 'var(--color-green-700)',
    dot: 'var(--color-green-500)',
  },
  DRAFT: {
    bg: 'var(--color-grey-100)',
    text: 'var(--color-grey-600)',
    dot: 'var(--color-grey-400)',
  },
  COMPLETED: {
    bg: 'var(--color-cyan-050)',
    text: 'var(--color-cyan-700)',
    dot: 'var(--color-cyan-500)',
  },
  CANCELLED: {
    bg: 'var(--color-red-050)',
    text: 'var(--color-red-700)',
    dot: 'var(--color-red-500)',
  },
};

export const EventCard: React.FC<EventCardProps> = ({ event, onManage }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const status = statusConfig[event.status] || statusConfig.DRAFT;

  const locale = getCurrentLocale() === "es" ? "es-PE" : "en-US";

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getLocationText = () => {
    if (event.location?.name) {
      return event.location.city
        ? `${event.location.name}, ${event.location.city}`
        : event.location.name;
    }
    if (event.virtualAccess || event.modality?.name?.toLowerCase().includes("virtual")) {
      return t("dashboard.events_view.modality.virtual", "Virtual");
    }
    if (event.modality?.name?.toLowerCase().includes("híbrido") || event.modality?.name?.toLowerCase().includes("hybrid")) {
      return t("dashboard.events_view.modality.hybrid", "Híbrido");
    }
    return "—";
  };

  // Styles
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border-light)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    cursor: 'pointer',
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%', // 16:9 ratio
    backgroundColor: 'var(--color-grey-100)',
    overflow: 'hidden',
  };

  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const imagePlaceholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyle: React.CSSProperties = {
    padding: 'var(--space-4) var(--space-5) var(--space-5)',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: 'var(--space-1) 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 500,
    backgroundColor: status.bg,
    color: status.text,
    marginBottom: 'var(--space-3)',
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: status.dot,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-base)',
    fontWeight: 600,
    color: 'var(--color-grey-900)',
    margin: '0 0 var(--space-3) 0',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const metaContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: 'var(--space-4)',
  };

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-grey-500)',
  };

  const metaIconStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 'var(--space-3)',
    borderTop: '1px solid var(--color-grey-100)',
  };

  const enrolledStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-grey-500)',
  };

  const enrolledCountStyle: React.CSSProperties = {
    fontWeight: 600,
    color: 'var(--color-grey-700)',
  };

  // Tertiary action: styled as link (Refactoring UI)
  const linkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    color: '#BA2525',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'color 150ms ease',
  };

  const enrolledCount = event.enrolledCount ?? 0;

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onManage}
    >
      {/* Image */}
      <div style={imageContainerStyle}>
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            style={imageStyle}
          />
        ) : (
          <div style={imagePlaceholderStyle}>
            <IconCalendar
              size={48}
              primary="var(--color-grey-300)"
              secondary="var(--color-grey-200)"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Status Badge */}
        <div style={badgeStyle}>
          <span style={dotStyle} />
          {t(`dashboard.events_view.status.${event.status}`)}
        </div>

        {/* Title */}
        <h3 style={titleStyle}>{event.title}</h3>

        {/* Meta info */}
        <div style={metaContainerStyle}>
          <div style={metaRowStyle}>
            <span style={metaIconStyle}>
              <IconClock size={16} primary="var(--color-grey-500)" secondary="var(--color-grey-300)" />
            </span>
            <span>{formatDate(event.startAt)} · {formatTime(event.startAt)}</span>
          </div>
          <div style={metaRowStyle}>
            <span style={metaIconStyle}>
              <IconLocation size={16} primary="var(--color-grey-500)" secondary="var(--color-grey-300)" />
            </span>
            <span>{getLocationText()}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <span style={enrolledStyle}>
            <span style={enrolledCountStyle}>{enrolledCount}</span> {t("dashboard.events_view.table.enrolled_label", "inscritos")}
          </span>
          <button
            style={linkStyle}
            onClick={(e) => {
              e.stopPropagation();
              onManage();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#911111';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#BA2525';
            }}
          >
            {t("dashboard.events_view.actions.view", "Ver detalles")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
