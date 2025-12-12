/**
 * EmailEditModal Component
 *
 * Modal para editar la configuración de email.
 * Usa componentes RUI: Modal, Input, Select.
 */
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    EnvelopeSimple,
    Key,
    SpinnerGap,
    FloppyDisk,
    Eye,
    EyeSlash,
} from "@phosphor-icons/react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SimpleSelect } from "@/components/ui/select";

// Services
import { settingsService } from "@/services/settings.service";

// ============================================
// Types
// ============================================

interface EmailEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ============================================
// Component
// ============================================

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

    const providerOptions = [
        { value: "resend", label: "Resend (Recomendado)" },
        { value: "smtp", label: "SMTP" },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <Modal.Header
                icon={<EnvelopeSimple size={20} weight="duotone" />}
                iconVariant="info"
                title={t("settings.configure_email", "Configurar Email")}
                subtitle={t(
                    "settings.configure_email_desc",
                    "Configure el servicio de envío de correos"
                )}
            />

            {isLoading ? (
                <Modal.Body>
                    <div className="email-modal__loading">
                        <SpinnerGap size={32} className="animate-spin" />
                        <p>{t("common.loading", "Cargando...")}</p>
                    </div>
                </Modal.Body>
            ) : (
                <form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <div className="email-modal__form">
                            {/* Provider Selection */}
                            <div className="email-modal__field">
                                <label className="email-modal__label">
                                    {t("settings.email_provider", "Proveedor")}
                                </label>
                                <SimpleSelect
                                    value={formData.provider || "smtp"}
                                    onChange={(value) => handleChange("provider", value)}
                                    options={providerOptions}
                                    fullWidth
                                />
                            </div>

                            {/* Resend Config */}
                            {isResend && (
                                <div className="email-modal__field">
                                    <label className="email-modal__label">
                                        API Key
                                        <span className="email-modal__secret-badge">
                                            <Key size={12} />
                                            {t("settings.secret", "Secreto")}
                                        </span>
                                    </label>
                                    <div className="email-modal__input-group">
                                        <Input
                                            type={showSecrets.resendApiKey ? "text" : "password"}
                                            value={formData.resendApiKey || ""}
                                            onChange={(e) =>
                                                handleChange("resendApiKey", e.target.value)
                                            }
                                            placeholder="re_xxxxxxxx..."
                                        />
                                        <button
                                            type="button"
                                            className="email-modal__toggle-btn"
                                            onClick={() => toggleSecretVisibility("resendApiKey")}
                                        >
                                            {showSecrets.resendApiKey ? (
                                                <EyeSlash size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                    {formData.resendApiKey_hasValue === "true" && (
                                        <p className="email-modal__hint">
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
                                    <div className="email-modal__row">
                                        <div className="email-modal__field">
                                            <label className="email-modal__label">
                                                {t("settings.smtp_host", "Servidor SMTP")}
                                            </label>
                                            <Input
                                                value={formData.smtpHost || ""}
                                                onChange={(e) =>
                                                    handleChange("smtpHost", e.target.value)
                                                }
                                                placeholder="smtp.ejemplo.com"
                                            />
                                        </div>
                                        <div className="email-modal__field email-modal__field--small">
                                            <label className="email-modal__label">
                                                {t("settings.smtp_port", "Puerto")}
                                            </label>
                                            <Input
                                                value={formData.smtpPort || ""}
                                                onChange={(e) =>
                                                    handleChange("smtpPort", e.target.value)
                                                }
                                                placeholder="587"
                                            />
                                        </div>
                                    </div>
                                    <div className="email-modal__field">
                                        <label className="email-modal__label">
                                            {t("settings.smtp_user", "Usuario")}
                                        </label>
                                        <Input
                                            value={formData.smtpUser || ""}
                                            onChange={(e) =>
                                                handleChange("smtpUser", e.target.value)
                                            }
                                            placeholder="usuario@ejemplo.com"
                                        />
                                    </div>
                                    <div className="email-modal__field">
                                        <label className="email-modal__label">
                                            {t("settings.smtp_pass", "Contraseña")}
                                            <span className="email-modal__secret-badge">
                                                <Key size={12} />
                                                {t("settings.secret", "Secreto")}
                                            </span>
                                        </label>
                                        <div className="email-modal__input-group">
                                            <Input
                                                type={showSecrets.smtpPass ? "text" : "password"}
                                                value={formData.smtpPass || ""}
                                                onChange={(e) =>
                                                    handleChange("smtpPass", e.target.value)
                                                }
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                className="email-modal__toggle-btn"
                                                onClick={() => toggleSecretVisibility("smtpPass")}
                                            >
                                                {showSecrets.smtpPass ? (
                                                    <EyeSlash size={18} />
                                                ) : (
                                                    <Eye size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Divider */}
                            <div className="email-modal__divider" />

                            {/* Sender Info */}
                            <div className="email-modal__row">
                                <div className="email-modal__field">
                                    <label className="email-modal__label">
                                        {t("settings.from_name", "Nombre del Remitente")}
                                    </label>
                                    <Input
                                        value={formData.fromName || ""}
                                        onChange={(e) =>
                                            handleChange("fromName", e.target.value)
                                        }
                                        placeholder="CIP Eventos"
                                    />
                                </div>
                                <div className="email-modal__field">
                                    <label className="email-modal__label">
                                        {t("settings.from_email", "Correo del Remitente")}
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
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={updateMutation.isPending}
                        >
                            {t("common.cancel", "Cancelar")}
                        </Button>
                        <Button type="submit" isLoading={updateMutation.isPending}>
                            <FloppyDisk size={16} />
                            {t("form.save_changes", "Guardar Cambios")}
                        </Button>
                    </Modal.Footer>
                </form>
            )}
        </Modal>
    );
};

export default EmailEditModal;
