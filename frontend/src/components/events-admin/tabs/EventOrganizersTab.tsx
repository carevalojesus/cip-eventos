/**
 * EventOrganizersTab Component
 *
 * Tab de gestión de organizadores del evento.
 */
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Buildings,
  Plus,
  Trash,
  GlobeHemisphereWest,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/rui";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Event, Organizer } from "@/types/event";
import { organizersService } from "@/services/organizers.service";
import { eventsService } from "@/services/events.service";

interface EventOrganizersTabProps {
  event: Event;
  onRefresh: () => void;
}

export const EventOrganizersTab: React.FC<EventOrganizersTabProps> = ({
  event,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [availableOrganizers, setAvailableOrganizers] = useState<Organizer[]>([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentOrganizers = event.organizers || [];

  // Debug: mostrar organizadores actuales del evento
  console.log("[EventOrganizersTab] event.organizers:", event.organizers);
  console.log("[EventOrganizersTab] currentOrganizers:", currentOrganizers);

  // Cargar organizadores disponibles cuando se abre el drawer
  useEffect(() => {
    if (isDrawerOpen) {
      loadAvailableOrganizers();
    }
  }, [isDrawerOpen]);

  const loadAvailableOrganizers = async () => {
    setIsLoading(true);
    try {
      const organizers = await organizersService.findAll(false);
      // Filtrar los organizadores que ya están asociados al evento
      const currentOrganizerIds = new Set(currentOrganizers.map((org) => org.id));
      const available = organizers.filter((org) => !currentOrganizerIds.has(org.id));
      setAvailableOrganizers(available);
    } catch (error) {
      console.error("Error loading organizers:", error);
      toast.error(t("events.organizers.load_error", "Error al cargar organizadores"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOrganizer = (organizerId: string) => {
    setSelectedOrganizers((prev) => {
      const next = new Set(prev);
      if (next.has(organizerId)) {
        next.delete(organizerId);
      } else {
        next.add(organizerId);
      }
      return next;
    });
  };

  const handleAddOrganizers = async () => {
    if (selectedOrganizers.size === 0) {
      toast.error(t("events.organizers.select_one", "Selecciona al menos un organizador"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Agregar cada organizador seleccionado
      const promises = Array.from(selectedOrganizers).map((organizerId) =>
        eventsService.addOrganizer(event.id, organizerId)
      );
      await Promise.all(promises);

      console.log("[EventOrganizersTab] Organizadores agregados, refrescando...");
      toast.success(
        t(
          "events.organizers.added_success",
          "Organizadores agregados exitosamente"
        )
      );
      setIsDrawerOpen(false);
      setSelectedOrganizers(new Set());
      onRefresh();
    } catch (error) {
      console.error("[EventOrganizersTab] Error adding organizers:", error);
      toast.error(t("events.organizers.add_error", "Error al agregar organizadores"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveOrganizer = async (organizerId: string) => {
    if (!confirm(t("events.organizers.confirm_remove", "¿Deseas remover este organizador del evento?"))) {
      return;
    }

    try {
      await eventsService.removeOrganizer(event.id, organizerId);
      toast.success(
        t("events.organizers.removed_success", "Organizador removido exitosamente")
      );
      onRefresh();
    } catch (error) {
      console.error("[EventOrganizersTab] Error removing organizer:", error);
      toast.error(
        t("events.organizers.remove_error", "Error al remover organizador")
      );
    }
  };

  const getOrganizerInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="event-organizers-tab">
      <Alert variant="info" title={t("events.organizers.info_title", "Organizadores")}>
        {t(
          "events.organizers.info_desc",
          "Gestiona las organizaciones responsables de este evento. Los organizadores aparecerán en la página del evento."
        )}
      </Alert>

      <Section>
        <Section.Header
          icon={<Buildings size={18} weight="duotone" />}
          iconVariant="primary"
          title={t("events.organizers.title", "Organizadores del Evento")}
          subtitle={t("events.organizers.subtitle", "{{count}} organizador(es)", {
            count: currentOrganizers.length,
          })}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Plus size={16} />
              {t("events.organizers.add", "Agregar Organizador")}
            </Button>
          }
        />
        <Section.Content>
          {currentOrganizers.length === 0 ? (
            <div
              style={{
                padding: "var(--space-8)",
                textAlign: "center",
                color: "var(--color-text-muted)",
              }}
            >
              <Buildings size={48} style={{ marginBottom: "var(--space-3)" }} />
              <p style={{ margin: 0 }}>
                {t(
                  "events.organizers.empty",
                  "No hay organizadores asociados al evento."
                )}
              </p>
            </div>
          ) : (
            <div className="organizers-grid">
              {currentOrganizers.map((organizer) => (
                <div key={organizer.id} className="organizer-card">
                  <div className="organizer-card__header">
                    <Avatar className="organizer-card__avatar">
                      <AvatarImage src={organizer.logoUrl} alt={organizer.name} />
                      <AvatarFallback>
                        {getOrganizerInitials(organizer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="organizer-card__info">
                      <h4 className="organizer-card__name">{organizer.name}</h4>
                      {organizer.website && (
                        <a
                          href={organizer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="organizer-card__website"
                        >
                          <GlobeHemisphereWest size={14} />
                          {new URL(organizer.website).hostname}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="organizer-card__actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOrganizer(organizer.id)}
                    >
                      <Trash size={16} />
                      {t("common.remove", "Remover")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section.Content>
      </Section>

      {/* Drawer para agregar organizadores */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent width="md">
          <DrawerHeader>
            <DrawerTitle>
              {t("events.organizers.add_drawer_title", "Agregar Organizadores")}
            </DrawerTitle>
            <DrawerDescription>
              {t(
                "events.organizers.add_drawer_desc",
                "Selecciona los organizadores que deseas asociar a este evento"
              )}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody>
            {isLoading ? (
              <div
                style={{
                  padding: "var(--space-8)",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                {t("common.loading", "Cargando...")}
              </div>
            ) : availableOrganizers.length === 0 ? (
              <div
                style={{
                  padding: "var(--space-8)",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                <Buildings size={48} style={{ marginBottom: "var(--space-3)" }} />
                <p style={{ margin: 0 }}>
                  {t(
                    "events.organizers.no_available",
                    "No hay organizadores disponibles para agregar"
                  )}
                </p>
              </div>
            ) : (
              <div className="organizers-list">
                {availableOrganizers.map((organizer) => (
                  <div
                    key={organizer.id}
                    className="organizer-list-item"
                    onClick={() => handleToggleOrganizer(organizer.id)}
                  >
                    <Checkbox
                      checked={selectedOrganizers.has(organizer.id)}
                      onChange={() => handleToggleOrganizer(organizer.id)}
                    />
                    <Avatar className="organizer-list-item__avatar">
                      <AvatarImage src={organizer.logoUrl} alt={organizer.name} />
                      <AvatarFallback>
                        {getOrganizerInitials(organizer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="organizer-list-item__info">
                      <span className="organizer-list-item__name">
                        {organizer.name}
                      </span>
                      {organizer.website && (
                        <span className="organizer-list-item__website">
                          {new URL(organizer.website).hostname}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDrawerOpen(false);
                setSelectedOrganizers(new Set());
              }}
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              variant="primary"
              onClick={handleAddOrganizers}
              disabled={isSubmitting || selectedOrganizers.size === 0}
            >
              {isSubmitting
                ? t("common.adding", "Agregando...")
                : t("events.organizers.add_selected", "Agregar ({{count}})", {
                    count: selectedOrganizers.size,
                  })}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <style>{`
        .organizers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-4);
        }

        .organizer-card {
          padding: var(--space-4);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-grey-200);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .organizer-card:hover {
          border-color: var(--color-grey-300);
          box-shadow: var(--shadow-sm);
        }

        .organizer-card__header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .organizer-card__avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .organizer-card__info {
          flex: 1;
          min-width: 0;
        }

        .organizer-card__name {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-1) 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .organizer-card__website {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-xs);
          color: var(--color-primary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .organizer-card__website:hover {
          color: var(--color-primary-dark);
          text-decoration: underline;
        }

        .organizer-card__actions {
          display: flex;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-grey-100);
        }

        .organizers-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .organizer-list-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border: 1px solid var(--color-grey-200);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .organizer-list-item:hover {
          background-color: var(--color-grey-050);
          border-color: var(--color-grey-300);
        }

        .organizer-list-item__avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .organizer-list-item__info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .organizer-list-item__name {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .organizer-list-item__website {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};

export default EventOrganizersTab;
