/**
 * EventCouponsTab Component
 *
 * Tab de gestión de cupones de descuento del evento.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Tag,
  Plus,
  PencilSimple,
  Trash,
  Percent,
  CurrencyCircleDollar,
  CalendarBlank,
  CheckCircle,
  XCircle,
  Clock,
} from "@phosphor-icons/react";
import { Alert } from "@/components/ui/rui";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types/event";

interface EventCoupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

interface EventCouponsTabProps {
  event: Event;
}

export const EventCouponsTab: React.FC<EventCouponsTabProps> = ({ event }) => {
  const { t } = useTranslation();

  // Mock data - en producción esto vendría de event.coupons
  const mockCoupons: EventCoupon[] = [
    {
      id: "1",
      code: "EARLYBIRD",
      discountType: "percentage",
      discountValue: 20,
      maxUses: 50,
      currentUses: 12,
      validFrom: "2025-01-01T00:00:00",
      validUntil: "2025-01-15T23:59:59",
      isActive: true,
    },
    {
      id: "2",
      code: "CIPSPECIAL",
      discountType: "fixed",
      discountValue: 25,
      maxUses: 100,
      currentUses: 100,
      validFrom: "2025-01-01T00:00:00",
      validUntil: "2025-02-28T23:59:59",
      isActive: true,
    },
    {
      id: "3",
      code: "WELCOME2025",
      discountType: "percentage",
      discountValue: 15,
      maxUses: 30,
      currentUses: 8,
      validFrom: "2025-01-01T00:00:00",
      validUntil: "2025-01-10T23:59:59",
      isActive: false,
    },
  ];

  const coupons = mockCoupons; // En producción: event.coupons || []

  const formatDiscount = (coupon: EventCoupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }
    return `S/ ${coupon.discountValue.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCouponStatus = (coupon: EventCoupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    const validFrom = new Date(coupon.validFrom);

    // Verificar si está agotado
    if (coupon.currentUses >= coupon.maxUses) {
      return {
        label: t("events.coupons.status.exhausted", "Agotado"),
        color: "var(--color-grey-600)",
        bgColor: "var(--color-grey-100)",
        icon: <XCircle size={14} />,
      };
    }

    // Verificar si está expirado
    if (validUntil < now) {
      return {
        label: t("events.coupons.status.expired", "Expirado"),
        color: "var(--color-red-700)",
        bgColor: "var(--color-red-100)",
        icon: <XCircle size={14} />,
      };
    }

    // Verificar si aún no está activo
    if (validFrom > now) {
      return {
        label: t("events.coupons.status.scheduled", "Programado"),
        color: "var(--color-blue-700)",
        bgColor: "var(--color-blue-100)",
        icon: <Clock size={14} />,
      };
    }

    // Está activo
    if (coupon.isActive) {
      return {
        label: t("events.coupons.status.active", "Activo"),
        color: "var(--color-green-700)",
        bgColor: "var(--color-green-100)",
        icon: <CheckCircle size={14} />,
      };
    }

    // Inactivo
    return {
      label: t("events.coupons.status.inactive", "Inactivo"),
      color: "var(--color-grey-600)",
      bgColor: "var(--color-grey-100)",
      icon: <XCircle size={14} />,
    };
  };

  const getUsageColor = (coupon: EventCoupon) => {
    const percentage = (coupon.currentUses / coupon.maxUses) * 100;
    if (percentage >= 100) return "var(--color-red-600)";
    if (percentage >= 80) return "var(--color-yellow-600)";
    return "var(--color-green-600)";
  };

  return (
    <div className="event-coupons-tab">
      <Alert variant="info" title={t("events.coupons.info_title", "Cupones de Descuento")}>
        {t(
          "events.coupons.info_desc",
          "Crea y gestiona cupones de descuento para tu evento. Puedes configurar descuentos porcentuales o fijos, límites de uso y períodos de validez."
        )}
      </Alert>

      <Section>
        <Section.Header
          icon={<Tag size={18} weight="duotone" />}
          iconVariant="primary"
          title={t("events.coupons.title", "Cupones Configurados")}
          subtitle={t("events.coupons.subtitle", "{{count}} cupones", {
            count: coupons.length,
          })}
          action={
            <Button variant="primary" size="sm">
              <Plus size={16} />
              {t("events.coupons.add", "Crear Cupón")}
            </Button>
          }
        />
        <Section.Content>
          {coupons.length === 0 ? (
            <div
              style={{
                padding: "var(--space-8)",
                textAlign: "center",
                color: "var(--color-text-muted)",
              }}
            >
              <Tag size={48} style={{ marginBottom: "var(--space-3)" }} />
              <p style={{ margin: 0 }}>
                {t("events.coupons.empty", "No hay cupones de descuento configurados.")}
              </p>
            </div>
          ) : (
            <div className="coupons-grid">
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                const usageColor = getUsageColor(coupon);
                return (
                  <div
                    key={coupon.id}
                    className={`coupon-card ${!coupon.isActive ? "coupon-card--inactive" : ""}`}
                  >
                    <div className="coupon-card__header">
                      <div className="coupon-card__title-row">
                        <div className="coupon-card__code-container">
                          <Tag size={20} weight="duotone" />
                          <h4 className="coupon-card__code">{coupon.code}</h4>
                        </div>
                        <span
                          className="coupon-card__status-badge"
                          style={{
                            color: status.color,
                            backgroundColor: status.bgColor,
                          }}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="coupon-card__discount">
                      <div className="coupon-card__discount-icon">
                        {coupon.discountType === "percentage" ? (
                          <Percent size={24} weight="duotone" />
                        ) : (
                          <CurrencyCircleDollar size={24} weight="duotone" />
                        )}
                      </div>
                      <div className="coupon-card__discount-info">
                        <span className="coupon-card__discount-value">
                          {formatDiscount(coupon)}
                        </span>
                        <span className="coupon-card__discount-type">
                          {coupon.discountType === "percentage"
                            ? t("events.coupons.discount_type.percentage", "Descuento porcentual")
                            : t("events.coupons.discount_type.fixed", "Descuento fijo")}
                        </span>
                      </div>
                    </div>

                    <div className="coupon-card__details">
                      <div className="coupon-card__detail">
                        <span className="coupon-card__detail-label">
                          {t("events.coupons.uses", "Usos")}
                        </span>
                        <span
                          className="coupon-card__detail-value"
                          style={{ color: usageColor }}
                        >
                          {coupon.currentUses} / {coupon.maxUses}
                        </span>
                      </div>

                      <div className="coupon-card__detail">
                        <span className="coupon-card__detail-label">
                          <CalendarBlank size={14} />
                          {t("events.coupons.valid_from", "Válido desde")}
                        </span>
                        <span className="coupon-card__detail-value">
                          {formatDate(coupon.validFrom)}
                        </span>
                      </div>

                      <div className="coupon-card__detail">
                        <span className="coupon-card__detail-label">
                          <CalendarBlank size={14} />
                          {t("events.coupons.valid_until", "Válido hasta")}
                        </span>
                        <span className="coupon-card__detail-value">
                          {formatDate(coupon.validUntil)}
                        </span>
                      </div>
                    </div>

                    <div className="coupon-card__actions">
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
        .coupons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-4);
        }

        .coupon-card {
          padding: var(--space-4);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-grey-200);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .coupon-card:hover {
          border-color: var(--color-grey-300);
          box-shadow: var(--shadow-sm);
        }

        .coupon-card--inactive {
          opacity: 0.6;
          background-color: var(--color-grey-050);
        }

        .coupon-card__header {
          margin-bottom: var(--space-4);
        }

        .coupon-card__title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .coupon-card__code-container {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--color-primary);
        }

        .coupon-card__code {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--color-primary);
          margin: 0;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }

        .coupon-card__status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-2);
          font-size: var(--font-size-xs);
          font-weight: 500;
          border-radius: var(--radius-md);
        }

        .coupon-card__discount {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: linear-gradient(135deg, var(--color-primary-050) 0%, var(--color-primary-100) 100%);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-3);
        }

        .coupon-card__discount-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background-color: var(--color-bg-primary);
          border-radius: var(--radius-md);
          color: var(--color-primary);
        }

        .coupon-card__discount-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .coupon-card__discount-value {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--color-primary);
          line-height: 1;
        }

        .coupon-card__discount-type {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .coupon-card__details {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding: var(--space-3);
          background-color: var(--color-grey-050);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-3);
        }

        .coupon-card__detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-2);
        }

        .coupon-card__detail-label {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .coupon-card__detail-value {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .coupon-card__actions {
          display: flex;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-grey-100);
        }
      `}</style>
    </div>
  );
};

export default EventCouponsTab;
