/**
 * SecurityTab Component
 *
 * Tab de configuración de seguridad.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Key, CheckCircle, XCircle } from "@phosphor-icons/react";
import type { SecurityConfig } from "@/services/settings.service";

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
// Security Tab
// ============================================

interface SecurityTabProps {
    data: SecurityConfig;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ data }) => {
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
                        {t(
                            "settings.security_title",
                            "Configuración de Seguridad"
                        )}
                    </p>
                    <p className="settings__alert-text">
                        {t(
                            "settings.security_desc",
                            "Estas configuraciones afectan la seguridad de todas las cuentas de usuario."
                        )}
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
                            {t(
                                "settings.auth_config_desc",
                                "Políticas de sesiones y contraseñas"
                            )}
                        </p>
                    </div>
                </div>

                <div className="settings__form-grid">
                    <ReadOnlyField
                        label={t(
                            "settings.session_duration",
                            "Duración de Sesión"
                        )}
                        value={data.jwtExpiresIn}
                    />
                    <ReadOnlyField
                        label={t(
                            "settings.session_timeout",
                            "Timeout de Inactividad"
                        )}
                        value={data.sessionTimeout}
                    />
                    <ReadOnlyField
                        label={t(
                            "settings.password_min_length",
                            "Longitud Mínima Contraseña"
                        )}
                        value={`${data.passwordMinLength} caracteres`}
                    />
                    <ReadOnlyField
                        label={t(
                            "settings.max_login_attempts",
                            "Intentos de Login"
                        )}
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
                            {t(
                                "settings.two_factor",
                                "Autenticación de Dos Factores"
                            )}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t(
                                "settings.two_factor_desc",
                                "Capa adicional de seguridad"
                            )}
                        </p>
                    </div>
                </div>

                <div className="settings__2fa-status">
                    <div className="settings__2fa-info">
                        <span
                            className={`settings__status-badge ${
                                data.twoFactorEnabled
                                    ? "settings__status-badge--success"
                                    : "settings__status-badge--disabled"
                            }`}
                        >
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
                            {t(
                                "settings.2fa_note",
                                "La autenticación de dos factores puede ser habilitada por cada usuario en su perfil."
                            )}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SecurityTab;
