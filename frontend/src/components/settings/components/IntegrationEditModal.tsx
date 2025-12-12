/**
 * IntegrationEditModal Component
 *
 * Modal para editar la configuración de una integración.
 */
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Key, SpinnerGap, FloppyDisk, Eye, EyeSlash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsService } from "@/services/settings.service";

// ============================================
// Types
// ============================================

interface IntegrationFieldConfig {
    key: string;
    label: string;
    type: "text" | "password" | "select";
    placeholder?: string;
    options?: { value: string; label: string }[];
    isSecret?: boolean;
}

interface IntegrationEditModalProps {
    integrationKey: string;
    integrationName: string;
    isOpen: boolean;
    onClose: () => void;
}

// ============================================
// Field Configuration
// ============================================

const integrationFields: Record<string, IntegrationFieldConfig[]> = {
    reniec: [
        {
            key: "enabled",
            label: "Habilitado",
            type: "select",
            options: [
                { value: "true", label: "Sí" },
                { value: "false", label: "No" },
            ],
        },
        {
            key: "apiUrl",
            label: "URL del API",
            type: "text",
            placeholder: "https://api.decolecta.pe/reniec",
        },
        {
            key: "apiToken",
            label: "Token de Autenticación",
            type: "password",
            isSecret: true,
        },
    ],
    paypal: [
        {
            key: "enabled",
            label: "Habilitado",
            type: "select",
            options: [
                { value: "true", label: "Sí" },
                { value: "false", label: "No" },
            ],
        },
        {
            key: "mode",
            label: "Modo",
            type: "select",
            options: [
                { value: "sandbox", label: "Sandbox (Pruebas)" },
                { value: "live", label: "Live (Producción)" },
            ],
        },
        {
            key: "clientId",
            label: "Client ID",
            type: "text",
            placeholder: "Client ID de PayPal",
        },
        {
            key: "clientSecret",
            label: "Client Secret",
            type: "password",
            isSecret: true,
        },
    ],
    cip: [
        {
            key: "enabled",
            label: "Habilitado",
            type: "select",
            options: [
                { value: "true", label: "Sí" },
                { value: "false", label: "No" },
            ],
        },
        {
            key: "apiUrl",
            label: "URL del API",
            type: "text",
            placeholder: "https://api.cip.org.pe/padron",
        },
        {
            key: "apiKey",
            label: "API Key",
            type: "password",
            isSecret: true,
        },
    ],
    sunat: [
        {
            key: "enabled",
            label: "Habilitado",
            type: "select",
            options: [
                { value: "true", label: "Sí" },
                { value: "false", label: "No" },
            ],
        },
        {
            key: "ruc",
            label: "RUC Emisor",
            type: "text",
            placeholder: "20100039207",
        },
        {
            key: "username",
            label: "Usuario SOL",
            type: "text",
            placeholder: "MODDATOS",
        },
        {
            key: "password",
            label: "Clave SOL",
            type: "password",
            isSecret: true,
        },
        {
            key: "certificatePath",
            label: "Ruta del Certificado",
            type: "text",
            placeholder: "/path/to/certificate.pfx",
        },
    ],
    twilio: [
        {
            key: "enabled",
            label: "Habilitado",
            type: "select",
            options: [
                { value: "true", label: "Sí" },
                { value: "false", label: "No" },
            ],
        },
        {
            key: "accountSid",
            label: "Account SID",
            type: "text",
            placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        },
        {
            key: "authToken",
            label: "Auth Token",
            type: "password",
            isSecret: true,
        },
        {
            key: "phoneNumber",
            label: "Número de Teléfono",
            type: "text",
            placeholder: "+15551234567",
        },
    ],
};

// ============================================
// Component
// ============================================

export const IntegrationEditModal: React.FC<IntegrationEditModalProps> = ({
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

    // Update form when config loads
    useEffect(() => {
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
            queryClient.invalidateQueries({
                queryKey: ["integration-config", integrationKey],
            });
            toast.success(
                t(
                    "settings.integration_updated",
                    "Integración actualizada correctamente"
                )
            );
            onClose();
        },
        onError: () => {
            toast.error(
                t(
                    "settings.integration_update_error",
                    "Error al actualizar la integración"
                )
            );
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
            <div
                className="settings__modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings__modal-header">
                    <h3 className="settings__modal-title">
                        {t("settings.configure_integration", "Configurar")}{" "}
                        {integrationName}
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
                                <div
                                    key={field.key}
                                    className="settings__modal-field"
                                >
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
                                            value={
                                                formData[field.key] ||
                                                (field.options?.[1]?.value ?? "")
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    field.key,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            {field.options?.map((opt) => (
                                                <option
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="settings__modal-input-wrapper">
                                            <Input
                                                type={
                                                    field.isSecret &&
                                                    !showSecrets[field.key]
                                                        ? "password"
                                                        : "text"
                                                }
                                                value={formData[field.key] || ""}
                                                onChange={(e) =>
                                                    handleChange(
                                                        field.key,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={field.placeholder}
                                            />
                                            {field.isSecret && (
                                                <button
                                                    type="button"
                                                    className="settings__modal-toggle-secret"
                                                    onClick={() =>
                                                        toggleSecretVisibility(
                                                            field.key
                                                        )
                                                    }
                                                >
                                                    {showSecrets[field.key] ? (
                                                        <EyeSlash size={16} />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {field.isSecret &&
                                        formData[`${field.key}_hasValue`] ===
                                            "true" && (
                                            <p className="settings__modal-hint">
                                                {t(
                                                    "settings.secret_configured",
                                                    "Ya configurado. Deja vacío para mantener el valor actual."
                                                )}
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
                                    <SpinnerGap
                                        size={16}
                                        className="animate-spin"
                                    />
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

export default IntegrationEditModal;
