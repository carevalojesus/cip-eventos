import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Globe,
  PlusCircle,
  PencilSimple,
  Trash,
  XCircle,
  ArrowCounterClockwise,
  Certificate,
  ArrowsClockwise,
  ArrowsLeftRight,
  SpinnerGap,
  ShieldCheck,
  EnvelopeSimple,
  Key,
  User,
} from "@phosphor-icons/react";
import { getRelativeTime, getLocaleFromLang } from "@/lib/dateUtils";
import { getRoleDisplayName } from "@/lib/userUtils";
import { auditService, type AuditLog } from "@/services/audit.service";

interface UserActivityTabProps {
  userId: string;
}

const getActivityIcon = (action: string, changedFields?: string[] | null) => {
  // Iconos específicos según el campo cambiado
  if (changedFields?.includes("roleId") || changedFields?.includes("roleName")) {
    return ShieldCheck;
  }
  if (changedFields?.includes("isVerified")) {
    return EnvelopeSimple;
  }
  if (changedFields?.includes("password") || changedFields?.includes("forcePasswordReset")) {
    return Key;
  }
  if (changedFields?.includes("isActive")) {
    return User;
  }

  switch (action) {
    case "CREATE":
      return PlusCircle;
    case "UPDATE":
      return PencilSimple;
    case "DELETE":
      return Trash;
    case "REVOKE":
      return XCircle;
    case "RESTORE":
      return ArrowCounterClockwise;
    case "REISSUE":
      return Certificate;
    case "MERGE":
      return ArrowsClockwise;
    case "TRANSFER":
      return ArrowsLeftRight;
    default:
      return Globe;
  }
};

const getFieldDisplayName = (field: string, t: (key: string, fallback: string) => string): string => {
  const fieldKeys: Record<string, string> = {
    email: "audit.fields.email",
    roleId: "audit.fields.role",
    roleName: "audit.fields.role",
    isActive: "audit.fields.status",
    isVerified: "audit.fields.verification",
    password: "audit.fields.password",
    forcePasswordReset: "audit.fields.force_reset",
    firstName: "audit.fields.first_name",
    lastName: "audit.fields.last_name",
    phoneNumber: "audit.fields.phone",
    designation: "audit.fields.designation",
    description: "audit.fields.description",
    address: "audit.fields.address",
    avatar: "audit.fields.avatar",
  };
  const fallbacks: Record<string, string> = {
    email: "Correo",
    roleId: "Rol",
    roleName: "Rol",
    isActive: "Estado",
    isVerified: "Verificación",
    password: "Contraseña",
    forcePasswordReset: "Forzar cambio",
    firstName: "Nombre",
    lastName: "Apellido",
    phoneNumber: "Teléfono",
    designation: "Cargo",
    description: "Descripción",
    address: "Dirección",
    avatar: "Avatar",
  };
  return t(fieldKeys[field] || field, fallbacks[field] || field);
};

const formatValue = (field: string, value: unknown, t: (key: string, fallback: string) => string): string => {
  if (value === null || value === undefined) return "-";

  if (field === "roleName" || field === "roleId") {
    if (typeof value === "string") {
      return getRoleDisplayName(value);
    }
    return String(value);
  }

  if (field === "isActive") {
    return value ? t("audit.values.active", "Activo") : t("audit.values.inactive", "Inactivo");
  }

  if (field === "isVerified") {
    return value ? t("audit.values.verified", "Verificado") : t("audit.values.not_verified", "No verificado");
  }

  if (field === "forcePasswordReset") {
    return value ? t("audit.values.enabled", "Activado") : t("audit.values.disabled", "Desactivado");
  }

  if (field === "password") {
    return "••••••••";
  }

  if (typeof value === "boolean") {
    return value ? t("common.yes", "Sí") : t("common.no", "No");
  }

  return String(value);
};

const getActivityDescription = (
  activity: AuditLog,
  t: (key: string, options?: Record<string, unknown> | string) => string
): string => {
  const { action, changedFields, previousValues, newValues, reason, entityType } = activity;

  // Si hay razón específica, usarla
  if (reason) {
    return reason;
  }

  // Crear usuario
  if (action === "CREATE" && entityType === "User") {
    const email = newValues?.email;
    return email
      ? t("audit.user_created_with_email", { email, defaultValue: `Usuario creado con correo ${email}` })
      : t("audit.user_created", "Usuario creado");
  }

  // Eliminar/Desactivar usuario
  if (action === "DELETE" && entityType === "User") {
    return t("audit.user_deactivated", "Usuario desactivado");
  }

  // Actualización con campos específicos
  if (action === "UPDATE" && changedFields && changedFields.length > 0) {
    const descriptions: string[] = [];

    for (const field of changedFields) {
      const oldVal = previousValues?.[field];
      const newVal = newValues?.[field];

      if (field === "roleId" || field === "roleName") {
        const oldRole = previousValues?.roleName || previousValues?.roleId;
        const newRole = newValues?.roleName || newValues?.roleId;
        const oldRoleName = formatValue("roleName", oldRole, t as (key: string, fallback: string) => string);
        const newRoleName = formatValue("roleName", newRole, t as (key: string, fallback: string) => string);
        descriptions.push(t("audit.role_changed", { from: oldRoleName, to: newRoleName, defaultValue: `Rol cambiado de "${oldRoleName}" a "${newRoleName}"` }));
      } else if (field === "isVerified" && newVal === true) {
        descriptions.push(t("audit.email_verified_manually", "Correo verificado manualmente"));
      } else if (field === "isActive") {
        descriptions.push(newVal
          ? t("audit.user_activated", "Usuario activado")
          : t("audit.user_deactivated", "Usuario desactivado"));
      } else if (field === "forcePasswordReset") {
        descriptions.push(newVal
          ? t("audit.force_reset_enabled", "Forzar cambio de contraseña activado")
          : t("audit.force_reset_disabled", "Forzar cambio de contraseña desactivado"));
      } else if (field === "password") {
        descriptions.push(t("audit.password_updated", "Contraseña actualizada"));
      } else {
        const fieldName = getFieldDisplayName(field, t as (key: string, fallback: string) => string);
        const oldValue = formatValue(field, oldVal, t as (key: string, fallback: string) => string);
        const newValue = formatValue(field, newVal, t as (key: string, fallback: string) => string);
        descriptions.push(t("audit.field_changed", { field: fieldName, from: oldValue, to: newValue, defaultValue: `${fieldName}: "${oldValue}" → "${newValue}"` }));
      }
    }

    return descriptions.join(". ");
  }

  return t("audit.generic_action", { action, entity: entityType, defaultValue: `${action} en ${entityType}` });
};

export function UserActivityTab({ userId }: UserActivityTabProps) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith("en");
  const locale = getLocaleFromLang(isEnglish ? "en" : "es");

  const { data, isLoading, error } = useQuery({
    queryKey: ["auditLogs", userId],
    queryFn: () => auditService.getByUserId(userId, 1, 50),
  });

  const activityLogs = data?.data || [];

  if (isLoading) {
    return (
      <div className="user-detail__card">
        <h3 className="user-detail__card-title">
          {t("users.detail.activity_log", "Registro de Actividad")}
        </h3>
        <div className="user-detail__loading" style={{ minHeight: "200px" }}>
          <SpinnerGap size={24} className="animate-spin" style={{ color: "var(--color-grey-400)" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-detail__card">
        <h3 className="user-detail__card-title">
          {t("users.detail.activity_log", "Registro de Actividad")}
        </h3>
        <div className="user-detail__empty">
          {t("common.error", "Error al cargar los datos")}
        </div>
      </div>
    );
  }

  if (activityLogs.length === 0) {
    return (
      <div className="user-detail__card">
        <h3 className="user-detail__card-title">
          {t("users.detail.activity_log", "Registro de Actividad")}
        </h3>
        <div className="user-detail__empty">
          {t("users.detail.no_activity", "No hay actividad registrada")}
        </div>
      </div>
    );
  }

  return (
    <div className="user-detail__card">
      <h3 className="user-detail__card-title">
        {t("users.detail.activity_log", "Registro de Actividad")}
      </h3>
      {activityLogs.map((activity) => {
        const IconComponent = getActivityIcon(activity.action, activity.changedFields);
        const description = getActivityDescription(activity, t);
        const performedBy = activity.performedByEmail || activity.performedBy?.email;

        return (
          <div key={activity.id} className="user-detail__activity-item">
            <div className="user-detail__activity-icon">
              <IconComponent size={18} />
            </div>
            <div className="user-detail__activity-content">
              <div className="user-detail__activity-title">
                {description}
              </div>
              <div className="user-detail__activity-meta">
                {performedBy && (
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {t("audit.performed_by", { email: performedBy, defaultValue: `por ${performedBy}` })}
                  </span>
                )}
                {performedBy && activity.ipAddress && " • "}
                {activity.ipAddress && (
                  <span style={{ color: "var(--color-grey-400)" }}>
                    IP: {activity.ipAddress}
                  </span>
                )}
              </div>
            </div>
            <div className="user-detail__activity-time">
              {getRelativeTime(activity.createdAt, locale)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default UserActivityTab;
