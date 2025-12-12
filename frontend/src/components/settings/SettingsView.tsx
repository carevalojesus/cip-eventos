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
    onConfigure: (key: string) => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration, onConfigure }) => {
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
                <div className="settings__integration-actions">
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfigure(integration.key)}
                    >
                        <Gear size={16} />
                        {t("settings.configure", "Configurar")}
                    </Button>
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
                    <Button
                        variant="soft"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    >
                        <PencilSimple size={16} weight="bold" />
                        {t("common.edit", "Editar")}
                    </Button>
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
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                    >
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
// Integration Edit Modal Component
// ============================================

interface IntegrationFieldConfig {
    key: string;
    label: string;
    type: "text" | "password" | "select";
    placeholder?: string;
    options?: { value: string; label: string }[];
    isSecret?: boolean;
}

const integrationFields: Record<string, IntegrationFieldConfig[]> = {
    reniec: [
        { key: "enabled", label: "Habilitado", type: "select", options: [{ value: "true", label: "Sí" }, { value: "false", label: "No" }] },
        { key: "apiUrl", label: "URL del API", type: "text", placeholder: "https://api.decolecta.pe/reniec" },
        { key: "apiToken", label: "Token de Autenticación", type: "password", isSecret: true },
    ],
    paypal: [
        { key: "enabled", label: "Habilitado", type: "select", options: [{ value: "true", label: "Sí" }, { value: "false", label: "No" }] },
        { key: "mode", label: "Modo", type: "select", options: [{ value: "sandbox", label: "Sandbox (Pruebas)" }, { value: "live", label: "Live (Producción)" }] },
        { key: "clientId", label: "Client ID", type: "text", placeholder: "Client ID de PayPal" },
        { key: "clientSecret", label: "Client Secret", type: "password", isSecret: true },
    ],
    cip: [
        { key: "enabled", label: "Habilitado", type: "select", options: [{ value: "true", label: "Sí" }, { value: "false", label: "No" }] },
        { key: "apiUrl", label: "URL del API", type: "text", placeholder: "https://api.cip.org.pe/padron" },
        { key: "apiKey", label: "API Key", type: "password", isSecret: true },
    ],
    sunat: [
        { key: "enabled", label: "Habilitado", type: "select", options: [{ value: "true", label: "Sí" }, { value: "false", label: "No" }] },
        { key: "ruc", label: "RUC Emisor", type: "text", placeholder: "20100039207" },
        { key: "username", label: "Usuario SOL", type: "text", placeholder: "MODDATOS" },
        { key: "password", label: "Clave SOL", type: "password", isSecret: true },
        { key: "certificatePath", label: "Ruta del Certificado", type: "text", placeholder: "/path/to/certificate.pfx" },
    ],
    twilio: [
        { key: "enabled", label: "Habilitado", type: "select", options: [{ value: "true", label: "Sí" }, { value: "false", label: "No" }] },
        { key: "accountSid", label: "Account SID", type: "text", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
        { key: "authToken", label: "Auth Token", type: "password", isSecret: true },
        { key: "phoneNumber", label: "Número de Teléfono", type: "text", placeholder: "+15551234567" },
    ],
};

interface IntegrationEditModalProps {
    integrationKey: string;
    integrationName: string;
    isOpen: boolean;
    onClose: () => void;
}

const IntegrationEditModal: React.FC<IntegrationEditModalProps> = ({
    integrationKey,
    integrationName,
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    // Fetch integration config
    const { data: config, isLoading } = useQuery({
        queryKey: ["integration-config", integrationKey],
        queryFn: () => settingsService.getIntegrationConfig(integrationKey),
        enabled: isOpen && !!integrationKey,
    });

    // Update form when config loads - initialize with defaults for select fields
    React.useEffect(() => {
        if (config) {
            const fields = integrationFields[integrationKey] || [];
            const initialData = { ...config };

            // Set default values for select fields if not present
            fields.forEach((field) => {
                if (field.type === "select" && !initialData[field.key]) {
                    initialData[field.key] = field.options?.[1]?.value || "false";
                }
            });

            setFormData(initialData);
        }
    }, [config, integrationKey]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: Record<string, string>) =>
            settingsService.updateIntegration(integrationKey, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            queryClient.invalidateQueries({ queryKey: ["integration-config", integrationKey] });
            toast.success(t("settings.integration_updated", "Integración actualizada correctamente"));
            onClose();
        },
        onError: () => {
            toast.error(t("settings.integration_update_error", "Error al actualizar la integración"));
        },
    });

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const toggleSecretVisibility = (key: string) => {
        setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const fields = integrationFields[integrationKey] || [];

    if (!isOpen) return null;

    return (
        <div className="settings__modal-overlay" onClick={onClose}>
            <div className="settings__modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings__modal-header">
                    <h3 className="settings__modal-title">
                        {t("settings.configure_integration", "Configurar")} {integrationName}
                    </h3>
                    <button
                        type="button"
                        className="settings__modal-close"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="settings__modal-loading">
                        <SpinnerGap size={32} className="animate-spin" />
                        <p>{t("common.loading", "Cargando...")}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="settings__modal-body">
                            {fields.map((field) => (
                                <div key={field.key} className="settings__modal-field">
                                    <label className="settings__modal-label">
                                        {field.label}
                                        {field.isSecret && (
                                            <span className="settings__modal-secret-badge">
                                                <Key size={12} />
                                                {t("settings.secret", "Secreto")}
                                            </span>
                                        )}
                                    </label>
                                    {field.type === "select" ? (
                                        <select
                                            className="settings__modal-select"
                                            value={formData[field.key] || (field.options?.[1]?.value ?? "")}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                        >
                                            {field.options?.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="settings__modal-input-wrapper">
                                            <Input
                                                type={field.isSecret && !showSecrets[field.key] ? "password" : "text"}
                                                value={formData[field.key] || ""}
                                                onChange={(e) => handleChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                            />
                                            {field.isSecret && (
                                                <button
                                                    type="button"
                                                    className="settings__modal-toggle-secret"
                                                    onClick={() => toggleSecretVisibility(field.key)}
                                                >
                                                    {showSecrets[field.key] ? (
                                                        <XCircle size={16} />
                                                    ) : (
                                                        <CheckCircle size={16} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {field.isSecret && formData[`${field.key}_hasValue`] === "true" && (
                                        <p className="settings__modal-hint">
                                            {t("settings.secret_configured", "Ya configurado. Deja vacío para mantener el valor actual.")}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="settings__modal-footer">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={updateMutation.isPending}
                            >
                                {t("common.cancel", "Cancelar")}
                            </Button>
                            <Button
                                type="submit"
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
                    </form>
                )}
            </div>
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
    const [selectedIntegration, setSelectedIntegration] = useState<{
        key: string;
        name: string;
    } | null>(null);

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

    const handleConfigure = (key: string) => {
        const integration = data.find((int) => int.key === key);
        if (integration) {
            setSelectedIntegration({ key, name: integration.name });
        }
    };

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
                        {t("settings.integrations_desc_admin", "Configura las credenciales y parámetros de conexión de los servicios externos.")}
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
                            onConfigure={handleConfigure}
                        />
                    ))}
                </div>
            </section>

            {/* Edit Modal */}
            {selectedIntegration && (
                <IntegrationEditModal
                    integrationKey={selectedIntegration.key}
                    integrationName={selectedIntegration.name}
                    isOpen={!!selectedIntegration}
                    onClose={() => setSelectedIntegration(null)}
                />
            )}
        </div>
    );
};

// ============================================
// Email Edit Modal Component
// ============================================

interface EmailEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EmailEditModal: React.FC<EmailEditModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    // Fetch email config
    const { data: config, isLoading } = useQuery({
        queryKey: ["email-config"],
        queryFn: () => settingsService.getEmailConfig(),
        enabled: isOpen,
    });

    // Update form when config loads
    React.useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: Record<string, string>) =>
            settingsService.updateEmailSettings(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            queryClient.invalidateQueries({ queryKey: ["email-config"] });
            toast.success(t("settings.email_updated", "Configuración de email actualizada"));
            onClose();
        },
        onError: () => {
            toast.error(t("settings.email_update_error", "Error al actualizar configuración"));
        },
    });

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const toggleSecretVisibility = (key: string) => {
        setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const isResend = formData.provider === "resend";

    if (!isOpen) return null;

    return (
        <div className="settings__modal-overlay" onClick={onClose}>
            <div className="settings__modal settings__modal--wide" onClick={(e) => e.stopPropagation()}>
                <div className="settings__modal-header">
                    <h3 className="settings__modal-title">
                        {t("settings.configure_email", "Configurar Email")}
                    </h3>
                    <button type="button" className="settings__modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="settings__modal-loading">
                        <SpinnerGap size={32} className="animate-spin" />
                        <p>{t("common.loading", "Cargando...")}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="settings__modal-body">
                            {/* Provider Selection */}
                            <div className="settings__modal-field">
                                <label className="settings__modal-label">
                                    {t("settings.email_provider", "Proveedor")}
                                </label>
                                <select
                                    className="settings__modal-select"
                                    value={formData.provider || "smtp"}
                                    onChange={(e) => handleChange("provider", e.target.value)}
                                >
                                    <option value="resend">Resend (Recomendado)</option>
                                    <option value="smtp">SMTP</option>
                                </select>
                            </div>

                            {/* Resend Config */}
                            {isResend && (
                                <div className="settings__modal-field">
                                    <label className="settings__modal-label">
                                        API Key
                                        <span className="settings__modal-secret-badge">
                                            <Key size={12} />
                                            {t("settings.secret", "Secreto")}
                                        </span>
                                    </label>
                                    <div className="settings__modal-input-wrapper">
                                        <Input
                                            type={showSecrets.resendApiKey ? "text" : "password"}
                                            value={formData.resendApiKey || ""}
                                            onChange={(e) => handleChange("resendApiKey", e.target.value)}
                                            placeholder="re_xxxxxxxx..."
                                        />
                                        <button
                                            type="button"
                                            className="settings__modal-toggle-secret"
                                            onClick={() => toggleSecretVisibility("resendApiKey")}
                                        >
                                            {showSecrets.resendApiKey ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                        </button>
                                    </div>
                                    {formData.resendApiKey_hasValue === "true" && (
                                        <p className="settings__modal-hint">
                                            {t("settings.secret_configured", "Ya configurado. Deja vacío para mantener.")}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* SMTP Config */}
                            {!isResend && (
                                <>
                                    <div className="settings__modal-field">
                                        <label className="settings__modal-label">
                                            {t("settings.smtp_host", "Servidor SMTP")}
                                        </label>
                                        <Input
                                            value={formData.smtpHost || ""}
                                            onChange={(e) => handleChange("smtpHost", e.target.value)}
                                            placeholder="smtp.ejemplo.com"
                                        />
                                    </div>
                                    <div className="settings__modal-field">
                                        <label className="settings__modal-label">
                                            {t("settings.smtp_port", "Puerto")}
                                        </label>
                                        <Input
                                            value={formData.smtpPort || ""}
                                            onChange={(e) => handleChange("smtpPort", e.target.value)}
                                            placeholder="587"
                                        />
                                    </div>
                                    <div className="settings__modal-field">
                                        <label className="settings__modal-label">
                                            {t("settings.smtp_user", "Usuario")}
                                        </label>
                                        <Input
                                            value={formData.smtpUser || ""}
                                            onChange={(e) => handleChange("smtpUser", e.target.value)}
                                            placeholder="usuario@ejemplo.com"
                                        />
                                    </div>
                                    <div className="settings__modal-field">
                                        <label className="settings__modal-label">
                                            {t("settings.smtp_pass", "Contraseña")}
                                            <span className="settings__modal-secret-badge">
                                                <Key size={12} />
                                                {t("settings.secret", "Secreto")}
                                            </span>
                                        </label>
                                        <div className="settings__modal-input-wrapper">
                                            <Input
                                                type={showSecrets.smtpPass ? "text" : "password"}
                                                value={formData.smtpPass || ""}
                                                onChange={(e) => handleChange("smtpPass", e.target.value)}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                className="settings__modal-toggle-secret"
                                                onClick={() => toggleSecretVisibility("smtpPass")}
                                            >
                                                {showSecrets.smtpPass ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Common: Sender Info */}
                            <div className="settings__modal-divider" />
                            <div className="settings__modal-field">
                                <label className="settings__modal-label">
                                    {t("settings.from_name", "Nombre del Remitente")}
                                </label>
                                <Input
                                    value={formData.fromName || ""}
                                    onChange={(e) => handleChange("fromName", e.target.value)}
                                    placeholder="CIP Eventos"
                                />
                            </div>
                            <div className="settings__modal-field">
                                <label className="settings__modal-label">
                                    {t("settings.from_email", "Correo del Remitente")}
                                </label>
                                <Input
                                    type="email"
                                    value={formData.fromEmail || ""}
                                    onChange={(e) => handleChange("fromEmail", e.target.value)}
                                    placeholder="noreply@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div className="settings__modal-footer">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={updateMutation.isPending}>
                                {t("common.cancel", "Cancelar")}
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? (
                                    <SpinnerGap size={16} className="animate-spin" />
                                ) : (
                                    <FloppyDisk size={16} />
                                )}
                                {t("form.save_changes", "Guardar Cambios")}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isResend = data.provider === "resend";

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
                            ? t("settings.email_configured", "Servicio de correo configurado")
                            : t("settings.email_not_configured", "Servicio de correo no configurado")}
                    </p>
                    <p className="settings__alert-text">
                        {data.isConfigured
                            ? t("settings.email_configured_desc", "El sistema puede enviar correos de confirmación, notificaciones y certificados.")
                            : isResend
                                ? t("settings.resend_not_configured_desc", "Configure la API Key de Resend para habilitar el envío de correos.")
                                : t("settings.smtp_not_configured_desc", "Configure el servidor SMTP para habilitar el envío de correos.")}
                    </p>
                </div>
                <Button variant="soft" size="sm" onClick={() => setIsModalOpen(true)}>
                    <Gear size={16} />
                    {t("settings.configure", "Configurar")}
                </Button>
            </div>

            {/* Section: Provider Info */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--email">
                        <EnvelopeSimple size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.email_provider", "Proveedor de Email")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t("settings.email_provider_desc", "Servicio utilizado para envío de correos")}
                        </p>
                    </div>
                </div>

                <div className="settings__provider-card">
                    <div className="settings__provider-info">
                        <div className="settings__provider-logo">
                            {isResend ? (
                                <PaperPlaneTilt size={24} weight="duotone" />
                            ) : (
                                <EnvelopeSimple size={24} weight="duotone" />
                            )}
                        </div>
                        <div className="settings__provider-details">
                            <h4 className="settings__provider-name">
                                {isResend ? "Resend" : "SMTP"}
                            </h4>
                            <p className="settings__provider-desc">
                                {isResend
                                    ? t("settings.resend_desc", "API moderna para envío de emails transaccionales")
                                    : t("settings.smtp_desc", "Protocolo estándar de correo electrónico")}
                            </p>
                        </div>
                        <span className={`settings__status-badge ${data.isConfigured ? "settings__status-badge--success" : "settings__status-badge--disabled"}`}>
                            {data.isConfigured ? (
                                <>
                                    <CheckCircle size={14} weight="fill" />
                                    {t("settings.active", "Activo")}
                                </>
                            ) : (
                                <>
                                    <XCircle size={14} weight="fill" />
                                    {t("settings.inactive", "Inactivo")}
                                </>
                            )}
                        </span>
                    </div>
                </div>
            </section>

            {/* Section: Sender Config */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--contact">
                        <Globe size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.sender_config", "Configuración de Remitente")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t("settings.sender_config_desc", "Información que aparece en los correos enviados")}
                        </p>
                    </div>
                </div>

                <div className="settings__form-grid">
                    <ReadOnlyField
                        label={t("settings.from_name", "Nombre del Remitente")}
                        value={data.fromName}
                    />
                    <ReadOnlyField
                        label={t("settings.from_email", "Correo del Remitente")}
                        value={data.fromEmail}
                    />
                </div>
            </section>

            {/* Section: SMTP Details (only if SMTP provider) */}
            {!isResend && (
                <section className="settings__section">
                    <div className="settings__section-header">
                        <div className="settings__section-icon settings__section-icon--security">
                            <Key size={18} weight="duotone" />
                        </div>
                        <div className="settings__section-title-group">
                            <h3 className="settings__section-title">
                                {t("settings.smtp_details", "Detalles del Servidor SMTP")}
                            </h3>
                            <p className="settings__section-subtitle">
                                {t("settings.smtp_details_desc", "Configuración técnica del servidor")}
                            </p>
                        </div>
                    </div>

                    <div className="settings__form-grid">
                        <ReadOnlyField
                            label={t("settings.smtp_host", "Servidor")}
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
                    </div>
                </section>
            )}

            {/* Edit Modal */}
            <EmailEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
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
