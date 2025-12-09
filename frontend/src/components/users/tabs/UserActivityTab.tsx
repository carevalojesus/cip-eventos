import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Globe,
  SignIn,
  SignOut,
  Key,
  UserCircle,
  ShieldCheck,
  SpinnerGap,
} from "@phosphor-icons/react";
import { getRelativeTime, getLocaleFromLang } from "@/lib/dateUtils";

interface ActivityLog {
  id: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface UserActivityTabProps {
  userId: string;
  activityLogs?: ActivityLog[];
  isLoading?: boolean;
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case "LOGIN":
    case "LOGIN_SUCCESS":
      return SignIn;
    case "LOGOUT":
      return SignOut;
    case "PASSWORD_CHANGE":
    case "PASSWORD_RESET":
      return Key;
    case "PROFILE_UPDATE":
      return UserCircle;
    case "ROLE_CHANGE":
      return ShieldCheck;
    default:
      return Globe;
  }
};

const getActivityTitle = (action: string, t: (key: string, fallback: string) => string) => {
  const titles: Record<string, string> = {
    LOGIN: t("users.activity.login", "Inicio de sesión"),
    LOGIN_SUCCESS: t("users.activity.login_success", "Inicio de sesión exitoso"),
    LOGIN_FAILED: t("users.activity.login_failed", "Intento de inicio fallido"),
    LOGOUT: t("users.activity.logout", "Cierre de sesión"),
    PASSWORD_CHANGE: t("users.activity.password_change", "Cambio de contraseña"),
    PASSWORD_RESET: t("users.activity.password_reset", "Restablecimiento de contraseña"),
    PROFILE_UPDATE: t("users.activity.profile_update", "Actualización de perfil"),
    ROLE_CHANGE: t("users.activity.role_change", "Cambio de rol"),
  };
  return titles[action] || action;
};

const parseUserAgent = (userAgent?: string): string => {
  if (!userAgent) return "Desconocido";

  let browser = "Navegador";
  let os = "Sistema";

  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  return `${browser} en ${os}`;
};

export function UserActivityTab({
  userId,
  activityLogs = [],
  isLoading = false,
}: UserActivityTabProps) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith("en");
  const locale = getLocaleFromLang(isEnglish ? "en" : "es");

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
        const IconComponent = getActivityIcon(activity.action);
        return (
          <div key={activity.id} className="user-detail__activity-item">
            <div className="user-detail__activity-icon">
              <IconComponent size={18} />
            </div>
            <div className="user-detail__activity-content">
              <div className="user-detail__activity-title">
                {getActivityTitle(activity.action, t)}
              </div>
              <div className="user-detail__activity-meta">
                {activity.ipAddress && `IP: ${activity.ipAddress}`}
                {activity.ipAddress && activity.userAgent && " • "}
                {activity.userAgent && parseUserAgent(activity.userAgent)}
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
