import { useTranslation } from "react-i18next";
import {
  Key,
  ArrowClockwise,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/rui-button";
import { Switch } from "@/components/ui/rui-switch";

interface UserSecurityTabProps {
  isSuperAdmin: boolean;
  forcePasswordReset: boolean;
  onForcePasswordResetChange: (value: boolean) => void;
  onResetPassword: () => void;
  onDeleteUser: () => void;
  lastPasswordChange?: string;
}

export function UserSecurityTab({
  isSuperAdmin,
  forcePasswordReset,
  onForcePasswordResetChange,
  onResetPassword,
  onDeleteUser,
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
        <Button variant="ghost" size="sm" onClick={onResetPassword}>
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

      {/* Danger Zone */}
      {isSuperAdmin && (
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
