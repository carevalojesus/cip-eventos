import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Event } from "@/types/event";
import { IconCalendar, IconLocation, IconClock } from "@/components/icons/DuotoneIcons";
import { getCurrentLocale } from "@/lib/routes";
import { formatEventDate, formatEventTime, getLocaleFromLang } from "@/lib/dateUtils";
import { getEventStatusStyle } from "@/lib/statusConfig";
import { spacing, radius, fontSize, shadows, transition, semanticColors, colors } from "@/lib/styleTokens";

interface EventCardProps {
  event: Event;
  onManage: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onManage }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const status = getEventStatusStyle(event.status);
  const locale = getLocaleFromLang(getCurrentLocale());

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

  // Styles using design tokens
  const cardStyle: React.CSSProperties = {
    backgroundColor: semanticColors.bgPrimary,
    borderRadius: radius.xl,
    border: `1px solid ${semanticColors.borderLight}`,
    overflow: 'hidden',
    transition: `box-shadow ${transition.fast}, transform ${transition.fast}`,
    boxShadow: isHovered ? shadows.md : shadows.sm,
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    cursor: 'pointer',
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%', // 16:9 ratio
    backgroundColor: colors.grey[100],
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
    padding: `${spacing.lg} ${spacing.xl} ${spacing.xl}`,
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} 10px`,
    borderRadius: radius.full,
    fontSize: fontSize.xs,
    fontWeight: 500,
    backgroundColor: status.bgLight || status.bg,
    color: status.text,
    marginBottom: spacing.md,
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: status.dot,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: fontSize.base,
    fontWeight: 600,
    color: semanticColors.textPrimary,
    margin: `0 0 ${spacing.md} 0`,
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const metaContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  };

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: fontSize.sm,
    color: semanticColors.textMuted,
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
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.grey[100]}`,
  };

  const enrolledStyle: React.CSSProperties = {
    fontSize: fontSize.sm,
    color: semanticColors.textMuted,
  };

  const enrolledCountStyle: React.CSSProperties = {
    fontWeight: 600,
    color: semanticColors.textSecondary,
  };

  // Tertiary action: styled as link (Refactoring UI)
  const linkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: 500,
    color: semanticColors.action,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: `color ${transition.fast}`,
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
              <IconClock size={16} primary={colors.grey[500]} secondary={colors.grey[300]} />
            </span>
            <span>{formatEventDate(event.startAt, locale)} · {formatEventTime(event.startAt, locale)}</span>
          </div>
          <div style={metaRowStyle}>
            <span style={metaIconStyle}>
              <IconLocation size={16} primary={colors.grey[500]} secondary={colors.grey[300]} />
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
              e.currentTarget.style.color = semanticColors.actionDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = semanticColors.action;
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
