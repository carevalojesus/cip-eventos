import { useTranslation } from "react-i18next";
import {
  Key,
  ArrowClockwise,
  Trash,
  EnvelopeSimple,
  ShieldCheck,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getRoleDisplayName } from "@/lib/userUtils";

interface UserSecurityTabProps {
  isSuperAdmin: boolean;
  isOwnProfile?: boolean;
  forcePasswordReset: boolean;
  onForcePasswordResetChange: (value: boolean) => void;
  onResetPassword: () => void;
  onDeleteUser: () => void;
  onVerifyEmail?: () => void;
  onChangeRole?: () => void;
  isVerified: boolean;
  currentRoleName?: string;
  lastPasswordChange?: string;
}

export function UserSecurityTab({
  isSuperAdmin,
  isOwnProfile = false,
  forcePasswordReset,
  onForcePasswordResetChange,
  onResetPassword,
  onDeleteUser,
  onVerifyEmail,
  onChangeRole,
  isVerified,
  currentRoleName,
  lastPasswordChange,
}: UserSecurityTabProps) {
  const { t } = useTranslation();

  return (
    <div className="user-detail__card">
      <h3 className="user-detail__card-title">
        {t("users.detail.account_security", "Seguridad de la Cuenta")}
      </h3>

      {/* Password */}
      <div className="user-detail__security-item">
        <div className="user-detail__security-left">
          <div className="user-detail__security-icon">
            <Key size={20} />
          </div>
          <div>
            <div className="user-detail__security-title">
              {t("users.detail.password", "Contraseña")}
            </div>
            <div className="user-detail__security-desc">
              {lastPasswordChange || t("users.detail.password_never_changed", "Nunca cambiada")}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onResetPassword} style={{ color: "var(--color-red-600)" }}>
          {t("users.detail.change_password", "Cambiar contraseña")}
        </Button>
      </div>

      {/* Force Reset */}
      <div className="user-detail__security-item">
        <div className="user-detail__security-left">
          <div className="user-detail__security-icon">
            <ArrowClockwise size={20} />
          </div>
          <div>
            <div className="user-detail__security-title">
              {t("users.detail.reset_access", "Restablecer Accesos")}
            </div>
            <div className="user-detail__security-desc">
              {t("users.detail.reset_access_desc", "Forzar cambio de contraseña en próximo inicio")}
            </div>
          </div>
        </div>
        <Switch
          checked={forcePasswordReset}
          onChange={onForcePasswordResetChange}
          ariaLabel={t("users.detail.force_reset_toggle", "Forzar restablecimiento de contraseña")}
        />
      </div>

      {/* Email Verification */}
      {isSuperAdmin && (
        <div className="user-detail__security-item">
          <div className="user-detail__security-left">
            <div className="user-detail__security-icon">
              <EnvelopeSimple size={20} />
            </div>
            <div>
              <div className="user-detail__security-title">
                {t("users.detail.email_verification", "Verificación de Correo")}
              </div>
              <div className="user-detail__security-desc">
                {isVerified
                  ? t("users.detail.email_verified_status", "El correo está verificado")
                  : t("users.detail.email_not_verified", "El correo no ha sido verificado")}
              </div>
            </div>
          </div>
          {!isVerified && onVerifyEmail ? (
            <Button variant="ghost" size="sm" onClick={onVerifyEmail} style={{ color: "var(--color-cyan-600)" }}>
              {t("users.detail.verify_manually", "Verificar manualmente")}
            </Button>
          ) : (
            <span style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-green-600)",
              fontWeight: 500
            }}>
              {t("users.detail.verified", "Verificado")}
            </span>
          )}
        </div>
      )}

      {/* Change Role - No mostrar para el propio perfil */}
      {isSuperAdmin && onChangeRole && !isOwnProfile && (
        <div className="user-detail__security-item">
          <div className="user-detail__security-left">
            <div className="user-detail__security-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="user-detail__security-title">
                {t("users.detail.user_role", "Rol del Usuario")}
              </div>
              <div className="user-detail__security-desc">
                {t("users.detail.current_role", "Rol actual")}: {getRoleDisplayName(currentRoleName)}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onChangeRole} style={{ color: "var(--color-cyan-600)" }}>
            {t("users.detail.change_role", "Cambiar rol")}
          </Button>
        </div>
      )}

      {/* Danger Zone - No mostrar para el propio perfil */}
      {isSuperAdmin && !isOwnProfile && (
        <div className="user-detail__danger-zone">
          <h4 className="user-detail__danger-title">
            {t("users.detail.danger_zone", "Zona de Peligro")}
          </h4>
          <div className="user-detail__danger-item">
            <div className="user-detail__danger-info">
              <div className="user-detail__danger-item-title">
                {t("users.detail.delete_user", "Eliminar usuario")}
              </div>
              <div className="user-detail__danger-item-desc">
                {t("users.detail.delete_warning", "Esta acción no se puede deshacer.")}
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={onDeleteUser}>
              <Trash size={16} />
              {t("common.delete", "Eliminar")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserSecurityTab;
