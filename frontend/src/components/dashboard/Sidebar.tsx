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

interface SidebarProps {
  className?: string;
  currentPath?: string;
  onNavigate?: (href: string) => void;
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
    return locale === 'en' ? item.hrefEn : item.hrefEs;
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
  };

  return (
    <aside
      className={`flex h-screen w-64 flex-col border-r border-gray-200 bg-white ${className}`}
    >
      {/* Logo Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
        <img
          src={AUTH_ASSETS.logo}
          alt="Logo CIP"
          className="h-10 w-auto"
        />
        <span className="text-lg font-bold tracking-tight text-primary">
          CIP Connect
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-3">
          {navConfig.map((group, idx) => (
            <div key={idx}>
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t(group.titleKey, group.title)}
              </h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const href = getHref(item);
                  const active = isActive(item);
                  return (
                    <a
                      key={itemIdx}
                      href={href}
                      onClick={(event) => handleNavigate(event, href)}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 transition-colors ${
                          active
                            ? "text-primary"
                            : "text-gray-500 group-hover:text-gray-700"
                        }`}
                      />
                      {t(item.labelKey, item.label)}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
