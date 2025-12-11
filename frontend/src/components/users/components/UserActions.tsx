/**
 * UserActions Component
 *
 * Menú de acciones para cada usuario en la tabla.
 * Usa DropdownMenu de Radix UI con estilos RUI personalizados.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  DotsThree,
  Eye,
  PencilSimple,
  Trash,
  UserGear,
  Key,
  EnvelopeSimple,
  Power,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/services/users.service";
import { canResendVerificationEmail } from "@/lib/userUtils";

import "./UserActions.css";

export type UserAction =
  | "view"
  | "edit"
  | "changeRole"
  | "resetPassword"
  | "resendVerification"
  | "delete"
  | "activate";

interface UserActionsProps {
  user: User;
  onAction: (action: UserAction, user: User) => void;
  onView?: () => void;
  disabledActions?: UserAction[];
}

export const UserActions: React.FC<UserActionsProps> = ({
  user,
  onAction,
  onView,
  disabledActions = [],
}) => {
  const { t } = useTranslation();
  const canResendVerification = canResendVerificationEmail(user.verificationEmailSentAt);

  const handleAction = (action: UserAction) => {
    if (action === "view" && onView) {
      onView();
    } else {
      onAction(action, user);
    }
  };

  // Helper para obtener clase del item
  const getItemClass = (variant?: "danger" | "success", disabled?: boolean) => {
    let className = "user-actions__item rui-dropdown-item";
    if (disabled) className += " user-actions__item--disabled";
    if (variant === "danger") className += " user-actions__item--danger";
    if (variant === "success") className += " user-actions__item--success";
    return className;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="user-actions__trigger"
          aria-label={t("users.list.actions.menu", "Menú de acciones")}
        >
          <DotsThree size={18} weight="bold" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="user-actions__content rui-dropdown"
      >
        {!user.isActive ? (
          // Usuario inactivo: Solo mostrar opción de activar
          <DropdownMenuItem
            className={getItemClass("success")}
            onClick={() => handleAction("activate")}
          >
            <Power size={16} />
            {t("users.list.actions.activate", "Activar usuario")}
          </DropdownMenuItem>
        ) : (
          // Usuario activo: Mostrar todas las opciones
          <>
            {/* Ver detalles */}
            {onView && (
              <DropdownMenuItem
                className={getItemClass()}
                onClick={() => handleAction("view")}
              >
                <Eye size={16} />
                {t("users.list.actions.view", "Ver detalles")}
              </DropdownMenuItem>
            )}

            {/* Editar */}
            <DropdownMenuItem
              className={getItemClass(undefined, disabledActions.includes("edit"))}
              onClick={() => !disabledActions.includes("edit") && handleAction("edit")}
              disabled={disabledActions.includes("edit")}
              title={disabledActions.includes("edit") ? t("common.coming_soon", "Próximamente") : undefined}
            >
              <PencilSimple size={16} />
              {t("users.list.actions.edit", "Editar")}
            </DropdownMenuItem>

            {/* Cambiar rol */}
            <DropdownMenuItem
              className={getItemClass(undefined, disabledActions.includes("changeRole"))}
              onClick={() => !disabledActions.includes("changeRole") && handleAction("changeRole")}
              disabled={disabledActions.includes("changeRole")}
              title={disabledActions.includes("changeRole") ? t("common.coming_soon", "Próximamente") : undefined}
            >
              <UserGear size={16} />
              {t("users.list.actions.change_role", "Cambiar rol")}
            </DropdownMenuItem>

            {/* Restablecer contraseña */}
            <DropdownMenuItem
              className={getItemClass()}
              onClick={() => handleAction("resetPassword")}
            >
              <Key size={16} />
              {t("users.list.actions.reset_password", "Restablecer contraseña")}
            </DropdownMenuItem>

            {/* Reenviar verificación (solo si no está verificado) */}
            {!user.isVerified && (
              <DropdownMenuItem
                className={getItemClass(undefined, !canResendVerification)}
                onClick={() => canResendVerification && handleAction("resendVerification")}
                disabled={!canResendVerification}
                title={
                  !canResendVerification
                    ? t("users.list.actions.resend_verification_wait", "Espera 5 minutos antes de reenviar")
                    : undefined
                }
              >
                <EnvelopeSimple size={16} />
                {t("users.list.actions.resend_verification", "Reenviar verificación")}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="user-actions__separator rui-dropdown-separator" />

            {/* Eliminar */}
            <DropdownMenuItem
              className={getItemClass("danger")}
              onClick={() => handleAction("delete")}
            >
              <Trash size={16} />
              {t("users.list.actions.delete", "Eliminar")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserActions;
