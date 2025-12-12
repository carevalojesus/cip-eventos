/**
 * EventCourtesiesTab Component
 *
 * Tab de gestión de cortesías/entradas gratuitas del evento.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Gift,
  Plus,
  PaperPlaneTilt,
  Trash,
  CheckCircle,
  Clock,
  Envelope,
} from "@phosphor-icons/react";
import { Alert } from "@/components/ui/rui";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types/event";

interface EventCourtesy {
  id: string;
  recipientName: string;
  recipientEmail: string;
  ticketType: string;
  reason: string;
  status: "pending" | "sent" | "used";
  createdAt: string;
}

interface EventCourtesiesTabProps {
  event: Event;
}

export const EventCourtesiesTab: React.FC<EventCourtesiesTabProps> = ({
  event,
}) => {
  const { t } = useTranslation();

  // Mock data - Replace with event.courtesies when available
  const courtesies: EventCourtesy[] = [
    {
      id: "1",
      recipientName: "Juan Pérez García",
      recipientEmail: "juan.perez@example.com",
      ticketType: "Entrada General",
      reason: "Ponente invitado",
      status: "sent",
      createdAt: "2025-12-10T10:30:00Z",
    },
    {
      id: "2",
      recipientName: "María López Rodríguez",
      recipientEmail: "maria.lopez@example.com",
      ticketType: "Entrada VIP",
      reason: "Colaborador del evento",
      status: "used",
      createdAt: "2025-12-09T14:20:00Z",
    },
    {
      id: "3",
      recipientName: "Carlos Sánchez Díaz",
      recipientEmail: "carlos.sanchez@example.com",
      ticketType: "Entrada General",
      reason: "Patrocinador",
      status: "pending",
      createdAt: "2025-12-11T09:15:00Z",
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: EventCourtesy["status"]) => {
    switch (status) {
      case "pending":
        return {
          label: t("events.courtesies.status.pending", "Pendiente"),
          color: "var(--color-yellow-600)",
          bgColor: "var(--color-yellow-100)",
          icon: <Clock size={14} />,
        };
      case "sent":
        return {
          label: t("events.courtesies.status.sent", "Enviado"),
          color: "var(--color-cyan-600)",
          bgColor: "var(--color-cyan-100)",
          icon: <Envelope size={14} />,
        };
      case "used":
        return {
          label: t("events.courtesies.status.used", "Usado"),
          color: "var(--color-green-600)",
          bgColor: "var(--color-green-100)",
          icon: <CheckCircle size={14} />,
        };
    }
  };

  return (
    <div className="event-courtesies-tab">
      <Alert variant="info" title={t("events.courtesies.info_title", "Cortesías")}>
        {t(
          "events.courtesies.info_desc",
          "Las cortesías son entradas gratuitas asignadas a personas específicas. Puedes crear cortesías para ponentes, patrocinadores, colaboradores, etc."
        )}
      </Alert>

      <Section>
        <Section.Header
          icon={<Gift size={18} weight="duotone" />}
          iconVariant="primary"
          title={t("events.courtesies.title", "Cortesías Asignadas")}
          subtitle={t("events.courtesies.subtitle", "{{count}} cortesías", {
            count: courtesies.length,
          })}
          action={
            <Button variant="primary" size="sm">
              <Plus size={16} />
              {t("events.courtesies.add", "Crear Cortesía")}
            </Button>
          }
        />
        <Section.Content>
          {courtesies.length === 0 ? (
            <div
              style={{
                padding: "var(--space-8)",
                textAlign: "center",
                color: "var(--color-text-muted)",
              }}
            >
              <Gift size={48} style={{ marginBottom: "var(--space-3)" }} />
              <p style={{ margin: 0 }}>
                {t("events.courtesies.empty", "No hay cortesías asignadas.")}
              </p>
            </div>
          ) : (
            <div className="courtesies-table">
              <table>
                <thead>
                  <tr>
                    <th>{t("events.courtesies.table.recipient", "Beneficiario")}</th>
                    <th>{t("events.courtesies.table.email", "Email")}</th>
                    <th>{t("events.courtesies.table.ticket_type", "Tipo de Entrada")}</th>
                    <th>{t("events.courtesies.table.reason", "Motivo")}</th>
                    <th>{t("events.courtesies.table.status", "Estado")}</th>
                    <th>{t("events.courtesies.table.created_at", "Creado")}</th>
                    <th>{t("events.courtesies.table.actions", "Acciones")}</th>
                  </tr>
                </thead>
                <tbody>
                  {courtesies.map((courtesy) => {
                    const statusBadge = getStatusBadge(courtesy.status);
                    return (
                      <tr key={courtesy.id}>
                        <td>
                          <div className="recipient-cell">
                            <span className="recipient-name">
                              {courtesy.recipientName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="email-cell">{courtesy.recipientEmail}</span>
                        </td>
                        <td>
                          <span className="ticket-type-cell">
                            {courtesy.ticketType}
                          </span>
                        </td>
                        <td>
                          <span className="reason-cell">{courtesy.reason}</span>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              color: statusBadge.color,
                              backgroundColor: statusBadge.bgColor,
                            }}
                          >
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        </td>
                        <td>
                          <span className="date-cell">
                            {formatDate(courtesy.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            {(courtesy.status === "pending" ||
                              courtesy.status === "sent") && (
                              <Button variant="ghost" size="sm" title={t("events.courtesies.resend", "Reenviar email")}>
                                <PaperPlaneTilt size={16} />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" title={t("events.courtesies.delete", "Eliminar")}>
                              <Trash size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section.Content>
      </Section>

      <style>{`
        .courtesies-table {
          width: 100%;
          overflow-x: auto;
        }

        .courtesies-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .courtesies-table thead {
          background-color: var(--color-grey-050);
        }

        .courtesies-table th {
          padding: var(--space-3) var(--space-4);
          text-align: left;
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--color-grey-200);
        }

        .courtesies-table td {
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--color-grey-100);
          font-size: var(--font-size-sm);
        }

        .courtesies-table tbody tr {
          transition: background-color var(--transition-fast);
        }

        .courtesies-table tbody tr:hover {
          background-color: var(--color-grey-050);
        }

        .recipient-cell {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .recipient-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .email-cell {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .ticket-type-cell {
          color: var(--color-text-primary);
          font-weight: 500;
        }

        .reason-cell {
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-2);
          font-size: var(--font-size-xs);
          font-weight: 500;
          border-radius: var(--radius-md);
          white-space: nowrap;
        }

        .date-cell {
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          white-space: nowrap;
        }

        .actions-cell {
          display: flex;
          gap: var(--space-1);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .courtesies-table {
            display: block;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .courtesies-table table {
            min-width: 800px;
          }
        }
      `}</style>
    </div>
  );
};

export default EventCourtesiesTab;
