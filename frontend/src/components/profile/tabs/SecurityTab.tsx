/**
 * SecurityTab Component
 *
 * Tab de seguridad del perfil (contraseña, verificación).
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { Key, Envelope, SealCheck, Clock } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface SecurityTabProps {
    onChangePassword: () => void;
    isVerified: boolean;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
    onChangePassword,
    isVerified,
}) => {
    const { t } = useTranslation();

    return (
        <div className="profile__card">
            <h3 className="profile__card-title">
                {t("profile.account_security", "Seguridad de la Cuenta")}
            </h3>

            {/* Password */}
            <div className="profile__security-item">
                <div className="profile__security-left">
                    <div className="profile__security-icon">
                        <Key size={20} />
                    </div>
                    <div>
                        <div className="profile__security-title">
                            {t("profile.password", "Contraseña")}
                        </div>
                        <div className="profile__security-desc">
                            {t(
                                "profile.password_desc",
                                "Cambia tu contraseña regularmente para mayor seguridad"
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onChangePassword}
                    style={{ color: "var(--color-red-600)" }}
                >
                    {t("profile.change_password", "Cambiar contraseña")}
                </Button>
            </div>

            {/* Email Verification Status */}
            <div className="profile__security-item">
                <div className="profile__security-left">
                    <div className="profile__security-icon">
                        <Envelope size={20} />
                    </div>
                    <div>
                        <div className="profile__security-title">
                            {t(
                                "profile.email_verification",
                                "Verificación de Correo"
                            )}
                        </div>
                        <div className="profile__security-desc">
                            {isVerified
                                ? t(
                                      "profile.email_verified_status",
                                      "Tu correo electrónico está verificado"
                                  )
                                : t(
                                      "profile.email_not_verified",
                                      "Tu correo electrónico no ha sido verificado"
                                  )}
                        </div>
                    </div>
                </div>
                {isVerified ? (
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-1)",
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-green-600)",
                            fontWeight: 500,
                        }}
                    >
                        <SealCheck size={16} weight="fill" />
                        {t("profile.verified", "Verificado")}
                    </span>
                ) : (
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-1)",
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-yellow-600)",
                            fontWeight: 500,
                        }}
                    >
                        <Clock size={16} />
                        {t("profile.pending", "Pendiente")}
                    </span>
                )}
            </div>
        </div>
    );
};

export default SecurityTab;
