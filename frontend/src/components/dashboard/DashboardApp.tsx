import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { LoadingState } from "./LoadingState";
import { DashboardLayout } from "./DashboardLayout";
import { DashboardContent } from "./DashboardContent";
import { EventsView } from "@/components/events/EventsView";
import { CreateEventView } from "@/components/events/CreateEventView";
import { EventManagementView } from "@/components/events/EventManagementView";
import { EditEventView } from "@/components/events/EditEventView";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getCurrentLocale, routes } from "@/lib/routes";
import { Toaster } from "@/components/ui/sonner";

const SectionPlaceholder: React.FC<{ title: string; description?: string }> = ({
  title,
  description = "Próximamente podrás gestionar esta sección desde aquí.",
}) => (
  <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    <p className="mt-2 text-sm text-gray-500">{description}</p>
  </div>
);

interface DashboardAppProps {
  initialPath?: string;
}

/**
 * DashboardApp
 * Cliente protegido: verifica sesión antes de renderizar el dashboard.
 * Redirige a /iniciar-sesion si no hay token.
 */
export interface Breadcrumb {
  label: string;
  href?: string;
}

export const DashboardApp: React.FC<DashboardAppProps> = ({ initialPath }) => {
  const { token } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [activePath, setActivePath] = useState(initialPath || "/");
  const [hydrated, setHydrated] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const locale = getCurrentLocale();

  // Espera a que el store persistente rehidrate antes de evaluar el token.
  useEffect(() => {
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
    }
    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      window.location.href = routes[locale].login;
      return;
    }
    setIsReady(true);
  }, [token, hydrated, locale]);

  // Sincroniza el path inicial y reacciona a navegación del navegador.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = initialPath || window.location.pathname || "/";
    setActivePath(currentPath);

    const onPopState = () => {
      setActivePath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [initialPath]);

  const handleNavigate = (href: string) => {
    if (typeof window === "undefined") return;
    window.history.pushState({}, "", href);
    setActivePath(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper para verificar rutas en ambos idiomas
  const matchesRoute = (patterns: string[]) => {
    return patterns.some(p => activePath === p || activePath === `${p}/`);
  };

  const startsWithRoute = (patterns: string[]) => {
    return patterns.some(p => activePath.startsWith(p));
  };

  // Extraer ID de evento de la ruta de gestión
  const getEventIdFromPath = (path: string): string | null => {
    // Español: /eventos/123 o /eventos/abc-123
    // Excluir /eventos/nuevo y /eventos/123/editar
    const esMatch = path.match(/^\/eventos\/([^/]+)\/?$/);
    if (esMatch && esMatch[1] !== "nuevo") return esMatch[1];
    // Inglés: /en/events/123 o /en/events/abc-123
    // Excluir /en/events/new y /en/events/123/edit
    const enMatch = path.match(/^\/en\/events\/([^/]+)\/?$/);
    if (enMatch && enMatch[1] !== "new") return enMatch[1];
    return null;
  };

  // Extraer ID de evento de la ruta de edición
  const getEventIdFromEditPath = (path: string): string | null => {
    // Español: /eventos/123/editar
    const esMatch = path.match(/^\/eventos\/([^/]+)\/editar\/?$/);
    if (esMatch) return esMatch[1];
    // Inglés: /en/events/123/edit
    const enMatch = path.match(/^\/en\/events\/([^/]+)\/edit\/?$/);
    if (enMatch) return enMatch[1];
    return null;
  };

  const renderContent = () => {
    // Home / Dashboard
    if (matchesRoute(["/", "/en"])) {
      return <DashboardContent />;
    }
    // Crear evento
    if (matchesRoute(["/eventos/nuevo", "/en/events/new"])) {
      return <CreateEventView onNavigate={handleNavigate} />;
    }
    // Editar evento (debe ir antes de gestión)
    const editEventId = getEventIdFromEditPath(activePath);
    if (editEventId) {
      return <EditEventView eventId={editEventId} onNavigate={handleNavigate} onBreadcrumbsChange={setBreadcrumbs} />;
    }
    // Gestión de evento específico (debe ir antes de lista de eventos)
    const eventId = getEventIdFromPath(activePath);
    if (eventId) {
      return <EventManagementView eventId={eventId} onNavigate={handleNavigate} onBreadcrumbsChange={setBreadcrumbs} />;
    }
    // Lista de eventos
    if (startsWithRoute(["/eventos", "/en/events"])) {
      return <EventsView onNavigate={handleNavigate} />;
    }
    // Placeholders para otras secciones
    if (startsWithRoute(["/ponentes", "/en/speakers"])) {
      return <SectionPlaceholder title="Ponentes" />;
    }
    if (startsWithRoute(["/organizadores", "/en/organizers"])) {
      return <SectionPlaceholder title="Organizadores" />;
    }
    if (startsWithRoute(["/inscripciones", "/en/registrations"])) {
      return <SectionPlaceholder title="Inscripciones" />;
    }
    if (startsWithRoute(["/control-acceso", "/en/access-control"])) {
      return <SectionPlaceholder title="Control de Puerta" />;
    }
    if (startsWithRoute(["/certificados", "/en/certificates"])) {
      return <SectionPlaceholder title="Certificados" />;
    }
    if (startsWithRoute(["/finanzas", "/en/finance"])) {
      return <SectionPlaceholder title="Pagos y Reportes" />;
    }
    if (startsWithRoute(["/usuarios", "/en/users"])) {
      return <SectionPlaceholder title="Usuarios" />;
    }
    if (startsWithRoute(["/padron-cip", "/en/cip-registry"])) {
      return <SectionPlaceholder title="Padrón CIP" />;
    }
    if (startsWithRoute(["/configuracion", "/en/settings"])) {
      return <SectionPlaceholder title="Configuración" />;
    }
    return (
      <SectionPlaceholder
        title="Sección en construcción"
        description="Aún no hay contenido disponible para esta ruta."
      />
    );
  };

  if (!isReady) {
    return <LoadingState message="Verificando sesión..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout
        currentPath={activePath}
        onNavigate={handleNavigate}
        breadcrumbs={breadcrumbs}
      >
        {renderContent()}
      </DashboardLayout>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
};

