/**
 * SettingsView Component
 *
 * Vista de configuración del sistema con:
 * - Tabs: Organización, Integraciones, Email, Seguridad
 * - Layout de 2 columnas (main + sidebar)
 * - Datos reales del API
 * - Componentes modularizados
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
    Buildings,
    Plugs,
    EnvelopeSimple,
    ShieldCheck,
    Info,
    Warning,
    Gear,
    FileText,
    Database,
} from "@phosphor-icons/react";

// Components
import { Button } from "@/components/ui/button";

// Tabs
import { OrganizationTab } from "./tabs/OrganizationTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { EmailTab } from "./tabs/EmailTab";
import { SecurityTab } from "./tabs/SecurityTab";

// Components
import { SettingsSkeleton } from "./components";

// Services
import {
    settingsService,
    type AllSettingsResponse,
} from "@/services/settings.service";

// Styles
import "./SettingsView.css";

// ============================================
// Types
// ============================================

type TabId = "organization" | "integrations" | "email" | "security";

// ============================================
// Error State
// ============================================

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
    const { t } = useTranslation();
    return (
        <div className="settings">
            <div className="settings__error">
                <Warning size={48} weight="duotone" />
                <h2>{t("error_state.title", "Error al cargar datos")}</h2>
                <p>
                    {t(
                        "settings.load_error",
                        "No se pudieron cargar las configuraciones"
                    )}
                </p>
                <Button onClick={onRetry} variant="outline">
                    {t("common.retry", "Reintentar")}
                </Button>
            </div>
        </div>
    );
};

// ============================================
// Main SettingsView Component
// ============================================

export const SettingsView: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabId>("organization");

    const {
        data: settings,
        isLoading,
        isError,
        refetch,
    } = useQuery<AllSettingsResponse>({
        queryKey: ["settings"],
        queryFn: settingsService.getAllSettings,
        staleTime: 5 * 60 * 1000, // 5 min
    });

    if (isLoading) {
        return <SettingsSkeleton />;
    }

    if (isError || !settings) {
        return <ErrorState onRetry={() => refetch()} />;
    }

    return (
        <div className="settings">
            {/* Header */}
            <div className="settings__header">
                <div className="settings__header-title">
                    <h1 className="settings__title">
                        {t("settings.title", "Configuración")}
                    </h1>
                    <p className="settings__subtitle">
                        {t(
                            "settings.subtitle",
                            "Administra la configuración del sistema, integraciones y seguridad"
                        )}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="settings__tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "organization"}
                    className={`settings__tab ${
                        activeTab === "organization" ? "settings__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("organization")}
                >
                    <Buildings size={18} />
                    {t("settings.tab_organization", "Organización")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "integrations"}
                    className={`settings__tab ${
                        activeTab === "integrations" ? "settings__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("integrations")}
                >
                    <Plugs size={18} />
                    {t("settings.tab_integrations", "Integraciones")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "email"}
                    className={`settings__tab ${
                        activeTab === "email" ? "settings__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("email")}
                >
                    <EnvelopeSimple size={18} />
                    {t("settings.tab_email", "Email")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "security"}
                    className={`settings__tab ${
                        activeTab === "security" ? "settings__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("security")}
                >
                    <ShieldCheck size={18} />
                    {t("settings.tab_security", "Seguridad")}
                </button>
            </div>

            {/* Main Layout */}
            <div className="settings__layout">
                {/* Left: Tab Content */}
                <div className="settings__main">
                    {activeTab === "organization" && (
                        <OrganizationTab data={settings.organization} />
                    )}
                    {activeTab === "integrations" && (
                        <IntegrationsTab data={settings.integrations} />
                    )}
                    {activeTab === "email" && (
                        <EmailTab data={settings.email} />
                    )}
                    {activeTab === "security" && (
                        <SecurityTab data={settings.security} />
                    )}
                </div>

                {/* Right: Sidebar */}
                <aside className="settings__sidebar">
                    {/* Environment Card */}
                    <div className="settings__sidebar-card">
                        <h4 className="settings__sidebar-title">
                            {t("settings.environment", "Entorno")}
                        </h4>
                        <div
                            className={`settings__env-badge ${
                                settings.environment === "production"
                                    ? "settings__env-badge--prod"
                                    : ""
                            }`}
                        >
                            <Gear size={16} />
                            <span>
                                {settings.environment === "production"
                                    ? "Production"
                                    : "Development"}
                            </span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="settings__sidebar-card">
                        <h4 className="settings__sidebar-title">
                            {t("settings.quick_links", "Enlaces Rápidos")}
                        </h4>
                        <div className="settings__quick-links">
                            <a href="#" className="settings__quick-link">
                                <FileText size={16} />
                                {t("settings.documentation", "Documentación")}
                            </a>
                            <a href="#" className="settings__quick-link">
                                <Database size={16} />
                                {t("settings.api_status", "Estado de APIs")}
                            </a>
                        </div>
                    </div>

                    {/* Admin Notice */}
                    <div className="settings__sidebar-notice">
                        <Info size={16} />
                        <p>
                            {t(
                                "settings.admin_notice",
                                "Solo los administradores pueden modificar estas configuraciones."
                            )}
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default SettingsView;
