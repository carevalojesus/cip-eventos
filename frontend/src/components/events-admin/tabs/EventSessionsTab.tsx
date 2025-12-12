/**
 * EventSessionsTab Component
 *
 * Tab de gestión de sesiones del evento.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarBlank,
  Plus,
  PencilSimple,
  Trash,
  VideoCamera,
  MapPin,
  Users,
} from "@phosphor-icons/react";
import { Alert } from "@/components/ui/rui";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { Event, EventSession } from "@/types/event";

interface EventSessionsTabProps {
  event: Event;
}

export const EventSessionsTab: React.FC<EventSessionsTabProps> = ({ event }) => {
  const { t } = useTranslation();
  const sessions = event.sessions || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Agrupar sesiones por día
  const sessionsByDay = sessions.reduce((acc, session) => {
    const day = formatDate(session.startAt);
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(session);
    return acc;
  }, {} as Record<string, EventSession[]>);

  const sortedDays = Object.keys(sessionsByDay).sort((a, b) => {
    const dateA = new Date(sessionsByDay[a][0].startAt);
    const dateB = new Date(sessionsByDay[b][0].startAt);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="event-sessions-tab">
      <Alert variant="info" title={t("events.sessions.info_title", "Gestión de Sesiones")}>
        {t(
          "events.sessions.info_desc",
          "Configura las sesiones de tu evento. Cada sesión puede tener ponentes asignados y un lugar o enlace virtual específico."
        )}
      </Alert>

      <Section>
        <Section.Header
          icon={<CalendarBlank size={18} weight="duotone" />}
          iconVariant="info"
          title={t("events.sessions.title", "Sesiones del Evento")}
          subtitle={t("events.sessions.subtitle", "{{count}} sesiones configuradas", {
            count: sessions.length,
          })}
          action={
            <Button variant="primary" size="sm">
              <Plus size={16} />
              {t("events.sessions.add", "Agregar Sesión")}
            </Button>
          }
        />
        <Section.Content>
          {sessions.length === 0 ? (
            <div
              style={{
                padding: "var(--space-8)",
                textAlign: "center",
                color: "var(--color-text-muted)",
              }}
            >
              <CalendarBlank size={48} style={{ marginBottom: "var(--space-3)" }} />
              <p style={{ margin: 0 }}>
                {t("events.sessions.empty", "No hay sesiones configuradas.")}
              </p>
            </div>
          ) : (
            <div className="sessions-timeline">
              {sortedDays.map((day) => (
                <div key={day} className="sessions-day">
                  <div className="sessions-day__header">
                    <CalendarBlank size={16} />
                    <span>{day}</span>
                  </div>
                  <div className="sessions-day__list">
                    {sessionsByDay[day]
                      .sort(
                        (a, b) =>
                          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
                      )
                      .map((session) => (
                        <div key={session.id} className="session-card">
                          <div className="session-card__time">
                            <span className="session-card__time-start">
                              {formatTime(session.startAt)}
                            </span>
                            <span className="session-card__time-separator">-</span>
                            <span className="session-card__time-end">
                              {formatTime(session.endAt)}
                            </span>
                          </div>
                          <div className="session-card__content">
                            <h4 className="session-card__title">{session.title}</h4>
                            {session.description && (
                              <p className="session-card__description">
                                {session.description}
                              </p>
                            )}
                            <div className="session-card__meta">
                              {session.room && (
                                <span className="session-card__meta-item">
                                  <MapPin size={14} />
                                  {session.room}
                                </span>
                              )}
                              {session.meetingUrl && (
                                <span className="session-card__meta-item">
                                  <VideoCamera size={14} />
                                  {t("events.sessions.virtual", "Virtual")}
                                </span>
                              )}
                              {session.speakers && session.speakers.length > 0 && (
                                <span className="session-card__meta-item">
                                  <Users size={14} />
                                  {session.speakers.length}{" "}
                                  {t("events.sessions.speakers", "ponentes")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="session-card__actions">
                            <Button variant="ghost" size="sm">
                              <PencilSimple size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      <style>{`
        .sessions-timeline {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .sessions-day__header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--space-3);
          padding-bottom: var(--space-2);
          border-bottom: 1px solid var(--color-grey-200);
        }

        .sessions-day__list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .session-card {
          display: flex;
          gap: var(--space-4);
          padding: var(--space-4);
          background-color: var(--color-grey-050);
          border-radius: var(--radius-md);
          transition: background-color var(--transition-fast);
        }

        .session-card:hover {
          background-color: var(--color-grey-100);
        }

        .session-card__time {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          min-width: 60px;
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .session-card__time-start {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .session-card__time-separator {
          font-size: var(--font-size-xs);
        }

        .session-card__content {
          flex: 1;
          min-width: 0;
        }

        .session-card__title {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-1) 0;
        }

        .session-card__description {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin: 0 0 var(--space-2) 0;
          line-height: 1.5;
        }

        .session-card__meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-3);
        }

        .session-card__meta-item {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .session-card__actions {
          display: flex;
          gap: var(--space-1);
          align-items: flex-start;
        }
      `}</style>
    </div>
  );
};

export default EventSessionsTab;
