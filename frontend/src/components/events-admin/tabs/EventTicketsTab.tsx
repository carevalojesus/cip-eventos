/**
 * EventTicketsTab Component
 *
 * Tab de gestión de tipos de entrada del evento.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Ticket,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react";
import { Alert } from "@/components/ui/rui";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { Event, EventTicket } from "@/types/event";

interface EventTicketsTabProps {
  event: Event;
}

export const EventTicketsTab: React.FC<EventTicketsTabProps> = ({ event }) => {
  const { t } = useTranslation();
  const tickets = event.tickets || [];

  const formatPrice = (price: number) => {
    if (price === 0) return t("events.tickets.free", "Gratis");
    return `S/ ${price.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStockStatus = (ticket: EventTicket) => {
    const percentage = (ticket.stock / 100) * 100; // Assuming 100 is initial
    if (ticket.stock === 0) return { label: t("events.tickets.sold_out", "Agotado"), color: "var(--color-red-600)" };
    if (percentage < 20) return { label: t("events.tickets.low_stock", "Pocos"), color: "var(--color-yellow-600)" };
    return { label: t("events.tickets.available", "Disponible"), color: "var(--color-green-600)" };
  };

  return (
    <div className="event-tickets-tab">
      <Alert variant="info" title={t("events.tickets.info_title", "Tipos de Entrada")}>
        {t(
          "events.tickets.info_desc",
          "Configura los tipos de entrada disponibles para tu evento. Puedes crear entradas gratuitas, de pago, con validación CIP, etc."
        )}
      </Alert>

      <Section>
        <Section.Header
          icon={<Ticket size={18} weight="duotone" />}
          iconVariant="primary"
          title={t("events.tickets.title", "Entradas Configuradas")}
          subtitle={t("events.tickets.subtitle", "{{count}} tipos de entrada", {
            count: tickets.length,
          })}
          action={
            <Button variant="primary" size="sm">
              <Plus size={16} />
              {t("events.tickets.add", "Crear Entrada")}
            </Button>
          }
        />
        <Section.Content>
          {tickets.length === 0 ? (
            <div
              style={{
                padding: "var(--space-8)",
                textAlign: "center",
                color: "var(--color-text-muted)",
              }}
            >
              <Ticket size={48} style={{ marginBottom: "var(--space-3)" }} />
              <p style={{ margin: 0 }}>
                {t("events.tickets.empty", "No hay tipos de entrada configurados.")}
              </p>
            </div>
          ) : (
            <div className="tickets-grid">
              {tickets.map((ticket) => {
                const stockStatus = getStockStatus(ticket);
                return (
                  <div
                    key={ticket.id}
                    className={`ticket-card ${!ticket.isActive ? "ticket-card--inactive" : ""}`}
                  >
                    <div className="ticket-card__header">
                      <div className="ticket-card__title-row">
                        <h4 className="ticket-card__title">{ticket.name}</h4>
                        {!ticket.isVisible && (
                          <span className="ticket-card__hidden-badge">
                            <EyeSlash size={12} />
                            {t("events.tickets.hidden", "Oculto")}
                          </span>
                        )}
                      </div>
                      <span className="ticket-card__price">{formatPrice(ticket.price)}</span>
                    </div>

                    {ticket.description && (
                      <p className="ticket-card__description">{ticket.description}</p>
                    )}

                    <div className="ticket-card__details">
                      <div className="ticket-card__detail">
                        <span className="ticket-card__detail-label">
                          {t("events.tickets.stock", "Stock")}
                        </span>
                        <span
                          className="ticket-card__detail-value"
                          style={{ color: stockStatus.color }}
                        >
                          {ticket.stock} ({stockStatus.label})
                        </span>
                      </div>

                      <div className="ticket-card__detail">
                        <span className="ticket-card__detail-label">
                          {t("events.tickets.max_per_order", "Máx. por pedido")}
                        </span>
                        <span className="ticket-card__detail-value">
                          {ticket.maxPerOrder}
                        </span>
                      </div>

                      <div className="ticket-card__detail">
                        <span className="ticket-card__detail-label">
                          {t("events.tickets.sales_period", "Período de venta")}
                        </span>
                        <span className="ticket-card__detail-value">
                          {formatDate(ticket.salesStartAt)} - {formatDate(ticket.salesEndAt)}
                        </span>
                      </div>

                      {ticket.requiresCipValidation && (
                        <div className="ticket-card__badge ticket-card__badge--cip">
                          <CheckCircle size={14} />
                          {t("events.tickets.requires_cip", "Requiere CIP")}
                        </div>
                      )}
                    </div>

                    <div className="ticket-card__actions">
                      <Button variant="ghost" size="sm">
                        <PencilSimple size={16} />
                        {t("common.edit", "Editar")}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash size={16} />
                        {t("common.delete", "Eliminar")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section.Content>
      </Section>

      <style>{`
        .tickets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-4);
        }

        .ticket-card {
          padding: var(--space-4);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-grey-200);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .ticket-card:hover {
          border-color: var(--color-grey-300);
          box-shadow: var(--shadow-sm);
        }

        .ticket-card--inactive {
          opacity: 0.6;
          background-color: var(--color-grey-050);
        }

        .ticket-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .ticket-card__title-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .ticket-card__title {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .ticket-card__hidden-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: 2px var(--space-2);
          font-size: 10px;
          font-weight: 500;
          color: var(--color-grey-600);
          background-color: var(--color-grey-100);
          border-radius: var(--radius-full);
        }

        .ticket-card__price {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--color-primary);
          white-space: nowrap;
        }

        .ticket-card__description {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin: 0 0 var(--space-3) 0;
          line-height: 1.5;
        }

        .ticket-card__details {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding: var(--space-3);
          background-color: var(--color-grey-050);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-3);
        }

        .ticket-card__detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-2);
        }

        .ticket-card__detail-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .ticket-card__detail-value {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .ticket-card__badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-2);
          font-size: var(--font-size-xs);
          font-weight: 500;
          border-radius: var(--radius-md);
          margin-top: var(--space-2);
        }

        .ticket-card__badge--cip {
          background-color: var(--color-cyan-100);
          color: var(--color-cyan-700);
        }

        .ticket-card__actions {
          display: flex;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-grey-100);
        }
      `}</style>
    </div>
  );
};

export default EventTicketsTab;
