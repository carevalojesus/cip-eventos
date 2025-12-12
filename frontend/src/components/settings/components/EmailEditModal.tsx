/**
 * EmailEditModal Component
 *
 * Modal para editar la configuración de email.
 */
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Key, SpinnerGap, FloppyDisk, Eye, EyeSlash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsService } from "@/services/settings.service";

interface EmailEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EmailEditModal: React.FC<EmailEditModalProps> = ({
    isOpen,
    onClose,
}) => {
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
    useEffect(() => {
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
            toast.success(
                t("settings.email_updated", "Configuración de email actualizada")
            );
            onClose();
        },
        onError: () => {
            toast.error(
                t(
                    "settings.email_update_error",
                    "Error al actualizar configuración"
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

    const isResend = formData.provider === "resend";

    if (!isOpen) return null;

    return (
        <div className="settings__modal-overlay" onClick={onClose}>
            <div
                className="settings__modal settings__modal--wide"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings__modal-header">
                    <h3 className="settings__modal-title">
                        {t("settings.configure_email", "Configurar Email")}
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
                            {/* Provider Selection */}
                            <div className="settings__modal-field">
                                <label className="settings__modal-label">
                                    {t("settings.email_provider", "Proveedor")}
                                </label>
                                <select
                                    className="settings__modal-select"
                                    value={formData.provider || "smtp"}
                                    onChange={(e) =>
                                        handleChange("provider", e.target.value)
                                    }
                                >
                                    <option value="resend">
                                        Resend (Recomendado)
                                    </option>
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
                                            type={
                                                showSecrets.resendApiKey
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={formData.resendApiKey || ""}
                                            onChange={(e) =>
                                                handleChange(
                                                    "resendApiKey",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="re_xxxxxxxx..."
                                        />
                                        <button
                                            type="button"
                                            className="settings__modal-toggle-secret"
                                            onClick={() =>
                                                toggleSecretVisibility(
                                                    "resendApiKey"
                                                )
                                            }
                                        >
                                            {showSecrets.resendApiKey ? (
                                                <EyeSlash size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                    {formData.resendApiKey_hasValue === "true" && (
                                        <p className="settings__modal-hint">
                                            {t(
                                                "settings.secret_configured",
                                                "Ya configurado. Deja vacío para mantener."
                                            )}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* SMTP Config */}
                            {!isResend && (
                                <>
                                    <div className="settings__modal-field">
                                        <label className="settings__modal-label">
                                            {t(
                                                "settings.smtp_host",
                                                "Servidor SMTP"
                                            )}
                                        </label>
                                        <Input
                                            value={formData.smtpHost || ""}
                                            onChange={(e) =>
                                                handleChange(
                                                    "smtpHost",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="smtp.ejemplo.com"
                                        />
                                    </div>
                                    <div className="settings__modal-field">
                                        <label className="settings__modal-label">
                                            {t("settings.smtp_port", "Puerto")}
                                        </label>
                                        <Input
                                            value={formData.smtpPort || ""}
                                            onChange={(e) =>
                                                handleChange(
                                                    "smtpPort",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="587"
                                        />
                                    </div>
                                    <div className="settings__modal-field">
                                        <label className="settings__modal-label">
                                            {t("settings.smtp_user", "Usuario")}
                                        </label>
                                        <Input
                                            value={formData.smtpUser || ""}
                                            onChange={(e) =>
                                                handleChange(
                                                    "smtpUser",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="usuario@ejemplo.com"
                                        />
                                    </div>
                                    <div className="settings__modal-field">
                                        <label className="settings__modal-label">
                                            {t(
                                                "settings.smtp_pass",
                                                "Contraseña"
                                            )}
                                            <span className="settings__modal-secret-badge">
                                                <Key size={12} />
                                                {t("settings.secret", "Secreto")}
                                            </span>
                                        </label>
                                        <div className="settings__modal-input-wrapper">
                                            <Input
                                                type={
                                                    showSecrets.smtpPass
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={formData.smtpPass || ""}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "smtpPass",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                className="settings__modal-toggle-secret"
                                                onClick={() =>
                                                    toggleSecretVisibility(
                                                        "smtpPass"
                                                    )
                                                }
                                            >
                                                {showSecrets.smtpPass ? (
                                                    <EyeSlash size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Common: Sender Info */}
                            <div className="settings__modal-divider" />
                            <div className="settings__modal-field">
                                <label className="settings__modal-label">
                                    {t(
                                        "settings.from_name",
                                        "Nombre del Remitente"
                                    )}
                                </label>
                                <Input
                                    value={formData.fromName || ""}
                                    onChange={(e) =>
                                        handleChange("fromName", e.target.value)
                                    }
                                    placeholder="CIP Eventos"
                                />
                            </div>
                            <div className="settings__modal-field">
                                <label className="settings__modal-label">
                                    {t(
                                        "settings.from_email",
                                        "Correo del Remitente"
                                    )}
                                </label>
                                <Input
                                    type="email"
                                    value={formData.fromEmail || ""}
                                    onChange={(e) =>
                                        handleChange("fromEmail", e.target.value)
                                    }
                                    placeholder="noreply@ejemplo.com"
                                />
                            </div>
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

export default EmailEditModal;
