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
  Building2,
  User,
  Link2,
  Timer,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ChevronDown } from "lucide-react";
import type { Event, EventStatus } from "@/types/event";

interface GeneralTabProps {
  event: Event;
  isAdmin?: boolean;
  onEdit?: () => void;
  onPublish?: () => Promise<boolean>;
  onChangeStatus?: (status: EventStatus) => Promise<boolean>;
  publishing?: boolean;
}

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string }> = {
  DRAFT: { label: "Borrador", color: "bg-gray-500" },
  PUBLISHED: { label: "Publicado", color: "bg-green-500" },
  CANCELLED: { label: "Cancelado", color: "bg-red-500" },
  COMPLETED: { label: "Finalizado", color: "bg-blue-500" },
};

export const GeneralTab: React.FC<GeneralTabProps> = ({
  event,
  isAdmin = true,
  onEdit,
  onPublish,
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
    setTimeout(() => setCopied(false), 2000);
  };

  const getGoogleMapsUrl = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="space-y-8">
      {/* Banner Hero - Más alto */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-primary/10 to-muted" />
          )}
          {/* Overlay con degradado oscuro elegante */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        </div>

        {/* Contenido del banner */}
        <div className="relative px-6 pt-16 pb-6 sm:pt-24 sm:pb-8">
          {/* Badges superiores - solo tipo, categoría y modalidad */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {event.type && (
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                {event.type.name}
              </Badge>
            )}
            {event.category && (
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                {event.category.name}
              </Badge>
            )}
            {event.modality && (
              <Badge variant="outline" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                {event.modality.name}
              </Badge>
            )}
          </div>

          {/* Título del evento */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {event.title}
          </h1>

          {/* Info esencial */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-white/90">
            {/* Fecha */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/70" />
              <span className="font-medium">
                {isSameDay ? (
                  <>{start.weekday}, {start.day} de {start.monthLong} {start.year}</>
                ) : (
                  <>{start.day} {start.month} - {end.day} {end.month} {end.year}</>
                )}
              </span>
            </div>

            {/* Hora */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/70" />
              <span>{start.time} - {end.time}</span>
            </div>

            {/* Ubicación */}
            <div className="flex items-center gap-2">
              {event.location ? (
                <>
                  <MapPin className="h-4 w-4 text-white/70" />
                  <span className="truncate max-w-[250px]">
                    {event.location.name || event.location.address}, {event.location.city}
                  </span>
                </>
              ) : event.virtualAccess ? (
                <>
                  <Monitor className="h-4 w-4 text-white/70" />
                  <span>{event.virtualAccess.platform} (Virtual)</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 mt-6">
            <Button variant="secondary" size="sm" className="gap-2 bg-white/20 text-white hover:bg-white/30 border-white/30">
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
            {isAdmin && onEdit && (
              <Button variant="secondary" size="sm" className="gap-2 bg-white/20 text-white hover:bg-white/30 border-white/30" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
            {isAdmin && onChangeStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={changingStatus || publishing}
                  >
                    {(changingStatus || publishing) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[event.status].color}`} />
                    )}
                    {STATUS_CONFIG[event.status].label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(STATUS_CONFIG) as EventStatus[]).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => setPendingStatus(status)}
                      disabled={status === event.status}
                      className="gap-2"
                    >
                      <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[status].color}`} />
                      {STATUS_CONFIG[status].label}
                      {status === event.status && <Check className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats - Siempre 4 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Cuenta regresiva */}
        <div className={`rounded-lg border p-4 text-center ${
          timeRemaining.isLive
            ? "bg-green-500/10 border-green-500/30"
            : timeRemaining.isPast
              ? "bg-muted"
              : "bg-card"
        }`}>
          <Timer className={`h-5 w-5 mx-auto mb-1 ${
            timeRemaining.isLive
              ? "text-green-500"
              : "text-muted-foreground"
          }`} />
          <p className={`text-2xl font-bold ${
            timeRemaining.isLive ? "text-green-600" : ""
          }`}>
            {timeRemaining.value}
          </p>
          <p className="text-xs text-muted-foreground">{timeRemaining.label}</p>
        </div>

        {/* Inscritos */}
        <div className="rounded-lg border bg-card p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Inscritos</p>
        </div>

        {/* Cupos */}
        <div className="rounded-lg border bg-card p-4 text-center">
          <Ticket className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{totalStock}</p>
          <p className="text-xs text-muted-foreground">Cupos totales</p>
        </div>

        {/* Duración o Certificado */}
        {event.hasCertificate ? (
          <div className="rounded-lg border bg-card p-4 text-center">
            <Award className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{event.certificateHours || durationHours}h</p>
            <p className="text-xs text-muted-foreground">Certificado</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{durationHours}h</p>
            <p className="text-xs text-muted-foreground">Duración</p>
          </div>
        )}
      </div>

      {/* Contenido principal en 2 columnas */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Columna izquierda - 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          {/* Descripción */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Sobre el evento</h2>
            <div className="prose prose-sm prose-neutral max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
              {event.summary && (
                <blockquote className="border-l-2 border-primary pl-4 mt-4 italic text-muted-foreground">
                  {event.summary}
                </blockquote>
              )}
            </div>
          </section>

          {/* Ponentes */}
          {event.speakers && event.speakers.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Ponentes</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {event.speakers.map((speaker) => (
                  <div key={speaker.id} className="flex items-start gap-3 rounded-lg border p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={speaker.photoUrl} alt={`${speaker.firstName} ${speaker.lastName}`} />
                      <AvatarFallback>
                        {speaker.firstName[0]}{speaker.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {speaker.firstName} {speaker.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {speaker.profession}
                      </p>
                      {speaker.companyName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {speaker.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Organizadores */}
          {event.organizers && event.organizers.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Organizadores</h2>
              <div className="flex flex-wrap gap-3">
                {event.organizers.map((org) => (
                  <div key={org.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt={org.name} className="h-6 w-6 object-contain" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{org.name}</span>
                    {org.website && (
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Entradas disponibles */}
          {event.tickets && event.tickets.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Entradas</h2>
              <div className="space-y-3">
                {event.tickets.filter(t => t.isActive).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{ticket.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{ticket.stock} cupos</span>
                        {ticket.requiresCipValidation && (
                          <Badge variant="outline" className="text-xs">Requiere CIP</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-bold">
                      {ticket.price > 0 ? `S/ ${ticket.price.toFixed(2)}` : "Gratis"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Columna derecha - 1/3 */}
        <div className="space-y-6">
          {/* Fecha y hora */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="flex items-center gap-2 font-medium mb-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Fecha y hora
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Inicio</p>
                <p className="font-medium capitalize">{start.weekday}, {start.day} de {start.monthLong} {start.year}</p>
                <p className="text-muted-foreground">{start.time}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Fin</p>
                <p className="font-medium capitalize">
                  {isSameDay ? "Mismo día" : `${end.weekday}, ${end.day} de ${end.monthLong} ${end.year}`}
                </p>
                <p className="text-muted-foreground">{end.time}</p>
              </div>
              {event.timezone && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Zona horaria: {event.timezone}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ubicación */}
          {event.location && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="flex items-center gap-2 font-medium mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Ubicación
              </h3>
              <div className="space-y-3 text-sm">
                {event.location.name && (
                  <p className="font-medium">{event.location.name}</p>
                )}
                <p className="text-muted-foreground">{event.location.address}</p>
                <p className="text-muted-foreground">{event.location.city}</p>
                {event.location.reference && (
                  <p className="text-xs text-muted-foreground italic">
                    Referencia: {event.location.reference}
                  </p>
                )}
                <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                  <a
                    href={event.location.mapLink || getGoogleMapsUrl(event.location.address, event.location.city)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver en Google Maps
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Acceso virtual */}
          {event.virtualAccess && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="flex items-center gap-2 font-medium mb-4">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                Acceso virtual
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{event.virtualAccess.platform}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Enlace de acceso</p>
                  <div className="flex items-center gap-1">
                    <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                      {event.virtualAccess.meetingUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyToClipboard(event.virtualAccess!.meetingUrl)}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {event.virtualAccess.meetingPassword && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Contraseña</p>
                    <code className="block rounded bg-muted px-2 py-1 text-xs">
                      {event.virtualAccess.meetingPassword}
                    </code>
                  </div>
                )}

                {event.virtualAccess.instructions && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Instrucciones</p>
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      {event.virtualAccess.instructions}
                    </p>
                  </div>
                )}

                <Button className="w-full gap-2" size="sm" asChild>
                  <a href={event.virtualAccess.meetingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Unirse a la reunión
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Certificación */}
          {event.hasCertificate && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="flex items-center gap-2 font-medium mb-3">
                <Award className="h-4 w-4 text-muted-foreground" />
                Certificación
              </h3>
              <p className="text-sm text-muted-foreground">
                Este evento otorga certificado de{" "}
                <strong className="text-foreground">{event.certificateHours || durationHours} horas</strong> académicas.
              </p>
              {event.signers && event.signers.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Firmantes:</p>
                  <div className="space-y-1">
                    {event.signers.map((signer) => (
                      <p key={signer.id} className="text-xs">
                        <span className="font-medium">{signer.name}</span>
                        <span className="text-muted-foreground"> - {signer.title}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Información adicional */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-3">Información adicional</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID del evento</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{event.id.slice(0, 8)}...</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-mono text-xs">{event.slug}</span>
              </div>
              {event.createdBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado por</span>
                  <span className="text-xs">
                    {event.createdBy.profile
                      ? `${event.createdBy.profile.firstName} ${event.createdBy.profile.lastName}`
                      : event.createdBy.email
                    }
                  </span>
                </div>
              )}
              {event.createdAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha creación</span>
                  <span className="text-xs">
                    {new Date(event.createdAt).toLocaleDateString("es-PE")}
                  </span>
                </div>
              )}
              {event.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última actualización</span>
                  <span className="text-xs">
                    {new Date(event.updatedAt).toLocaleDateString("es-PE")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para cambio de estado */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar estado del evento?</AlertDialogTitle>
            <AlertDialogDescription>
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} disabled={changingStatus}>
              {changingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
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
