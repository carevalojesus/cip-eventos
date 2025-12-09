import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

interface UserVerificationBadgeProps {
  isVerified: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export const UserVerificationBadge: React.FC<UserVerificationBadgeProps> = ({
  isVerified,
  showLabel = false,
  size = "sm",
}) => {
  const { t } = useTranslation();
  const iconSize = size === "sm" ? 18 : 24;

  if (!showLabel) {
    return isVerified ? (
      <CheckCircle size={iconSize} weight="fill" color="var(--color-success)" />
    ) : (
      <XCircle size={iconSize} weight="fill" color="var(--color-danger)" />
    );
  }

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: size === "sm" ? "4px 12px" : "6px 14px",
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
        <XCircle size={14} weight="fill" />
      )}
      {isVerified
        ? t("users.detail.verified", "Verificado")
        : t("users.detail.not_verified", "No verificado")}
    </span>
  );
};

export default UserVerificationBadge;
