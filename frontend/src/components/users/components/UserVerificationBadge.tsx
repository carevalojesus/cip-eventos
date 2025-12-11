import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, Clock } from "@phosphor-icons/react";

interface UserVerificationBadgeProps {
  isVerified: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

/**
 * Badge consistente para mostrar el estado de verificación del usuario.
 * - Verificado: verde (success)
 * - No verificado: amarillo (warning/pending) - representa un estado pendiente, no un error
 */
export const UserVerificationBadge: React.FC<UserVerificationBadgeProps> = ({
  isVerified,
  showLabel = false,
  size = "sm",
}) => {
  const { t } = useTranslation();
  const iconSize = size === "sm" ? 18 : 24;

  // Colores consistentes: verde para verificado, amarillo para pendiente
  const verifiedColor = "var(--color-green-600)";
  const pendingColor = "var(--color-yellow-600)";

  if (!showLabel) {
    return isVerified ? (
      <CheckCircle size={iconSize} weight="fill" color={verifiedColor} />
    ) : (
      <Clock size={iconSize} weight="fill" color={pendingColor} />
    );
  }

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-1)",
    padding: size === "sm" ? "var(--space-1) var(--space-3)" : "var(--space-2) var(--space-4)",
    fontSize: size === "sm" ? "var(--font-size-xs)" : "var(--font-size-sm)",
    fontWeight: 500,
    borderRadius: "var(--radius-full)",
    background: isVerified ? "var(--color-green-100)" : "var(--color-yellow-100)",
    color: isVerified ? "var(--color-green-700)" : "var(--color-yellow-700)",
  };

  return (
    <span style={badgeStyle}>
      {isVerified ? (
        <CheckCircle size={14} weight="fill" />
      ) : (
        <Clock size={14} weight="fill" />
      )}
      {isVerified
        ? t("users.detail.verified", "Verificado")
        : t("users.detail.not_verified", "No verificado")}
    </span>
  );
};

export default UserVerificationBadge;
