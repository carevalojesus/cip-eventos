/**
 * UserTable Component
 *
 * Tabla de usuarios con:
 * - Checkbox para selección múltiple
 * - Avatar con badge de verificación
 * - Columna ROL / ORGANIZACIÓN combinada
 * - Estado (Activo/Inactivo/Pendiente)
 * - Último acceso con tiempo relativo
 * - Menú de acciones con dropdown
 *
 * Siguiendo el sistema de diseño RUI del proyecto.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import type { User } from "@/services/users.service";
import { Checkbox } from "@/components/ui/rui";
import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";
import { UserAvatar } from "./UserAvatar";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserVerificationBadge } from "./UserVerificationBadge";
import { UserActions, type UserAction } from "./UserActions";
import { getFullName, getRoleDisplayName } from "@/lib/userUtils";
import { getLastAccessTime, getLocaleFromLang } from "@/lib/dateUtils";

interface UserTableProps {
  users: User[];
  selectedUsers: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onUserClick: (userId: string) => void;
  onAction: (action: UserAction, user: User) => void;
  isLoading?: boolean;
  disabledActions?: UserAction[];
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  onSelectionChange,
  onUserClick,
  onAction,
  isLoading = false,
  disabledActions = [],
}) => {
  const { t, i18n } = useTranslation();
  const locale = getLocaleFromLang(i18n.language?.startsWith("en") ? "en" : "es");

  // ============================================
  // HELPERS DE SELECCIÓN
  // ============================================

  const isAllSelected = users.length > 0 && users.every((user) => selectedUsers.has(user.id));
  const isSomeSelected = users.some((user) => selectedUsers.has(user.id));
  const isIndeterminate = isSomeSelected && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(users.map((user) => user.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    onSelectionChange(newSelection);
  };

  // ============================================
  // ESTILOS
  // ============================================

  const tableContainerStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle: React.CSSProperties = {
    padding: "var(--space-3) var(--space-4)",
    textAlign: "left",
    fontSize: "var(--font-size-xs)",
    fontWeight: 600,
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    backgroundColor: "var(--color-grey-050)",
    borderBottom: "1px solid var(--color-grey-200)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "var(--space-4)",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-primary)",
    borderBottom: "1px solid var(--color-grey-100)",
    verticalAlign: "middle",
  };

  const checkboxCellStyle: React.CSSProperties = {
    width: "48px",
    padding: "var(--space-3) var(--space-4)",
    textAlign: "center",
  };

  // Celda de usuario con avatar y verificación
  const userCellStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  };

  const avatarContainerStyle: React.CSSProperties = {
    position: "relative",
    flexShrink: 0,
  };

  // Badge de verificación sobre el avatar
  const verificationBadgeStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    backgroundColor: "var(--color-bg-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const userInfoStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0, // Para text truncate
  };

  const userNameButtonStyle: React.CSSProperties = {
    fontWeight: 500,
    color: "var(--color-cyan-700)",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
    fontSize: "inherit",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textDecoration: "none",
    transition: "color 150ms ease, text-decoration 150ms ease",
    borderRadius: "var(--radius-sm)",
  };

  const emailStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  // Rol y organización
  const roleOrgContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    maxWidth: "200px",
  };

  const roleStyle: React.CSSProperties = {
    fontWeight: 500,
    color: "var(--color-text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const orgStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const lastAccessStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
  };

  // Contenedor de acciones
  const actionsCellStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  };

  // ============================================
  // LOADING STATE - Skeleton
  // ============================================

  if (isLoading) {
    const skeletonRows = 5;
    return (
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, ...checkboxCellStyle, borderTopLeftRadius: "var(--radius-lg)" }}>
                <Skeleton width={18} height={18} style={{ borderRadius: "var(--radius-sm)" }} />
              </th>
              <th style={thStyle}><Skeleton width="60%" height={12} /></th>
              <th style={thStyle}><Skeleton width="70%" height={12} /></th>
              <th style={thStyle}><Skeleton width="50%" height={12} /></th>
              <th style={thStyle}><Skeleton width="65%" height={12} /></th>
              <th style={{ ...thStyle, borderTopRightRadius: "var(--radius-lg)" }} />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, index) => (
              <tr key={index}>
                <td style={{ ...tdStyle, ...checkboxCellStyle }}>
                  <Skeleton width={18} height={18} style={{ borderRadius: "var(--radius-sm)" }} />
                </td>
                <td style={tdStyle}>
                  <div style={userCellStyle}>
                    <SkeletonCircle size="2xl" />
                    <div style={{ ...userInfoStyle, gap: "var(--space-2)" }}>
                      <Skeleton width={120 + Math.random() * 60} height={14} />
                      <Skeleton width={140 + Math.random() * 40} height={12} />
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    <Skeleton width={80 + Math.random() * 40} height={14} />
                    <Skeleton width={100 + Math.random() * 30} height={12} />
                  </div>
                </td>
                <td style={tdStyle}>
                  <Skeleton width={70} height={24} style={{ borderRadius: "var(--radius-full)" }} />
                </td>
                <td style={tdStyle}>
                  <Skeleton width={90 + Math.random() * 30} height={14} />
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <Skeleton width={28} height={28} style={{ borderRadius: "var(--radius-md)", marginLeft: "auto" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  // Wrapper para tabla + paginación
  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={wrapperStyle}>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
          <tr>
            {/* Checkbox header */}
            <th style={{ ...thStyle, ...checkboxCellStyle, borderTopLeftRadius: "var(--radius-lg)" }}>
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleSelectAll}
                ariaLabel={isAllSelected ? t("common.deselect_all", "Deseleccionar todos") : t("common.select_all", "Seleccionar todos")}
              />
            </th>

            {/* Usuario */}
            <th style={thStyle}>
              {t("users.list.table.user", "Usuario")}
            </th>

            {/* Rol / Organización */}
            <th style={thStyle}>
              {t("users.list.table.role_org", "Rol / Organización")}
            </th>

            {/* Estado */}
            <th style={thStyle}>
              {t("users.list.table.status", "Estado")}
            </th>

            {/* Último acceso */}
            <th style={thStyle}>
              {t("users.list.table.last_access", "Último Acceso")}
            </th>

            {/* Acciones */}
            <th style={{ ...thStyle, width: "60px", textAlign: "right", borderTopRightRadius: "var(--radius-lg)" }}>
              {/* Sin texto, solo espacio para icono */}
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user, index) => {
            const fullName = getFullName(user);
            const isSelected = selectedUsers.has(user.id);
            const lastAccess = getLastAccessTime(user.lastLoginAt, locale);
            const isLastRow = index === users.length - 1;

            return (
              <tr
                key={user.id}
                style={{
                  backgroundColor: isSelected ? "var(--color-red-025)" : undefined,
                }}
              >
                {/* Checkbox */}
                <td style={{
                  ...tdStyle,
                  ...checkboxCellStyle,
                  borderBottom: isLastRow ? "none" : tdStyle.borderBottom,
                  borderBottomLeftRadius: isLastRow ? "var(--radius-lg)" : undefined,
                }}>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleSelectUser(user.id)}
                    ariaLabel={isSelected
                      ? t("common.deselect_user", "Deseleccionar usuario")
                      : t("common.select_user", "Seleccionar usuario")
                    }
                  />
                </td>

                {/* Usuario (Avatar con badge + nombre + email) */}
                <td style={{ ...tdStyle, borderBottom: isLastRow ? "none" : tdStyle.borderBottom }}>
                  <div style={userCellStyle}>
                    {/* Avatar con badge de verificación */}
                    <div style={avatarContainerStyle}>
                      <UserAvatar user={user} size="md" />
                      <div style={verificationBadgeStyle}>
                        <UserVerificationBadge isVerified={user.isVerified} size="sm" />
                      </div>
                    </div>

                    {/* Nombre y email */}
                    <div style={userInfoStyle}>
                      <button
                        onClick={() => onUserClick(user.id)}
                        style={userNameButtonStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = "underline";
                          e.currentTarget.style.color = "var(--color-cyan-800)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = "none";
                          e.currentTarget.style.color = "var(--color-cyan-700)";
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.outline = "2px solid var(--color-cyan-500)";
                          e.currentTarget.style.outlineOffset = "2px";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.outline = "none";
                        }}
                      >
                        {fullName || user.email}
                      </button>
                      {fullName && <div style={emailStyle}>{user.email}</div>}
                    </div>
                  </div>
                </td>

                {/* Rol / Organización */}
                <td style={{ ...tdStyle, borderBottom: isLastRow ? "none" : tdStyle.borderBottom }}>
                  <div style={roleOrgContainerStyle}>
                    <span style={roleStyle} title={user.role?.description || ""}>
                      {user.role?.name ? t(`roles.${user.role.name}`, getRoleDisplayName(user.role.name)) : t("users.no_role", "Sin rol")}
                    </span>
                    {user.profile?.organization && (
                      <span style={orgStyle} title={user.profile.organization}>
                        {user.profile.organization}
                      </span>
                    )}
                  </div>
                </td>

                {/* Estado */}
                <td style={{ ...tdStyle, borderBottom: isLastRow ? "none" : tdStyle.borderBottom }}>
                  <UserStatusBadge
                    isActive={user.isActive}
                    isPending={!user.isVerified && user.isActive}
                  />
                </td>

                {/* Último acceso */}
                <td style={{ ...tdStyle, borderBottom: isLastRow ? "none" : tdStyle.borderBottom }}>
                  <span style={lastAccessStyle} title={lastAccess.fullDate}>
                    {lastAccess.text}
                  </span>
                </td>

                {/* Acciones */}
                <td style={{
                  ...tdStyle,
                  textAlign: "right",
                  borderBottom: isLastRow ? "none" : tdStyle.borderBottom,
                  borderBottomRightRadius: isLastRow ? "var(--radius-lg)" : undefined,
                }}>
                  <div style={actionsCellStyle}>
                    <UserActions user={user} onAction={onAction} onView={() => onUserClick(user.id)} disabledActions={disabledActions} />
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
