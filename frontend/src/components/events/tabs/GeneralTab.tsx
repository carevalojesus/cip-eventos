import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Monitor,
  ExternalLink,
  Copy,
  Users,
  Ticket,
  Award,
  Share2,
  Pencil,
  Check,
  Globe,
  Timer,
  Loader2,
  ChevronDown,
  Presentation,
  Video,
  Blend,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Event, EventStatus } from "@/types/event";

interface GeneralTabProps {
  event: Event;
  isAdmin?: boolean;
  onEdit?: () => void;
  onChangeStatus?: (status: EventStatus) => Promise<boolean>;
  publishing?: boolean;
}

const STATUS_CONFIG: Record<EventStatus, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "rui-event-status-badge--draft" },
  PUBLISHED: { label: "Publicado", className: "rui-event-status-badge--published" },
  CANCELLED: { label: "Cancelado", className: "rui-event-status-badge--cancelled" },
  COMPLETED: { label: "Finalizado", className: "rui-event-status-badge--completed" },
};

export const GeneralTab: React.FC<GeneralTabProps> = ({
  event,
  isAdmin = true,
  onEdit,
  onChangeStatus,
  publishing = false,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);

  const handleStatusChange = async () => {
    if (!onChangeStatus || !pendingStatus) return;

    setChangingStatus(true);
    const success = await onChangeStatus(pendingStatus);
    setChangingStatus(false);
    setPendingStatus(null);

    if (success) {
      toast.success("Estado actualizado", {
        description: `El evento ahora está ${STATUS_CONFIG[pendingStatus].label.toLowerCase()}.`,
      });
    } else {
      toast.error("Error al cambiar estado", {
        description: "No se pudo actualizar el estado del evento.",
      });
    }
  };

  // Formateo de fechas
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("es-PE", { month: "short" }).toUpperCase(),
      monthLong: date.toLocaleDateString("es-PE", { month: "long" }),
      year: date.getFullYear(),
      weekday: date.toLocaleDateString("es-PE", { weekday: "long" }),
      time: date.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }),
    };
  };

  const start = formatDateShort(event.startAt);
  const end = formatDateShort(event.endAt);

  // Calcular duración en horas
  const durationHours = Math.round(
    (new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / (1000 * 60 * 60)
  );

  // Determinar si es mismo día
  const isSameDay = new Date(event.startAt).toDateString() === new Date(event.endAt).toDateString();

  // Total de cupos de todos los tickets
  const totalStock = event.tickets?.reduce((acc, t) => acc + t.stock, 0) || 0;

  // Calcular tiempo restante para el evento
  const getTimeRemaining = () => {
    const now = new Date();
    const startDate = new Date(event.startAt);
    const diff = startDate.getTime() - now.getTime();

    if (diff <= 0) {
      const endDate = new Date(event.endAt);
      if (now < endDate) {
        return { label: "En curso", value: "Ahora", isLive: true, isPast: false };
      }
      return { label: "Evento", value: "Finalizado", isLive: false, isPast: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return { label: "Faltan", value: `${days}d ${hours}h`, isLive: false, isPast: false };
    }
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { label: "Faltan", value: `${hours}h ${minutes}m`, isLive: false, isPast: false };
  };

  const timeRemaining = getTimeRemaining();

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const getGoogleMapsUrl = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // Calcular porcentaje de ocupación (simulado - 0 inscritos por ahora)
  const enrolledCount = 0;
  const occupancyPercent = totalStock > 0 ? Math.round((enrolledCount / totalStock) * 100) : 0;

  return (
    <div className="rui-event-detail">
      {/* Hero Section */}
      <div className="rui-event-hero">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" className="rui-event-hero-image" />
        ) : (
          <div className="rui-event-hero-placeholder" />
        )}
        <div className="rui-event-hero-overlay" />

        <div className="rui-event-hero-content">
          {/* Badges - RUI: diferenciar información de diferente naturaleza */}
          <div className="rui-event-hero-badges">
            {event.type && (
              <span className="rui-event-hero-badge">{event.type.name}</span>
            )}
            {event.category && (
              <span className="rui-event-hero-badge">{event.category.name}</span>
            )}
            {event.modality && (
              <span className={`rui-event-hero-badge ${
                event.modality.name.toLowerCase().includes("presencial") ? "rui-event-hero-badge--presencial" :
                event.modality.name.toLowerCase().includes("virtual") ? "rui-event-hero-badge--virtual" :
                "rui-event-hero-badge--hibrido"
              }`}>
                {event.modality.name.toLowerCase().includes("presencial") && <Presentation className="rui-event-hero-badge-icon" />}
                {event.modality.name.toLowerCase().includes("virtual") && <Video className="rui-event-hero-badge-icon" />}
                {event.modality.name.toLowerCase().includes("híbrido") && <Blend className="rui-event-hero-badge-icon" />}
                {event.modality.name}
              </span>
            )}
          </div>

          {/* Título */}
          <h1 className="rui-event-hero-title">{event.title}</h1>

          {/* Meta info */}
          <div className="rui-event-hero-meta">
            <span className="rui-event-hero-meta-item">
              <Calendar className="rui-event-hero-meta-icon" />
              {isSameDay ? (
                <>{start.weekday}, {start.day} de {start.monthLong} {start.year}</>
              ) : (
                <>{start.day} {start.month} - {end.day} {end.month} {end.year}</>
              )}
            </span>
            <span className="rui-event-hero-meta-item">
              <Clock className="rui-event-hero-meta-icon" />
              {start.time} - {end.time}
            </span>
            {event.location && (
              <span className="rui-event-hero-meta-item">
                <MapPin className="rui-event-hero-meta-icon" />
                {event.location.name || event.location.address}, {event.location.city}
              </span>
            )}
            {!event.location && event.virtualAccess && (
              <span className="rui-event-hero-meta-item">
                <Monitor className="rui-event-hero-meta-icon" />
                {event.virtualAccess.platform} (Virtual)
              </span>
            )}
          </div>

          {/* Acciones */}
          <div className="rui-event-hero-actions">
            <button className="rui-btn-hero-ghost">
              <Share2 className="rui-btn-hero-ghost-icon" />
              Compartir
            </button>
            {isAdmin && onEdit && (
              <button className="rui-btn-hero-primary" onClick={onEdit}>
                <Pencil className="rui-btn-hero-primary-icon" />
                Editar
              </button>
            )}
            {isAdmin && onChangeStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`rui-event-status-badge ${STATUS_CONFIG[event.status].className}`}
                    disabled={changingStatus || publishing}
                  >
                    {(changingStatus || publishing) ? (
                      <Loader2 className="rui-event-status-dot animate-spin" style={{ width: 14, height: 14 }} />
                    ) : (
                      <span className="rui-event-status-dot" />
                    )}
                    {STATUS_CONFIG[event.status].label}
                    <ChevronDown style={{ width: 14, height: 14 }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rui-dropdown-content">
                  {(Object.keys(STATUS_CONFIG) as EventStatus[]).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => setPendingStatus(status)}
                      disabled={status === event.status}
                      className="rui-dropdown-item"
                    >
                      <span className={`rui-status-dot ${
                        status === "PUBLISHED" ? "rui-status-dot--published" :
                        status === "DRAFT" ? "rui-status-dot--draft" :
                        status === "CANCELLED" ? "rui-status-dot--cancelled" : "rui-status-dot--completed"
                      }`} />
                      {STATUS_CONFIG[status].label}
                      {status === event.status && <Check className="rui-dropdown-check" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Métricas - Barra horizontal compacta RUI */}
      <div className="rui-stats-bar">
        {/* Cuenta regresiva */}
        <div className={`rui-stat-item ${timeRemaining.isLive ? "rui-stat-item--live" : timeRemaining.isPast ? "rui-stat-item--past" : ""}`}>
          <div className="rui-stat-icon-wrapper">
            <Timer className="rui-stat-icon" />
          </div>
          <div className="rui-stat-content">
            <span className="rui-stat-value">{timeRemaining.value}</span>
            <span className="rui-stat-label">{timeRemaining.label}</span>
          </div>
        </div>

        {/* Inscritos / Total */}
        <div className="rui-stat-item">
          <div className="rui-stat-icon-wrapper">
            <Users className="rui-stat-icon" />
          </div>
          <div className="rui-stat-content">
            <div className="rui-stat-fraction">
              <span className="rui-stat-fraction-current">{enrolledCount}</span>
              <span className="rui-stat-fraction-separator">/</span>
              <span className="rui-stat-fraction-total">{totalStock}</span>
            </div>
            <span className="rui-stat-label">Inscritos</span>
            {totalStock > 0 && occupancyPercent > 0 && (
              <div className="rui-stat-progress">
                <div
                  className={`rui-stat-progress-bar ${occupancyPercent >= 100 ? "rui-stat-progress-bar--full" : occupancyPercent >= 80 ? "rui-stat-progress-bar--warning" : ""}`}
                  style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Certificado o Duración */}
        <div className="rui-stat-item">
          <div className="rui-stat-icon-wrapper">
            {event.hasCertificate ? <Award className="rui-stat-icon" /> : <Clock className="rui-stat-icon" />}
          </div>
          <div className="rui-stat-content">
            <span className="rui-stat-value">{event.certificateHours || durationHours}h</span>
            <span className="rui-stat-label">{event.hasCertificate ? "Certificado" : "Duración"}</span>
          </div>
        </div>
      </div>

      {/* Contenido principal en 2 columnas */}
      <div className="rui-event-content">
        {/* Columna izquierda */}
        <div className="rui-event-main">
          {/* Descripción - RUI: sin título redundante, con lead paragraph */}
          <section className="rui-event-description">
            {(() => {
              // Dividir descripción en párrafos
              const paragraphs = event.description.split(/\n\n+/).filter(p => p.trim());
              const leadParagraph = paragraphs[0] || "";
              const restParagraphs = paragraphs.slice(1).join("\n\n");

              return (
                <>
                  {leadParagraph && (
                    <p className="rui-description-lead">{leadParagraph}</p>
                  )}
                  {restParagraphs && (
                    <div className="rui-description-body">{restParagraphs}</div>
                  )}
                </>
              );
            })()}
          </section>

          {/* Entradas disponibles - RUI: "Emphasize by de-emphasizing" */}
          <section className="rui-content-section">
            <h2 className="rui-content-section-title">Entradas disponibles</h2>
            {(!event.tickets || event.tickets.length === 0) ? (
              /* Estado vacío cuando no hay entradas */
              <div className="rui-empty-state">
                <Ticket className="rui-empty-state-icon" />
                <div className="rui-empty-state-title">Sin entradas configuradas</div>
                <div className="rui-empty-state-description">
                  Este evento aún no tiene entradas disponibles para inscripción.
                </div>
              </div>
            ) : (
              <div className="rui-tickets-list">
                {event.tickets.filter(t => t.isActive).map((ticket) => {
                  const price = typeof ticket.price === "string" ? parseFloat(ticket.price) : ticket.price;
                  const isFree = price === 0;
                  const sold = 0; // Simulado
                  const remaining = ticket.stock - sold;
                  const percentSold = ticket.stock > 0 ? (sold / ticket.stock) * 100 : 0;
                  const isWarning = remaining > 0 && remaining <= 20;
                  const isSoldOut = remaining === 0;

                  return (
                    <div
                      key={ticket.id}
                      className={`rui-ticket-card ${isSoldOut ? "rui-ticket-card--sold-out" : ""}`}
                    >
                      {/* Lado izquierdo: información */}
                      <div className="rui-ticket-info">
                        <div className="rui-ticket-header">
                          <Ticket className="rui-ticket-icon" />
                          <span className="rui-ticket-name">{ticket.name}</span>
                        </div>

                        <div className="rui-ticket-meta">
                          <span className="rui-ticket-slots">{ticket.stock} cupos</span>
                          <span className="rui-ticket-separator" />
                          <span className={`rui-ticket-status ${
                            isSoldOut ? "rui-ticket-status--sold-out" :
                            isWarning ? "rui-ticket-status--warning" :
                            "rui-ticket-status--available"
                          }`}>
                            {isSoldOut ? "Agotado" :
                             isWarning ? `¡${remaining} restantes!` :
                             "Disponible"}
                          </span>
                        </div>

                        {ticket.requiresCipValidation && (
                          <div className="rui-ticket-badges">
                            <span className="rui-ticket-badge rui-ticket-badge--cip">CIP requerido</span>
                          </div>
                        )}

                        {/* Progress bar solo si hay ventas */}
                        {percentSold > 0 && (
                          <div className="rui-ticket-progress-wrapper">
                            <div className="rui-ticket-progress">
                              <div
                                className={`rui-ticket-progress-bar ${
                                  isSoldOut ? "rui-ticket-progress-bar--full" :
                                  isWarning ? "rui-ticket-progress-bar--warning" : ""
                                }`}
                                style={{ width: `${percentSold}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lado derecho: precio */}
                      <div className="rui-ticket-pricing">
                        {isFree ? (
                          <span className="rui-ticket-price--free">Gratis</span>
                        ) : (
                          <span className="rui-ticket-price">
                            <span className="rui-ticket-price-currency">S/</span>
                            {price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar - RUI: "Labels are a last resort" */}
        <div className="rui-event-sidebar">
          {/* Fecha y hora - Diseño tipo Event Card */}
          <div className="rui-sidebar-card">
            {isSameDay ? (
              /* Mismo día: bloque de fecha + info */
              <div className="rui-datetime-card">
                <div className="rui-date-block">
                  <span className="rui-date-day">{start.day}</span>
                  <span className="rui-date-month">{start.month}</span>
                </div>
                <div className="rui-datetime-info">
                  <span className="rui-datetime-weekday">{start.weekday}</span>
                  <span className="rui-datetime-time">{start.time} - {end.time}</span>
                  <span className="rui-datetime-duration">
                    <Clock className="rui-datetime-duration-icon" />
                    {durationHours} horas
                  </span>
                  {event.timezone && (
                    <span className="rui-datetime-timezone">
                      <Globe className="rui-datetime-timezone-icon" />
                      {event.timezone}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Multi-día: rango de fechas */
              <div className="rui-datetime-card">
                <div className="rui-daterange">
                  <div className="rui-date-block">
                    <span className="rui-date-day">{start.day}</span>
                    <span className="rui-date-month">{start.month}</span>
                  </div>
                  <span className="rui-daterange-separator">→</span>
                  <div className="rui-date-block">
                    <span className="rui-date-day">{end.day}</span>
                    <span className="rui-date-month">{end.month}</span>
                  </div>
                </div>
                <div className="rui-datetime-info">
                  <span className="rui-datetime-time">{start.time} - {end.time}</span>
                  {event.timezone && (
                    <span className="rui-datetime-timezone">
                      <Globe className="rui-datetime-timezone-icon" />
                      {event.timezone}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ubicación - Diseño más visual */}
          {event.location && (
            <div className="rui-sidebar-card">
              <div className="rui-location-card">
                <div className="rui-location-header">
                  <div className="rui-location-icon-wrapper">
                    <MapPin className="rui-location-icon" />
                  </div>
                  <div className="rui-location-details">
                    {event.location.name && (
                      <div className="rui-location-name">{event.location.name}</div>
                    )}
                    <div className="rui-location-address">
                      {event.location.address}, {event.location.city}
                    </div>
                    {event.location.reference && (
                      <div className="rui-location-reference">{event.location.reference}</div>
                    )}
                  </div>
                </div>
                <a
                  href={event.location.mapLink || getGoogleMapsUrl(event.location.address, event.location.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rui-location-map-btn"
                >
                  <MapPin className="rui-location-map-btn-icon" />
                  Abrir en Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Acceso virtual - Diseño limpio */}
          {event.virtualAccess && (
            <div className="rui-sidebar-card">
              <div className="rui-virtual-card">
                <div className="rui-virtual-header">
                  <div className="rui-virtual-icon-wrapper">
                    <Monitor className="rui-virtual-icon" />
                  </div>
                  <div className="rui-virtual-details">
                    <div className="rui-virtual-platform">{event.virtualAccess.platform}</div>
                    {event.virtualAccess.meetingPassword && (
                      <div className="rui-virtual-password">
                        Contraseña: {event.virtualAccess.meetingPassword}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rui-virtual-url">
                  <code className="rui-virtual-url-text">
                    {event.virtualAccess.meetingUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(event.virtualAccess!.meetingUrl)}
                    className="rui-virtual-copy-btn"
                  >
                    {copied ? (
                      <Check className="rui-virtual-copy-icon" style={{ color: "var(--rui-success-600)" }} />
                    ) : (
                      <Copy className="rui-virtual-copy-icon" />
                    )}
                  </button>
                </div>

                {event.virtualAccess.instructions && (
                  <div className="rui-virtual-instructions">
                    {event.virtualAccess.instructions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certificación - Diseño compacto */}
          {event.hasCertificate && (
            <div className="rui-sidebar-card">
              <div className="rui-cert-card">
                <div className="rui-cert-icon-wrapper">
                  <Award className="rui-cert-icon" />
                </div>
                <div className="rui-cert-info">
                  <div className="rui-cert-title">Certificado incluido</div>
                  <div className="rui-cert-hours">{event.certificateHours || durationHours} horas académicas</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación para cambio de estado */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <AlertDialogContent className="rui-dialog-content">
          <AlertDialogHeader>
            <AlertDialogTitle className="rui-dialog-title">¿Cambiar estado del evento?</AlertDialogTitle>
            <AlertDialogDescription className="rui-dialog-description">
              {pendingStatus && (
                <>
                  El evento pasará de <strong>{STATUS_CONFIG[event.status].label}</strong> a{" "}
                  <strong>{STATUS_CONFIG[pendingStatus].label}</strong>.
                  {pendingStatus === "PUBLISHED" && " Será visible para todos los usuarios."}
                  {pendingStatus === "CANCELLED" && " El evento quedará cancelado y no será visible."}
                  {pendingStatus === "DRAFT" && " El evento dejará de ser visible públicamente."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="rui-dialog-footer">
            <AlertDialogCancel disabled={changingStatus} className="rui-dialog-btn rui-dialog-btn--cancel">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} disabled={changingStatus} className="rui-dialog-btn rui-dialog-btn--confirm">
              {changingStatus ? (
                <span className="rui-loader-inline">
                  <Loader2 className="rui-loader-icon" />
                  Cambiando...
                </span>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
