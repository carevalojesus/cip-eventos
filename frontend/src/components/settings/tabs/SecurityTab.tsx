/**
 * SecurityTab Component
 *
 * Tab de configuración de seguridad.
 * Usa componentes RUI: Alert, Section, DataField, StatusBadge, Card.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Key } from "@phosphor-icons/react";

// UI Components
import { Alert } from "@/components/ui/alert";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { DataField, DataFieldGroup } from "@/components/ui/data-field";
import { StatusBadge } from "@/components/ui/badge";

// Services & Types
import type { SecurityConfig } from "@/services/settings.service";

// ============================================
// Types
// ============================================

interface SecurityTabProps {
    data: SecurityConfig;
}

// ============================================
// Security Tab Component
// ============================================

export const SecurityTab: React.FC<SecurityTabProps> = ({ data }) => {
    const { t } = useTranslation();

    return (
        <div className="settings__form">
            {/* Info Alert */}
            <Alert
                variant="neutral"
                title={t(
                    "settings.security_title",
                    "Configuración de Seguridad"
                )}
            >
                {t(
                    "settings.security_desc",
                    "Estas configuraciones afectan la seguridad de todas las cuentas de usuario."
                )}
            </Alert>

            {/* Section: Authentication */}
            <Section>
                <Section.Header
                    icon={<Key size={18} weight="duotone" />}
                    iconVariant="security"
                    title={t("settings.auth_config", "Autenticación")}
                    subtitle={t(
                        "settings.auth_config_desc",
                        "Políticas de sesiones y contraseñas"
                    )}
                />
                <Section.Content>
                    <DataFieldGroup columns={2}>
                        <DataField
                            label={t(
                                "settings.session_duration",
                                "Duración de Sesión"
                            )}
                            value={data.jwtExpiresIn}
                        />
                        <DataField
                            label={t(
                                "settings.session_timeout",
                                "Timeout de Inactividad"
                            )}
                            value={data.sessionTimeout}
                        />
                        <DataField
                            label={t(
                                "settings.password_min_length",
                                "Longitud Mínima Contraseña"
                            )}
                            value={`${data.passwordMinLength} caracteres`}
                        />
                        <DataField
                            label={t(
                                "settings.max_login_attempts",
                                "Intentos de Login"
                            )}
                            value={`${data.maxLoginAttempts} máximo`}
                        />
                    </DataFieldGroup>
                </Section.Content>
            </Section>

            {/* Section: 2FA */}
            <Section>
                <Section.Header
                    icon={<ShieldCheck size={18} weight="duotone" />}
                    iconVariant="success"
                    title={t(
                        "settings.two_factor",
                        "Autenticación de Dos Factores"
                    )}
                    subtitle={t(
                        "settings.two_factor_desc",
                        "Capa adicional de seguridad"
                    )}
                />
                <Section.Content>
                    <Card variant="outlined" padding="standard">
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                            <StatusBadge
                                status={data.twoFactorEnabled ? "active" : "inactive"}
                            >
                                {data.twoFactorEnabled
                                    ? t("settings.2fa_enabled", "Habilitado")
                                    : t("settings.2fa_disabled", "No habilitado")}
                            </StatusBadge>
                        </div>
                        <p
                            style={{
                                margin: "var(--space-3) 0 0",
                                fontSize: "var(--font-size-sm)",
                                color: "var(--color-text-muted)",
                            }}
                        >
                            {t(
                                "settings.2fa_note",
                                "La autenticación de dos factores puede ser habilitada por cada usuario en su perfil."
                            )}
                        </p>
                    </Card>
                </Section.Content>
            </Section>
        </div>
    );
};

export default SecurityTab;
