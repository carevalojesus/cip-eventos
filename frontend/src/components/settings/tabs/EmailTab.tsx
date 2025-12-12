/**
 * EmailTab Component
 *
 * Tab de configuración de email.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    EnvelopeSimple,
    Globe,
    Key,
    PaperPlaneTilt,
    CheckCircle,
    XCircle,
    Warning,
    Gear,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { EmailConfig } from "@/services/settings.service";
import { EmailEditModal } from "../components";

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
// Email Tab
// ============================================

interface EmailTabProps {
    data: EmailConfig;
}

export const EmailTab: React.FC<EmailTabProps> = ({ data }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isResend = data.provider === "resend";

    return (
        <div className="settings__form">
            {/* Status Alert */}
            <div
                className={`settings__alert ${
                    data.isConfigured
                        ? "settings__alert--success"
                        : "settings__alert--warning"
                }`}
            >
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
                            ? t(
                                  "settings.email_configured",
                                  "Servicio de correo configurado"
                              )
                            : t(
                                  "settings.email_not_configured",
                                  "Servicio de correo no configurado"
                              )}
                    </p>
                    <p className="settings__alert-text">
                        {data.isConfigured
                            ? t(
                                  "settings.email_configured_desc",
                                  "El sistema puede enviar correos de confirmación, notificaciones y certificados."
                              )
                            : isResend
                              ? t(
                                    "settings.resend_not_configured_desc",
                                    "Configure la API Key de Resend para habilitar el envío de correos."
                                )
                              : t(
                                    "settings.smtp_not_configured_desc",
                                    "Configure el servidor SMTP para habilitar el envío de correos."
                                )}
                    </p>
                </div>
                <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                >
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
                            {t(
                                "settings.email_provider_desc",
                                "Servicio utilizado para envío de correos"
                            )}
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
                                    ? t(
                                          "settings.resend_desc",
                                          "API moderna para envío de emails transaccionales"
                                      )
                                    : t(
                                          "settings.smtp_desc",
                                          "Protocolo estándar de correo electrónico"
                                      )}
                            </p>
                        </div>
                        <span
                            className={`settings__status-badge ${
                                data.isConfigured
                                    ? "settings__status-badge--success"
                                    : "settings__status-badge--disabled"
                            }`}
                        >
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
                            {t(
                                "settings.sender_config",
                                "Configuración de Remitente"
                            )}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t(
                                "settings.sender_config_desc",
                                "Información que aparece en los correos enviados"
                            )}
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
                                {t(
                                    "settings.smtp_details",
                                    "Detalles del Servidor SMTP"
                                )}
                            </h3>
                            <p className="settings__section-subtitle">
                                {t(
                                    "settings.smtp_details_desc",
                                    "Configuración técnica del servidor"
                                )}
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
            <EmailEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default EmailTab;
