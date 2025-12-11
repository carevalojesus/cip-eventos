import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { LoadingState } from "./LoadingState";
import { DashboardContent } from "./DashboardContent";
import { EventsView } from "@/components/events/EventsView";
import { EventManagementView } from "@/components/events/EventManagementView";
import { EditEventView } from "@/components/events/EditEventView";
import { UsersView, CreateUserView, UserDetailView } from "@/components/users";
import { OrganizersView, OrganizerDetailView } from "@/components/organizers";
import { ProfileView } from "@/components/profile";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getCurrentLocale, routes } from "@/lib/routes";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout";
import type { Breadcrumb } from "@/types/breadcrumb";
import { useTranslation } from "react-i18next";
import { UserRole } from "@/constants/roles";
import { getDefaultNavForRole, canAccessNav } from "@/config/navigation";

const SectionPlaceholder: React.FC<{ title: string; description?: string; defaultDescription?: string }> = ({
  title,
  description,
  defaultDescription = "Próximamente podrás gestionar esta sección desde aquí.",
}) => (
  <div className="rounded-xl border border-dashed border-grey-200 bg-white p-8 text-center shadow-sm">
    <h2 className="text-xl font-semibold text-grey-900">{title}</h2>
    <p className="mt-2 text-sm text-grey-500">{description || defaultDescription}</p>
  </div>
);

interface RuiDashboardAppProps {
  initialPath?: string;
}

/**
 * RuiDashboardApp
 * Nueva implementación del Dashboard usando el nuevo AppLayout de Refactoring UI
 * Preserva toda la lógica de autenticación, rutas, i18n y queries del DashboardApp original
 */
export const RuiDashboardApp: React.FC<RuiDashboardAppProps> = ({ initialPath }) => {
  const { token, user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [activePath, setActivePath] = useState(initialPath || "/");
  const [hydrated, setHydrated] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const locale = getCurrentLocale();

  // Espera a que el store persistente rehidrate antes de evaluar el token
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

    // Obtener el token directamente del store hidratado
    // (evita race condition con el estado reactivo)
    const currentToken = useAuthStore.getState().token;

    if (!currentToken) {
      window.location.href = routes[locale].login;
      return;
    }
    setIsReady(true);
  }, [hydrated, locale]);

  // Sincroniza el path inicial y reacciona a navegación del navegador
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

  // Mapear ruta actual a navId del sidebar
  const getNavIdFromPath = (path: string): string => {
    // Dashboard / Home
    if (path === "/" || path === "/en" || path === "/en/") {
      return "dashboard";
    }
    // Eventos
    if (path.startsWith("/eventos") || path.startsWith("/en/events")) {
      return "eventos";
    }
    // Ponentes
    if (path.startsWith("/ponentes") || path.startsWith("/en/speakers")) {
      return "ponentes";
    }
    // Organizadores
    if (path.startsWith("/organizadores") || path.startsWith("/en/organizers")) {
      return "organizadores";
    }
    // Inscripciones
    if (path.startsWith("/inscripciones") || path.startsWith("/en/registrations")) {
      return "inscripciones";
    }
    // Control de acceso
    if (path.startsWith("/control-acceso") || path.startsWith("/en/access-control")) {
      return "control-acceso";
    }
    // Certificados
    if (path.startsWith("/certificados") || path.startsWith("/en/certificates")) {
      return "certificados";
    }
    // Finanzas - Ingresos
    if (path.startsWith("/ingresos") || path.startsWith("/en/revenue")) {
      return "ingresos";
    }
    // Finanzas - Pagos
    if (path.startsWith("/pagos") || path.startsWith("/en/payments")) {
      return "pagos";
    }
    // Finanzas - Reportes
    if (path.startsWith("/reportes") || path.startsWith("/en/reports")) {
      return "reportes";
    }
    // Finanzas (general)
    if (path.startsWith("/finanzas") || path.startsWith("/en/finance")) {
      return "ingresos"; // Default a ingresos
    }
    // Usuarios
    if (path.startsWith("/usuarios") || path.startsWith("/en/users")) {
      return "usuarios";
    }
    // Padrón CIP
    if (path.startsWith("/padron-cip") || path.startsWith("/en/cip-registry")) {
      return "padron-cip";
    }
    // Configuración
    if (path.startsWith("/configuracion") || path.startsWith("/en/settings")) {
      return "configuracion";
    }
    return "dashboard";
  };

  // Mapear navId a ruta
  const getPathFromNavId = (navId: string): string => {
    const isEnglish = locale === "en";
    switch (navId) {
      case "dashboard":
        return isEnglish ? "/en" : "/";
      case "eventos":
        return isEnglish ? "/en/events" : "/eventos";
      case "ponentes":
        return isEnglish ? "/en/speakers" : "/ponentes";
      case "organizadores":
        return isEnglish ? "/en/organizers" : "/organizadores";
      case "inscripciones":
        return isEnglish ? "/en/registrations" : "/inscripciones";
      case "control-acceso":
        return isEnglish ? "/en/access-control" : "/control-acceso";
      case "certificados":
        return isEnglish ? "/en/certificates" : "/certificados";
      case "ingresos":
        return isEnglish ? "/en/revenue" : "/ingresos";
      case "pagos":
        return isEnglish ? "/en/payments" : "/pagos";
      case "reportes":
        return isEnglish ? "/en/reports" : "/reportes";
      case "usuarios":
        return isEnglish ? "/en/users" : "/usuarios";
      case "padron-cip":
        return isEnglish ? "/en/cip-registry" : "/padron-cip";
      case "configuracion":
        return isEnglish ? "/en/settings" : "/configuracion";
      default:
        return isEnglish ? "/en" : "/";
    }
  };

  const handleNavigate = (href: string) => {
    if (typeof window === "undefined") return;
    window.history.pushState({}, "", href);
    setActivePath(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavChange = (navId: string) => {
    const newPath = getPathFromNavId(navId);
    handleNavigate(newPath);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = routes[locale].login;
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
      return <SectionPlaceholder title={t("sections.create_event", "Crear Evento")} description={t("sections.coming_soon")} />;
    }
    // Editar evento (debe ir antes de gestión)
    const editEventId = getEventIdFromEditPath(activePath);
    if (editEventId) {
      return <EditEventView eventId={editEventId} onNavigate={handleNavigate} onBreadcrumbsChange={setBreadcrumbs} />;
    }
    // Gestión de evento específico (debe ir antes de lista de eventos)
    const eventId = getEventIdFromPath(activePath);
    if (eventId) {
      return <EventManagementView eventId={eventId} onNavigate={handleNavigate} />;
    }
    // Lista de eventos
    if (startsWithRoute(["/eventos", "/en/events"])) {
      return <EventsView onNavigate={handleNavigate} />;
    }
    // Placeholders para otras secciones
    if (startsWithRoute(["/ponentes", "/en/speakers"])) {
      return <SectionPlaceholder title={t("sections.speakers")} description={t("sections.coming_soon")} />;
    }
    // Detalle de organizador
    const organizerDetailMatch = activePath.match(/^\/(organizadores|en\/organizers)\/([a-zA-Z0-9-]+)$/);
    if (organizerDetailMatch) {
      const organizerId = organizerDetailMatch[2];
      return <OrganizerDetailView organizerId={organizerId} onNavigate={handleNavigate} />;
    }
    // Lista de organizadores
    if (startsWithRoute(["/organizadores", "/en/organizers"])) {
      return <OrganizersView onNavigate={handleNavigate} />;
    }
    if (startsWithRoute(["/inscripciones", "/en/registrations"])) {
      return <SectionPlaceholder title={t("sections.registrations")} description={t("sections.coming_soon")} />;
    }
    if (startsWithRoute(["/control-acceso", "/en/access-control"])) {
      return <SectionPlaceholder title={t("sections.access_control")} description={t("sections.coming_soon")} />;
    }
    if (startsWithRoute(["/certificados", "/en/certificates"])) {
      return <SectionPlaceholder title={t("sections.certificates")} description={t("sections.coming_soon")} />;
    }
    // Finanzas
    if (startsWithRoute(["/ingresos", "/en/revenue"])) {
      return <SectionPlaceholder title={t("sections.revenue")} description={t("sections.coming_soon")} />;
    }
    if (startsWithRoute(["/pagos", "/en/payments"])) {
      return <SectionPlaceholder title={t("sections.payments")} description={t("sections.coming_soon")} />;
    }
    if (startsWithRoute(["/reportes", "/en/reports"])) {
      return <SectionPlaceholder title={t("sections.reports")} description={t("sections.coming_soon")} />;
    }
    if (startsWithRoute(["/finanzas", "/en/finance"])) {
      return <SectionPlaceholder title={t("sections.payments_reports")} description={t("sections.coming_soon")} />;
    }
    // Crear usuario
    if (matchesRoute(["/usuarios/nuevo", "/en/users/new"])) {
      return <CreateUserView onNavigate={handleNavigate} />;
    }
    // Detalle de usuario
    const userDetailMatch = activePath.match(/^\/(usuarios|en\/users)\/([a-zA-Z0-9-]+)$/);
    if (userDetailMatch && userDetailMatch[2] !== "nuevo" && userDetailMatch[2] !== "new") {
      const userId = userDetailMatch[2];
      return <UserDetailView userId={userId} onNavigate={handleNavigate} />;
    }
    // Lista de usuarios
    if (startsWithRoute(["/usuarios", "/en/users"])) {
      return <UsersView onNavigate={handleNavigate} />;
    }
    if (startsWithRoute(["/padron-cip", "/en/cip-registry"])) {
      return <SectionPlaceholder title={t("sections.cip_registry")} description={t("sections.coming_soon")} />;
    }
    if (startsWithRoute(["/configuracion", "/en/settings"])) {
      return <SectionPlaceholder title={t("sections.settings")} description={t("sections.coming_soon")} />;
    }
    // Mi Perfil
    if (matchesRoute(["/mi-perfil", "/en/my-profile"])) {
      return <ProfileView />;
    }
    return (
      <SectionPlaceholder
        title={t("sections.under_construction")}
        description={t("sections.no_content")}
      />
    );
  };

  // Obtener el rol del usuario (con fallback a PARTICIPANTE)
  const userRole = (user?.role as UserRole) || UserRole.PARTICIPANTE;

  // Preparar datos de usuario para el layout
  const layoutUser = {
    name: user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "Usuario",
    role: userRole,
    avatar: user?.avatar,
  };

  if (!isReady) {
    return <LoadingState message="Verificando sesión..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout
        user={layoutUser}
        activeNav={getNavIdFromPath(activePath)}
        onNavChange={handleNavChange}
        onLogout={handleLogout}
      >
        {renderContent()}
      </AppLayout>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
};
