import React from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Ticket,
  ScanLine,
  Award,
  CreditCard,
  UserCog,
  Database,
  Settings,
  LogOut,
} from "lucide-react";
import { AUTH_ASSETS } from "@/constants/auth";
import { useAuthStore } from "@/store/auth.store";
import { getCurrentLocale, routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  className?: string;
  currentPath?: string;
  onNavigate?: (href: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  labelKey: string;
  hrefEs: string;
  hrefEn: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  titleKey: string;
  items: NavItem[];
}

const navConfig: NavGroup[] = [
  {
    title: "GENERAL",
    titleKey: "dashboard.nav.general",
    items: [
      {
        label: "Dashboard",
        labelKey: "dashboard.nav.dashboard",
        hrefEs: "/",
        hrefEn: "/en",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "GESTIÓN DE EVENTOS",
    titleKey: "dashboard.nav.events_management",
    items: [
      {
        label: "Mis Eventos",
        labelKey: "dashboard.nav.my_events",
        hrefEs: "/eventos",
        hrefEn: "/en/events",
        icon: Calendar,
      },
      {
        label: "Ponentes",
        labelKey: "dashboard.nav.speakers",
        hrefEs: "/ponentes",
        hrefEn: "/en/speakers",
        icon: Users,
      },
      {
        label: "Organizadores",
        labelKey: "dashboard.nav.organizers",
        hrefEs: "/organizadores",
        hrefEn: "/en/organizers",
        icon: Building2,
      },
    ],
  },
  {
    title: "OPERACIONES",
    titleKey: "dashboard.nav.operations",
    items: [
      {
        label: "Inscripciones",
        labelKey: "dashboard.nav.registrations",
        hrefEs: "/inscripciones",
        hrefEn: "/en/registrations",
        icon: Ticket,
      },
      {
        label: "Control de Puerta",
        labelKey: "dashboard.nav.access_control",
        hrefEs: "/control-acceso",
        hrefEn: "/en/access-control",
        icon: ScanLine,
      },
      {
        label: "Certificados",
        labelKey: "dashboard.nav.certificates",
        hrefEs: "/certificados",
        hrefEn: "/en/certificates",
        icon: Award,
      },
    ],
  },
  {
    title: "FINANZAS",
    titleKey: "dashboard.nav.finance",
    items: [
      {
        label: "Pagos y Reportes",
        labelKey: "dashboard.nav.payments_reports",
        hrefEs: "/finanzas",
        hrefEn: "/en/finance",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "ADMINISTRACIÓN",
    titleKey: "dashboard.nav.administration",
    items: [
      {
        label: "Usuarios",
        labelKey: "dashboard.nav.users",
        hrefEs: "/usuarios",
        hrefEn: "/en/users",
        icon: UserCog,
      },
      {
        label: "Padrón CIP",
        labelKey: "dashboard.nav.cip_registry",
        hrefEs: "/padron-cip",
        hrefEn: "/en/cip-registry",
        icon: Database,
      },
      {
        label: "Configuración",
        labelKey: "dashboard.nav.settings",
        hrefEs: "/configuracion",
        hrefEn: "/en/settings",
        icon: Settings,
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  className = "",
  currentPath,
  onNavigate,
  isOpen = false,
  onClose,
}) => {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const locale = getCurrentLocale();
  const effectivePath =
    typeof window !== "undefined"
      ? currentPath ?? window.location.pathname
      : currentPath ?? "";

  const handleLogout = () => {
    logout();
    window.location.href = routes[locale].login;
  };

  const getHref = (item: NavItem) => {
    return locale === "en" ? item.hrefEn : item.hrefEs;
  };

  const isActive = (item: NavItem) => {
    const href = getHref(item);
    // Para el dashboard/home, solo coincidencia exacta
    if (href === "/" || href === "/en") {
      return effectivePath === href || effectivePath === `${href}/`;
    }
    return effectivePath.startsWith(href);
  };

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (typeof onNavigate === "function") {
      event.preventDefault();
      onNavigate(href);
    }
    // Cerrar sidebar en móvil después de navegar
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={`rui-sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`rui-sidebar ${isOpen ? "open" : ""} ${className}`}>
        {/* Header con Logo */}
        <div className="rui-sidebar-header">
          <img
            src={AUTH_ASSETS.logo}
            alt="Logo CIP"
            className="rui-sidebar-logo"
          />
          <span className="rui-sidebar-brand">CIP Connect</span>
        </div>

        {/* Navegación */}
        <ScrollArea className="rui-sidebar-nav">
          <nav>
            {navConfig.map((group, idx) => (
              <div key={idx} className="rui-sidebar-section">
                <span className="rui-sidebar-section-label">
                  {t(group.titleKey, group.title)}
                </span>
                <div>
                  {group.items.map((item, itemIdx) => {
                    const href = getHref(item);
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                      <a
                        key={itemIdx}
                        href={href}
                        onClick={(event) => handleNavigate(event, href)}
                        className={`rui-sidebar-nav-item ${active ? "active" : ""}`}
                      >
                        <Icon className="rui-sidebar-nav-item-icon" />
                        {t(item.labelKey, item.label)}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer - Cerrar Sesión */}
        <div className="rui-sidebar-footer">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="rui-sidebar-logout"
          >
            <LogOut className="rui-sidebar-nav-item-icon" />
            {t("dashboard.nav.logout", "Cerrar sesión")}
          </Button>
        </div>
      </aside>
    </>
  );
};
