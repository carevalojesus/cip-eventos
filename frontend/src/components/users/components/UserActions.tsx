import React, { useState, useRef, useEffect } from "react";
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
import type { User } from "@/services/users.service";
import { canResendVerificationEmail } from "@/lib/userUtils";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action: UserAction) => {
    setIsOpen(false);
    if (action === "view" && onView) {
      onView();
    } else {
      onAction(action, user);
    }
  };

  const canResendVerification = canResendVerificationEmail(user.verificationEmailSentAt);

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    padding: 0,
    background: "transparent",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: "background-color 150ms ease",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    right: 0,
    top: "100%",
    marginTop: "4px",
    minWidth: "200px",
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    zIndex: "var(--z-dropdown)",
    overflow: "hidden",
  };

  const itemStyle = (isDanger: boolean = false, isDisabled: boolean = false): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    width: "100%",
    padding: "var(--space-2) var(--space-3)",
    fontSize: "var(--font-size-sm)",
    color: isDisabled
      ? "var(--color-grey-400)"
      : isDanger
      ? "var(--color-danger)"
      : "var(--color-text-primary)",
    background: "none",
    border: "none",
    cursor: isDisabled ? "not-allowed" : "pointer",
    textAlign: "left",
    transition: "background-color 150ms ease",
    opacity: isDisabled ? 0.5 : 1,
  });

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
      <button
        style={buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-grey-100)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <DotsThree size={18} weight="bold" color="var(--color-grey-500)" />
      </button>

      {isOpen && (
        <div style={dropdownStyle}>
          {!user.isActive ? (
            // Inactive user: Only show activate option
            <button
              style={{ ...itemStyle(false), color: "var(--color-success)" }}
              onClick={() => handleAction("activate")}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-green-050)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Power size={16} />
              {t("users.list.actions.activate", "Activar usuario")}
            </button>
          ) : (
            // Active user: Show all options
            <>
              {/* Ver detalles */}
              {onView && (
                <button
                  style={itemStyle()}
                  onClick={() => handleAction("view")}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-grey-050)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Eye size={16} />
                  {t("users.list.actions.view", "Ver detalles")}
                </button>
              )}

              <button
                style={itemStyle(false, disabledActions.includes("edit"))}
                onClick={() => !disabledActions.includes("edit") && handleAction("edit")}
                onMouseEnter={(e) => {
                  if (!disabledActions.includes("edit")) {
                    e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
                  }
                }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <PencilSimple size={16} />
                {t("users.list.actions.edit", "Editar")}
              </button>

              <button
                style={itemStyle(false, disabledActions.includes("changeRole"))}
                onClick={() => !disabledActions.includes("changeRole") && handleAction("changeRole")}
                onMouseEnter={(e) => {
                  if (!disabledActions.includes("changeRole")) {
                    e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
                  }
                }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <UserGear size={16} />
                {t("users.list.actions.change_role", "Cambiar rol")}
              </button>

              <button
                style={itemStyle()}
                onClick={() => handleAction("resetPassword")}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-grey-050)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Key size={16} />
                {t("users.list.actions.reset_password", "Restablecer contraseña")}
              </button>

              {!user.isVerified && (
                <button
                  style={itemStyle(false, !canResendVerification)}
                  onClick={() => canResendVerification && handleAction("resendVerification")}
                  onMouseEnter={(e) => {
                    if (canResendVerification) {
                      e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
                    }
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title={
                    !canResendVerification
                      ? t("users.list.actions.resend_verification_wait", "Espera 5 minutos antes de reenviar")
                      : undefined
                  }
                >
                  <EnvelopeSimple size={16} />
                  {t("users.list.actions.resend_verification", "Reenviar verificación")}
                </button>
              )}

              <button
                style={itemStyle(true)}
                onClick={() => handleAction("delete")}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-red-050)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Trash size={16} />
                {t("users.list.actions.delete", "Eliminar")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserActions;
