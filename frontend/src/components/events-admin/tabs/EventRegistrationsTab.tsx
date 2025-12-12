/**
 * EventRegistrationsTab Component
 *
 * Tab de gestión de inscripciones del evento.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  MagnifyingGlass,
  Export,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
} from "@phosphor-icons/react";
import { Alert } from "@/components/ui/rui";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Event } from "@/types/event";

interface EventRegistrationsTabProps {
  event: Event;
}

// Mock data para demostración
const mockRegistrations = [
  {
    id: "1",
    attendeeName: "Juan Pérez García",
    attendeeEmail: "juan.perez@email.com",
    ticketName: "General",
    status: "CONFIRMED",
    attended: true,
    finalPrice: 150,
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    attendeeName: "María López Castro",
    attendeeEmail: "maria.lopez@email.com",
    ticketName: "Colegiado CIP",
    status: "CONFIRMED",
    attended: false,
    finalPrice: 100,
    createdAt: "2024-01-16T14:20:00Z",
  },
  {
    id: "3",
    attendeeName: "Carlos Rodríguez",
    attendeeEmail: "carlos.r@email.com",
    ticketName: "General",
    status: "PENDING",
    attended: false,
    finalPrice: 150,
    createdAt: "2024-01-17T09:15:00Z",
  },
];

export const EventRegistrationsTab: React.FC<EventRegistrationsTabProps> = ({
  event,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const registrations = mockRegistrations; // TODO: Replace with real data

  // Stats
  const totalRegistrations = registrations.length;
  const confirmedCount = registrations.filter((r) => r.status === "CONFIRMED").length;
  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;
  const attendedCount = registrations.filter((r) => r.attended).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return {
          icon: <CheckCircle size={14} />,
          label: t("registrations.status.confirmed", "Confirmado"),
          style: {
            backgroundColor: "var(--color-green-100)",
            color: "var(--color-green-700)",
          },
        };
      case "PENDING":
        return {
          icon: <Clock size={14} />,
          label: t("registrations.status.pending", "Pendiente"),
          style: {
            backgroundColor: "var(--color-yellow-100)",
            color: "var(--color-yellow-700)",
          },
        };
      case "CANCELLED":
        return {
          icon: <XCircle size={14} />,
          label: t("registrations.status.cancelled", "Cancelado"),
          style: {
            backgroundColor: "var(--color-red-100)",
            color: "var(--color-red-700)",
          },
        };
      default:
        return {
          icon: null,
          label: status,
          style: {
            backgroundColor: "var(--color-grey-100)",
            color: "var(--color-grey-700)",
          },
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return t("events.tickets.free", "Gratis");
    return `S/ ${price.toFixed(2)}`;
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      reg.attendeeName.toLowerCase().includes(query) ||
      reg.attendeeEmail.toLowerCase().includes(query)
    );
  });

  return (
    <div className="event-registrations-tab">
      {/* Stats Cards */}
      <div className="registrations-stats">
        <div className="registrations-stat">
          <div className="registrations-stat__icon" style={{ backgroundColor: "var(--color-cyan-100)", color: "var(--color-cyan-600)" }}>
            <Users size={20} />
          </div>
          <div className="registrations-stat__content">
            <span className="registrations-stat__value">{totalRegistrations}</span>
            <span className="registrations-stat__label">
              {t("registrations.stats.total", "Total Inscritos")}
            </span>
          </div>
        </div>

        <div className="registrations-stat">
          <div className="registrations-stat__icon" style={{ backgroundColor: "var(--color-green-100)", color: "var(--color-green-600)" }}>
            <CheckCircle size={20} />
          </div>
          <div className="registrations-stat__content">
            <span className="registrations-stat__value">{confirmedCount}</span>
            <span className="registrations-stat__label">
              {t("registrations.stats.confirmed", "Confirmados")}
            </span>
          </div>
        </div>

        <div className="registrations-stat">
          <div className="registrations-stat__icon" style={{ backgroundColor: "var(--color-yellow-100)", color: "var(--color-yellow-600)" }}>
            <Clock size={20} />
          </div>
          <div className="registrations-stat__content">
            <span className="registrations-stat__value">{pendingCount}</span>
            <span className="registrations-stat__label">
              {t("registrations.stats.pending", "Pendientes")}
            </span>
          </div>
        </div>

        <div className="registrations-stat">
          <div className="registrations-stat__icon" style={{ backgroundColor: "var(--color-red-100)", color: "var(--color-red-600)" }}>
            <UserCheck size={20} />
          </div>
          <div className="registrations-stat__content">
            <span className="registrations-stat__value">{attendedCount}</span>
            <span className="registrations-stat__label">
              {t("registrations.stats.attended", "Asistieron")}
            </span>
          </div>
        </div>
      </div>

      <Section>
        <Section.Header
          icon={<Users size={18} weight="duotone" />}
          iconVariant="primary"
          title={t("registrations.title", "Lista de Inscripciones")}
          subtitle={t("registrations.subtitle", "Gestiona las inscripciones del evento")}
        />
        <Section.Content>
          {/* Filters */}
          <div className="registrations-filters">
            <div className="registrations-filters__search">
              <Input
                placeholder={t("registrations.search", "Buscar por nombre o email...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<MagnifyingGlass size={18} />}
              />
            </div>
            <Button variant="secondary" size="md">
              <Export size={18} />
              {t("registrations.export", "Exportar")}
            </Button>
          </div>

          {/* Table */}
          <div className="registrations-table-container">
            <table className="registrations-table">
              <thead>
                <tr>
                  <th>{t("registrations.table.attendee", "Asistente")}</th>
                  <th>{t("registrations.table.ticket", "Entrada")}</th>
                  <th>{t("registrations.table.price", "Precio")}</th>
                  <th>{t("registrations.table.status", "Estado")}</th>
                  <th>{t("registrations.table.attended", "Asistió")}</th>
                  <th>{t("registrations.table.date", "Fecha")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const statusBadge = getStatusBadge(reg.status);
                  return (
                    <tr key={reg.id}>
                      <td>
                        <div className="registrations-attendee">
                          <span className="registrations-attendee__name">
                            {reg.attendeeName}
                          </span>
                          <span className="registrations-attendee__email">
                            {reg.attendeeEmail}
                          </span>
                        </div>
                      </td>
                      <td>{reg.ticketName}</td>
                      <td>{formatPrice(reg.finalPrice)}</td>
                      <td>
                        <span className="registrations-status-badge" style={statusBadge.style}>
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </td>
                      <td>
                        {reg.attended ? (
                          <CheckCircle size={18} color="var(--color-green-500)" weight="fill" />
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>-</span>
                        )}
                      </td>
                      <td>{formatDate(reg.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section.Content>
      </Section>

      <style>{`
        .registrations-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .registrations-stat {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-grey-200);
          border-radius: var(--radius-lg);
        }

        .registrations-stat__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .registrations-stat__content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .registrations-stat__value {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .registrations-stat__label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .registrations-filters {
          display: flex;
          justify-content: space-between;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .registrations-filters__search {
          flex: 1;
          max-width: 400px;
        }

        .registrations-table-container {
          overflow-x: auto;
          border: 1px solid var(--color-grey-200);
          border-radius: var(--radius-md);
        }

        .registrations-table {
          width: 100%;
          border-collapse: collapse;
        }

        .registrations-table th {
          padding: var(--space-3) var(--space-4);
          text-align: left;
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: var(--color-grey-050);
          border-bottom: 1px solid var(--color-grey-200);
        }

        .registrations-table td {
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          border-bottom: 1px solid var(--color-grey-100);
        }

        .registrations-table tr:last-child td {
          border-bottom: none;
        }

        .registrations-attendee {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .registrations-attendee__name {
          font-weight: 500;
        }

        .registrations-attendee__email {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .registrations-status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-2);
          font-size: var(--font-size-xs);
          font-weight: 500;
          border-radius: var(--radius-full);
        }

        @media (max-width: 1024px) {
          .registrations-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .registrations-stats {
            grid-template-columns: 1fr;
          }

          .registrations-filters {
            flex-direction: column;
          }

          .registrations-filters__search {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default EventRegistrationsTab;
