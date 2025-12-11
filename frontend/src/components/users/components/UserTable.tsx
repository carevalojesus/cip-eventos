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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";
import { UserAvatar } from "./UserAvatar";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserVerificationBadge } from "./UserVerificationBadge";
import { UserActions, type UserAction } from "./UserActions";
import { getFullName, getRoleDisplayName } from "@/lib/userUtils";
import { getLastAccessTime, getLocaleFromLang } from "@/lib/dateUtils";

import "./UserTable.css";

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
  // LOADING STATE - Skeleton
  // ============================================

  if (isLoading) {
    const skeletonRows = 5;
    return (
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th className="user-table__header user-table__header--checkbox">
                <Skeleton width={18} height={18} style={{ borderRadius: "var(--radius-sm)" }} />
              </th>
              <th className="user-table__header"><Skeleton width="60%" height={12} /></th>
              <th className="user-table__header"><Skeleton width="70%" height={12} /></th>
              <th className="user-table__header"><Skeleton width="50%" height={12} /></th>
              <th className="user-table__header"><Skeleton width="65%" height={12} /></th>
              <th className="user-table__header user-table__header--actions" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, index) => (
              <tr key={index} className="user-table__row">
                <td className="user-table__cell user-table__cell--checkbox">
                  <Skeleton width={18} height={18} style={{ borderRadius: "var(--radius-sm)" }} />
                </td>
                <td className="user-table__cell">
                  <div className="user-table__user-cell">
                    <SkeletonCircle size="2xl" />
                    <div className="user-table__user-info">
                      <Skeleton width={120 + Math.random() * 60} height={14} />
                      <Skeleton width={140 + Math.random() * 40} height={12} />
                    </div>
                  </div>
                </td>
                <td className="user-table__cell">
                  <div className="user-table__role-org">
                    <Skeleton width={80 + Math.random() * 40} height={14} />
                    <Skeleton width={100 + Math.random() * 30} height={12} />
                  </div>
                </td>
                <td className="user-table__cell">
                  <Skeleton width={70} height={24} style={{ borderRadius: "var(--radius-full)" }} />
                </td>
                <td className="user-table__cell">
                  <Skeleton width={90 + Math.random() * 30} height={14} />
                </td>
                <td className="user-table__cell user-table__cell--actions">
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

  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            {/* Checkbox header */}
            <th className="user-table__header user-table__header--checkbox">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleSelectAll}
                ariaLabel={isAllSelected ? t("common.deselect_all", "Deseleccionar todos") : t("common.select_all", "Seleccionar todos")}
              />
            </th>

            {/* Usuario */}
            <th className="user-table__header">
              {t("users.list.table.user", "Usuario")}
            </th>

            {/* Rol / Organización */}
            <th className="user-table__header user-table__header--role">
              {t("users.list.table.role_org", "Rol / Organización")}
            </th>

            {/* Estado */}
            <th className="user-table__header">
              {t("users.list.table.status", "Estado")}
            </th>

            {/* Último acceso */}
            <th className="user-table__header user-table__header--last-access">
              {t("users.list.table.last_access", "Último Acceso")}
            </th>

            {/* Acciones */}
            <th className="user-table__header user-table__header--actions">
              {/* Sin texto, solo espacio para icono */}
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => {
            const fullName = getFullName(user);
            const isSelected = selectedUsers.has(user.id);
            const lastAccess = getLastAccessTime(user.lastLoginAt, locale);

            const rowClass = `user-table__row ${isSelected ? "user-table__row--selected" : ""}`;

            return (
              <tr key={user.id} className={rowClass}>
                {/* Checkbox */}
                <td className="user-table__cell user-table__cell--checkbox">
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
                <td className="user-table__cell">
                  <div className="user-table__user-cell">
                    {/* Avatar con badge de verificación */}
                    <div className="user-table__avatar-container">
                      <UserAvatar user={user} size="md" />
                      <div className="user-table__verification-badge">
                        <UserVerificationBadge isVerified={user.isVerified} size="sm" />
                      </div>
                    </div>

                    {/* Nombre y email */}
                    <div className="user-table__user-info">
                      <button
                        onClick={() => onUserClick(user.id)}
                        className="user-table__user-name"
                      >
                        {fullName || user.email}
                      </button>
                      {fullName && <div className="user-table__user-email">{user.email}</div>}
                    </div>
                  </div>
                </td>

                {/* Rol / Organización */}
                <td className="user-table__cell user-table__cell--role">
                  <div className="user-table__role-org">
                    <span className="user-table__role" title={user.role?.description || ""}>
                      {user.role?.name ? t(`roles.${user.role.name}`, getRoleDisplayName(user.role.name)) : t("users.no_role", "Sin rol")}
                    </span>
                    {user.profile?.organization && (
                      <span className="user-table__org" title={user.profile.organization}>
                        {user.profile.organization}
                      </span>
                    )}
                  </div>
                </td>

                {/* Estado */}
                <td className="user-table__cell">
                  <UserStatusBadge
                    isActive={user.isActive}
                    isPending={!user.isVerified && user.isActive}
                  />
                </td>

                {/* Último acceso */}
                <td className="user-table__cell user-table__cell--last-access">
                  <span className="user-table__last-access" title={lastAccess.fullDate}>
                    {lastAccess.text}
                  </span>
                </td>

                {/* Acciones */}
                <td className="user-table__cell user-table__cell--actions">
                  <div className="user-table__actions">
                    <UserActions user={user} onAction={onAction} onView={() => onUserClick(user.id)} disabledActions={disabledActions} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
