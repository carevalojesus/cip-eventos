/**
 * SettingsView Component
 *
 * Vista de configuración del sistema con:
 * - Tabs: Organización, Integraciones, Email, Seguridad
 * - Layout de 2 columnas (main + sidebar)
 * - Datos reales del API
 * - Consistente con ProfileView y UserDetailView
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Buildings,
    Plugs,
    EnvelopeSimple,
    ShieldCheck,
    Info,
    SpinnerGap,
    Globe,
    CreditCard,
    IdentificationCard,
    Receipt,
    PaperPlaneTilt,
    Key,
    Database,
    CheckCircle,
    XCircle,
    Warning,
    Gear,
    FileText,
    PencilSimple,
    FloppyDisk,
    X,
} from "@phosphor-icons/react";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Services
import {
    settingsService,
    type AllSettingsResponse,
    type OrganizationConfig,
    type IntegrationStatus as IntegrationStatusType,
    type EmailConfig,
    type SecurityConfig,
} from "@/services/settings.service";

// Styles
import "./SettingsView.css";

// ============================================
// Types
// ============================================

type TabId = "organization" | "integrations" | "email" | "security";

interface IntegrationCardData extends IntegrationStatusType {
    icon: React.ReactNode;
}

// ============================================
// Loading Skeleton
// ============================================

const LoadingSkeleton: React.FC = () => (
    <div className="settings">
        <div className="settings__header">
            <div className="settings__header-title">
                <Skeleton width={200} height={28} />
                <Skeleton
                    width={300}
                    height={16}
                    style={{ marginTop: "var(--space-2)" }}
                />
            </div>
        </div>

        <div
            style={{
                display: "flex",
                gap: "var(--space-4)",
                marginBottom: "var(--space-6)",
                borderBottom: "1px solid var(--color-grey-200)",
                paddingBottom: "var(--space-3)",
            }}
        >
            <Skeleton width={120} height={20} />
            <Skeleton width={120} height={20} />
            <Skeleton width={100} height={20} />
            <Skeleton width={100} height={20} />
        </div>

        <div className="settings__layout">
            <div className="settings__main">
                <div className="settings__section">
                    <Skeleton
                        width={120}
                        height={20}
                        style={{ marginBottom: "var(--space-4)" }}
                    />
                    <div className="settings__form-grid">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <Skeleton
                                    width="40%"
                                    height={14}
                                    style={{ marginBottom: "var(--space-2)" }}
                                />
                                <Skeleton
                                    width="100%"
                                    height={40}
                                    style={{ borderRadius: "var(--radius-md)" }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="settings__sidebar">
                <div className="settings__sidebar-card">
                    <Skeleton width={100} height={16} style={{ marginBottom: "var(--space-3)" }} />
                    <Skeleton width="100%" height={36} style={{ borderRadius: "var(--radius-md)" }} />
                </div>
            </div>
        </div>
    </div>
);

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
                <p>{t("settings.load_error", "No se pudieron cargar las configuraciones")}</p>
                <Button onClick={onRetry} variant="outline">
                    {t("common.retry", "Reintentar")}
                </Button>
            </div>
        </div>
    );
};

// ============================================
// ReadOnly Field Component
// ============================================

interface ReadOnlyFieldProps {
    label: string;
    value: string;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value }) => (
    <div className="settings__readonly-field">
        <span className="settings__readonly-label">{label}</span>
        <div className="settings__readonly-value">{value || "-"}</div>
    </div>
);

// ============================================
// Editable Field Component
// ============================================

interface EditableFieldProps {
    label: string;
    value: string;
    name: string;
    onChange: (name: string, value: string) => void;
    isEditing: boolean;
    placeholder?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
    label,
    value,
    name,
    onChange,
    isEditing,
    placeholder,
}) => (
    <div className="settings__readonly-field">
        <span className="settings__readonly-label">{label}</span>
        {isEditing ? (
            <Input
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                placeholder={placeholder}
            />
        ) : (
            <div className="settings__readonly-value">{value || "-"}</div>
        )}
    </div>
);

// ============================================
// Integration Card Component
// ============================================

interface IntegrationCardProps {
    integration: IntegrationCardData;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration }) => {
    const { t } = useTranslation();

    return (
        <div className={`settings__integration-card ${integration.enabled ? "settings__integration-card--enabled" : ""}`}>
            <div className="settings__integration-header">
                <div className="settings__integration-icon">
                    {integration.icon}
                </div>
                <div className="settings__integration-info">
                    <h4 className="settings__integration-name">{integration.name}</h4>
                    <p className="settings__integration-desc">{integration.description}</p>
                </div>
                <div className="settings__integration-status">
                    {integration.enabled ? (
                        <span className="settings__status-badge settings__status-badge--success">
                            <CheckCircle size={14} weight="fill" />
                            {t("settings.enabled", "Habilitado")}
                        </span>
                    ) : (
                        <span className="settings__status-badge settings__status-badge--disabled">
                            <XCircle size={14} weight="fill" />
                            {t("settings.disabled", "Deshabilitado")}
                        </span>
                    )}
                </div>
            </div>
            {integration.enabled && !integration.configured && (
                <div className="settings__integration-warning">
                    <Warning size={16} />
                    <span>{t("settings.needs_configuration", "Requiere configuración")}</span>
                </div>
            )}
        </div>
    );
};

// ============================================
// Organization Tab
// ============================================

interface OrganizationTabProps {
    data: OrganizationConfig;
}

const OrganizationTab: React.FC<OrganizationTabProps> = ({ data }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<OrganizationConfig>(data);

    const updateMutation = useMutation({
        mutationFn: settingsService.updateOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            setIsEditing(false);
            toast.success(t("settings.update_success", "Configuración actualizada"));
        },
        onError: () => {
            toast.error(t("settings.update_error", "Error al actualizar"));
        },
    });

    const handleChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    const handleCancel = () => {
        setFormData(data);
        setIsEditing(false);
    };

    return (
        <div className="settings__form">
            {/* Info Alert */}
            <div className="settings__alert settings__alert--info">
                <Info
                    size={20}
                    weight="duotone"
                    className="settings__alert-icon"
                    style={{ color: "var(--color-cyan-600)" }}
                />
                <div className="settings__alert-content">
                    <p className="settings__alert-title">
                        {t("settings.org_info_title", "Información de la Organización")}
                    </p>
                    <p className="settings__alert-text">
                        {t("settings.org_info_desc", "Estos datos se muestran en certificados, facturas y documentos oficiales.")}
                    </p>
                </div>
                {!isEditing && (
                    <button
                        type="button"
                        className="settings__edit-btn"
                        onClick={() => setIsEditing(true)}
                    >
                        <PencilSimple size={16} weight="bold" />
                        {t("common.edit", "Editar")}
                    </button>
                )}
            </div>

            {/* Section: Datos Generales */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--org">
                        <Buildings size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.general_data", "Datos Generales")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t("settings.general_data_desc", "Información básica de la organización")}
                        </p>
                    </div>
                </div>

                <div className="settings__form-grid">
                    <EditableField
                        label={t("settings.org_name", "Razón Social")}
                        value={formData.name}
                        name="name"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <EditableField
                        label={t("settings.org_short_name", "Nombre Corto")}
                        value={formData.shortName}
                        name="shortName"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <EditableField
                        label={t("settings.ruc", "RUC")}
                        value={formData.ruc}
                        name="ruc"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <EditableField
                        label={t("settings.phone", "Teléfono")}
                        value={formData.phone}
                        name="phone"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <div className="settings__form-grid--full">
                        <EditableField
                            label={t("settings.address", "Dirección Fiscal")}
                            value={formData.address}
                            name="address"
                            onChange={handleChange}
                            isEditing={isEditing}
                        />
                    </div>
                </div>
            </section>

            {/* Section: Contacto */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--contact">
                        <Globe size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.contact", "Contacto Web")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t("settings.contact_desc", "Presencia digital de la organización")}
                        </p>
                    </div>
                </div>

                <div className="settings__form-grid">
                    <EditableField
                        label={t("settings.email", "Correo Institucional")}
                        value={formData.email}
                        name="email"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <EditableField
                        label={t("settings.website", "Sitio Web")}
                        value={formData.website}
                        name="website"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                </div>
            </section>

            {/* Edit Actions */}
            {isEditing && (
                <div className="settings__form-actions">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                    >
                        <X size={16} />
                        {t("common.cancel", "Cancelar")}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? (
                            <SpinnerGap size={16} className="animate-spin" />
                        ) : (
                            <FloppyDisk size={16} />
                        )}
                        {t("form.save_changes", "Guardar Cambios")}
                    </Button>
                </div>
            )}
        </div>
    );
};

// ============================================
// Integrations Tab
// ============================================

interface IntegrationsTabProps {
    data: IntegrationStatusType[];
}

const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ data }) => {
    const { t } = useTranslation();

    // Map icons to integrations
    const iconMap: Record<string, React.ReactNode> = {
        reniec: <IdentificationCard size={24} weight="duotone" />,
        paypal: <CreditCard size={24} weight="duotone" />,
        cip: <Database size={24} weight="duotone" />,
        sunat: <Receipt size={24} weight="duotone" />,
        twilio: <PaperPlaneTilt size={24} weight="duotone" />,
    };

    const integrationsWithIcons: IntegrationCardData[] = data.map((int) => ({
        ...int,
        icon: iconMap[int.key] || <Plugs size={24} weight="duotone" />,
    }));

    return (
        <div className="settings__form">
            {/* Info Alert */}
            <div className="settings__alert settings__alert--info">
                <Plugs
                    size={20}
                    weight="duotone"
                    className="settings__alert-icon"
                    style={{ color: "var(--color-cyan-600)" }}
                />
                <div className="settings__alert-content">
                    <p className="settings__alert-title">
                        {t("settings.integrations_title", "Integraciones del Sistema")}
                    </p>
                    <p className="settings__alert-text">
                        {t("settings.integrations_desc", "Servicios externos conectados a la plataforma. Contacta al administrador para modificar estas configuraciones.")}
                    </p>
                </div>
            </div>

            {/* Integrations List */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--integrations">
                        <Plugs size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.active_integrations", "Integraciones Activas")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t("settings.active_integrations_desc", "Estado de los servicios externos")}
                        </p>
                    </div>
                </div>

                <div className="settings__integrations-grid">
                    {integrationsWithIcons.map((integration) => (
                        <IntegrationCard
                            key={integration.key}
                            integration={integration}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};

// ============================================
// Email Tab
// ============================================

interface EmailTabProps {
    data: EmailConfig;
}

const EmailTab: React.FC<EmailTabProps> = ({ data }) => {
    const { t } = useTranslation();

    return (
        <div className="settings__form">
            {/* Status Alert */}
            <div className={`settings__alert ${data.isConfigured ? "settings__alert--success" : "settings__alert--warning"}`}>
                {data.isConfigured ? (
                    <CheckCircle
                        size={20}
                        weight="fill"
                        className="settings__alert-icon"
                        style={{ color: "var(--color-green-600)" }}
                    />
                ) : (
                    <Warning
                        size={20}
                        weight="fill"
                        className="settings__alert-icon"
                        style={{ color: "var(--color-yellow-600)" }}
                    />
                )}
                <div className="settings__alert-content">
                    <p className="settings__alert-title">
                        {data.isConfigured
                            ? t("settings.email_configured", "Servidor de correo configurado")
                            : t("settings.email_not_configured", "Servidor de correo no configurado")}
                    </p>
                    <p className="settings__alert-text">
                        {data.isConfigured
                            ? t("settings.email_configured_desc", "El sistema puede enviar correos de confirmación, notificaciones y certificados.")
                            : t("settings.email_not_configured_desc", "Configure el servidor SMTP para habilitar el envío de correos.")}
                    </p>
                </div>
            </div>

            {/* Section: SMTP Config */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--email">
                        <EnvelopeSimple size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.smtp_config", "Configuración SMTP")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t("settings.smtp_config_desc", "Servidor de correo saliente")}
                        </p>
                    </div>
                </div>

                <div className="settings__form-grid">
                    <ReadOnlyField
                        label={t("settings.smtp_host", "Servidor SMTP")}
                        value={data.smtpHost}
                    />
                    <ReadOnlyField
                        label={t("settings.smtp_port", "Puerto")}
                        value={data.smtpPort}
                    />
                    <ReadOnlyField
                        label={t("settings.smtp_user", "Usuario")}
                        value={data.smtpUser}
                    />
                    <ReadOnlyField
                        label={t("settings.from_name", "Nombre Remitente")}
                        value={data.fromName}
                    />
                </div>
            </section>
        </div>
    );
};

// ============================================
// Security Tab
// ============================================

interface SecurityTabProps {
    data: SecurityConfig;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ data }) => {
    const { t } = useTranslation();

    return (
        <div className="settings__form">
            {/* Info Alert */}
            <div className="settings__alert settings__alert--neutral">
                <ShieldCheck
                    size={20}
                    weight="duotone"
                    className="settings__alert-icon"
                    style={{ color: "var(--color-grey-500)" }}
                />
                <div className="settings__alert-content">
                    <p className="settings__alert-title">
                        {t("settings.security_title", "Configuración de Seguridad")}
                    </p>
                    <p className="settings__alert-text">
                        {t("settings.security_desc", "Estas configuraciones afectan la seguridad de todas las cuentas de usuario.")}
                    </p>
                </div>
            </div>

            {/* Section: Authentication */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--security">
                        <Key size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.auth_config", "Autenticación")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t("settings.auth_config_desc", "Políticas de sesiones y contraseñas")}
                        </p>
                    </div>
                </div>

                <div className="settings__form-grid">
                    <ReadOnlyField
                        label={t("settings.session_duration", "Duración de Sesión")}
                        value={data.jwtExpiresIn}
                    />
                    <ReadOnlyField
                        label={t("settings.session_timeout", "Timeout de Inactividad")}
                        value={data.sessionTimeout}
                    />
                    <ReadOnlyField
                        label={t("settings.password_min_length", "Longitud Mínima Contraseña")}
                        value={`${data.passwordMinLength} caracteres`}
                    />
                    <ReadOnlyField
                        label={t("settings.max_login_attempts", "Intentos de Login")}
                        value={`${data.maxLoginAttempts} máximo`}
                    />
                </div>
            </section>

            {/* Section: 2FA */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--2fa">
                        <ShieldCheck size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.two_factor", "Autenticación de Dos Factores")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t("settings.two_factor_desc", "Capa adicional de seguridad")}
                        </p>
                    </div>
                </div>

                <div className="settings__2fa-status">
                    <div className="settings__2fa-info">
                        <span className={`settings__status-badge ${data.twoFactorEnabled ? "settings__status-badge--success" : "settings__status-badge--disabled"}`}>
                            {data.twoFactorEnabled ? (
                                <>
                                    <CheckCircle size={14} weight="fill" />
                                    {t("settings.2fa_enabled", "Habilitado")}
                                </>
                            ) : (
                                <>
                                    <XCircle size={14} weight="fill" />
                                    {t("settings.2fa_disabled", "No habilitado")}
                                </>
                            )}
                        </span>
                        <p className="settings__2fa-note">
                            {t("settings.2fa_note", "La autenticación de dos factores puede ser habilitada por cada usuario en su perfil.")}
                        </p>
                    </div>
                </div>
            </section>
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
        return <LoadingSkeleton />;
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
                        {t("settings.subtitle", "Administra la configuración del sistema, integraciones y seguridad")}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="settings__tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "organization"}
                    className={`settings__tab ${activeTab === "organization" ? "settings__tab--active" : ""}`}
                    onClick={() => setActiveTab("organization")}
                >
                    <Buildings size={18} />
                    {t("settings.tab_organization", "Organización")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "integrations"}
                    className={`settings__tab ${activeTab === "integrations" ? "settings__tab--active" : ""}`}
                    onClick={() => setActiveTab("integrations")}
                >
                    <Plugs size={18} />
                    {t("settings.tab_integrations", "Integraciones")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "email"}
                    className={`settings__tab ${activeTab === "email" ? "settings__tab--active" : ""}`}
                    onClick={() => setActiveTab("email")}
                >
                    <EnvelopeSimple size={18} />
                    {t("settings.tab_email", "Email")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "security"}
                    className={`settings__tab ${activeTab === "security" ? "settings__tab--active" : ""}`}
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
                    {activeTab === "email" && <EmailTab data={settings.email} />}
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
                        <div className={`settings__env-badge ${settings.environment === "production" ? "settings__env-badge--prod" : ""}`}>
                            <Gear size={16} />
                            <span>{settings.environment === "production" ? "Production" : "Development"}</span>
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
                            {t("settings.admin_notice", "Solo los administradores pueden modificar estas configuraciones.")}
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default SettingsView;
