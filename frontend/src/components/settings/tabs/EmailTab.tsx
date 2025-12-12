/**
 * EmailTab Component
 *
 * Tab de configuración de email.
 * Usa componentes RUI: Alert, Section, DataField, Badge, Card.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    EnvelopeSimple,
    Globe,
    Key,
    PaperPlaneTilt,
    Gear,
} from "@phosphor-icons/react";

// UI Components
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { DataField, DataFieldGroup } from "@/components/ui/data-field";
import { StatusBadge } from "@/components/ui/badge";

// Services & Types
import type { EmailConfig } from "@/services/settings.service";

// Components
import { EmailEditModal } from "../components";

// ============================================
// Types
// ============================================

interface EmailTabProps {
    data: EmailConfig;
}

// ============================================
// Email Tab Component
// ============================================

export const EmailTab: React.FC<EmailTabProps> = ({ data }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isResend = data.provider === "resend";

    return (
        <div className="settings__form">
            {/* Status Alert */}
            <Alert
                variant={data.isConfigured ? "success" : "warning"}
                title={
                    data.isConfigured
                        ? t(
                              "settings.email_configured",
                              "Servicio de correo configurado"
                          )
                        : t(
                              "settings.email_not_configured",
                              "Servicio de correo no configurado"
                          )
                }
                action={
                    <Button
                        variant="soft"
                        size="sm"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Gear size={16} />
                        {t("settings.configure", "Configurar")}
                    </Button>
                }
            >
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
            </Alert>

            {/* Section: Provider Info */}
            <Section>
                <Section.Header
                    icon={<EnvelopeSimple size={18} weight="duotone" />}
                    iconVariant="email"
                    title={t("settings.email_provider", "Proveedor de Email")}
                    subtitle={t(
                        "settings.email_provider_desc",
                        "Servicio utilizado para envío de correos"
                    )}
                />
                <Section.Content>
                    <Card variant="outlined" padding="standard">
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "var(--radius-md)",
                                    backgroundColor: "var(--color-cyan-050)",
                                    color: "var(--color-cyan-600)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {isResend ? (
                                    <PaperPlaneTilt size={24} weight="duotone" />
                                ) : (
                                    <EnvelopeSimple size={24} weight="duotone" />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4
                                    style={{
                                        margin: 0,
                                        fontSize: "var(--font-size-base)",
                                        fontWeight: 600,
                                        color: "var(--color-text-primary)",
                                    }}
                                >
                                    {isResend ? "Resend" : "SMTP"}
                                </h4>
                                <p
                                    style={{
                                        margin: "var(--space-1) 0 0",
                                        fontSize: "var(--font-size-sm)",
                                        color: "var(--color-text-muted)",
                                    }}
                                >
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
                            <StatusBadge
                                status={data.isConfigured ? "active" : "inactive"}
                            >
                                {data.isConfigured
                                    ? t("settings.active", "Activo")
                                    : t("settings.inactive", "Inactivo")}
                            </StatusBadge>
                        </div>
                    </Card>
                </Section.Content>
            </Section>

            {/* Section: Sender Config */}
            <Section>
                <Section.Header
                    icon={<Globe size={18} weight="duotone" />}
                    iconVariant="contact"
                    title={t(
                        "settings.sender_config",
                        "Configuración de Remitente"
                    )}
                    subtitle={t(
                        "settings.sender_config_desc",
                        "Información que aparece en los correos enviados"
                    )}
                    action={
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Gear size={16} />
                            {t("common.edit", "Editar")}
                        </Button>
                    }
                />
                <Section.Content>
                    <DataFieldGroup columns={2}>
                        <DataField
                            label={t("settings.from_name", "Nombre del Remitente")}
                            value={data.fromName}
                        />
                        <DataField
                            label={t("settings.from_email", "Correo del Remitente")}
                            value={data.fromEmail}
                            copyable
                        />
                    </DataFieldGroup>
                </Section.Content>
            </Section>

            {/* Section: SMTP Details (only if SMTP provider) */}
            {!isResend && (
                <Section>
                    <Section.Header
                        icon={<Key size={18} weight="duotone" />}
                        iconVariant="security"
                        title={t(
                            "settings.smtp_details",
                            "Detalles del Servidor SMTP"
                        )}
                        subtitle={t(
                            "settings.smtp_details_desc",
                            "Configuración técnica del servidor"
                        )}
                    />
                    <Section.Content>
                        <DataFieldGroup columns={3}>
                            <DataField
                                label={t("settings.smtp_host", "Servidor")}
                                value={data.smtpHost}
                                type="mono"
                            />
                            <DataField
                                label={t("settings.smtp_port", "Puerto")}
                                value={data.smtpPort}
                                type="mono"
                            />
                            <DataField
                                label={t("settings.smtp_user", "Usuario")}
                                value={data.smtpUser}
                            />
                        </DataFieldGroup>
                    </Section.Content>
                </Section>
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
