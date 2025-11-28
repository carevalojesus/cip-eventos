import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { LoadingState } from "./LoadingState";
import { DashboardLayout } from "./DashboardLayout";
import { DashboardContent } from "./DashboardContent";
import { EventsView } from "@/components/events/EventsView";
import { CreateEventView } from "@/components/events/CreateEventView";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const SectionPlaceholder: React.FC<{ title: string; description?: string }> = ({
  title,
  description = "Próximamente podrás gestionar esta sección desde aquí.",
}) => (
  <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    <p className="mt-2 text-sm text-gray-500">{description}</p>
  </div>
);

/**
 * DashboardApp
 * Cliente protegido: verifica sesión antes de renderizar el dashboard.
 * Redirige a /login si no hay token.
 */
export const DashboardApp: React.FC = () => {
  const { token } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [activePath, setActivePath] = useState("/dashboard");
  const [hydrated, setHydrated] = useState(false);

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
      window.location.href = "/login";
      return;
    }
    setIsReady(true);
  }, [token, hydrated]);

  // Sincroniza el path inicial y reacciona a navegación del navegador.
  useEffect(() => {
    if (typeof window === "undefined") return;

    setActivePath(window.location.pathname || "/dashboard");

    const onPopState = () => {
      setActivePath(window.location.pathname || "/dashboard");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleNavigate = (href: string) => {
    if (typeof window === "undefined") return;
    window.history.pushState({}, "", href);
    setActivePath(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderContent = () => {
    if (activePath === "/dashboard" || activePath === "/dashboard/") {
      return <DashboardContent />;
    }
    if (activePath === "/dashboard/events/new") {
      return <CreateEventView />;
    }
    if (activePath.startsWith("/dashboard/events")) {
      return <EventsView onNavigate={handleNavigate} />;
    }
    if (activePath.startsWith("/dashboard/speakers")) {
      return <SectionPlaceholder title="Ponentes" />;
    }
    if (activePath.startsWith("/dashboard/organizers")) {
      return <SectionPlaceholder title="Organizadores" />;
    }
    if (activePath.startsWith("/dashboard/registrations")) {
      return <SectionPlaceholder title="Inscripciones" />;
    }
    if (activePath.startsWith("/dashboard/access-control")) {
      return <SectionPlaceholder title="Control de Puerta" />;
    }
    if (activePath.startsWith("/dashboard/certificates")) {
      return <SectionPlaceholder title="Certificados" />;
    }
    if (activePath.startsWith("/dashboard/finance")) {
      return <SectionPlaceholder title="Pagos y Reportes" />;
    }
    if (activePath.startsWith("/dashboard/users")) {
      return <SectionPlaceholder title="Usuarios" />;
    }
    if (activePath.startsWith("/dashboard/cip-registry")) {
      return <SectionPlaceholder title="Padrón CIP" />;
    }
    if (activePath.startsWith("/dashboard/settings")) {
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
      >
        {renderContent()}
      </DashboardLayout>
    </QueryClientProvider>
  );
};

