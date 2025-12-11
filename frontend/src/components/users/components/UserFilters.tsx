/**
 * UserFilters Component
 *
 * Barra de filtros para la lista de usuarios con:
 * - Búsqueda por nombre, correo o DNI
 * - Select de estado usando Select RUI
 * - Botón de filtros avanzados con popover
 * - Chips de verificación con colores de la paleta
 *
 * NOTA: Usa componentes reutilizables del sistema de diseño
 * para mantener consistencia visual.
 */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, X, Export } from "@phosphor-icons/react";
import { SearchInput, Select } from "@/components/ui/rui";
import type { Role } from "@/services/users.service";
import { getRoleDisplayName } from "@/lib/userUtils";

import "./UserFilters.css";

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole: string;
  onRoleChange: (roleId: string) => void;
  selectedVerification: string;
  onVerificationChange: (verification: string) => void;
  roles: Role[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExport?: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedVerification,
  onVerificationChange,
  roles,
  hasActiveFilters,
  onClearFilters,
  onExport,
}) => {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Contar filtros activos en el popover (excluyendo estado que está afuera)
  const advancedFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedRole !== "all") count++;
    if (selectedVerification !== "all") count++;
    return count;
  }, [selectedRole, selectedVerification]);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Opciones para los filtros
  const roleOptions = useMemo(() => [
    { value: "all", label: t("users.list.filter.all_roles", "Todos los roles") },
    ...roles.map((role) => ({
      value: role.id.toString(),
      label: t(`roles.${role.name}`, getRoleDisplayName(role.name)),
    })),
  ], [roles, t]);

  const verificationOptions = useMemo(() => [
    { value: "all", label: t("users.list.filter.all", "Todos") },
    { value: "verified", label: t("users.list.filter.verified", "Verificado") },
    { value: "unverified", label: t("users.list.filter.unverified", "No verificado") },
  ], [t]);

  // Determinar clase del botón de filtros
  const isFilterButtonActive = isPopoverOpen || advancedFiltersCount > 0;
  const filterButtonClass = `user-filters__button ${isFilterButtonActive ? "user-filters__button--active" : ""}`;

  return (
    <div className="user-filters">
      {/* Búsqueda a la izquierda */}
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={t("users.list.search_placeholder", "Buscar por nombre, correo o DNI...")}
        maxWidth="380px"
        ariaLabel={t("users.list.search_aria", "Buscar usuarios")}
      />

      {/* Filtros a la derecha */}
      <div className="user-filters__group">
        {/* Botón Exportar */}
        {onExport && (
          <button
            type="button"
            className="user-filters__export"
            onClick={onExport}
          >
            <Export size={16} />
            {t("users.list.export", "Exportar")}
          </button>
        )}

        {/* Botón de filtros avanzados con popover */}
        <div className="user-filters__popover-container">
          <button
            ref={buttonRef}
            type="button"
            className={filterButtonClass}
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          >
            <SlidersHorizontal size={16} weight={advancedFiltersCount > 0 ? "fill" : "regular"} />
            {t("users.list.filter.advanced", "Filtros")}
            {advancedFiltersCount > 0 && (
              <span className="user-filters__badge">{advancedFiltersCount}</span>
            )}
          </button>

          {/* Popover de filtros avanzados */}
          {isPopoverOpen && (
            <div ref={popoverRef} className="user-filters__popover">
              {/* Header */}
              <div className="user-filters__popover-header">
                <span className="user-filters__popover-title">
                  {t("users.list.filter.advanced_title", "Filtros Avanzados")}
                </span>
                <button
                  type="button"
                  className="user-filters__close-button"
                  onClick={() => setIsPopoverOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Filtro de Rol */}
              <div className="user-filters__filter-group">
                <label className="user-filters__filter-label">
                  {t("users.list.filter.role_label", "Rol")}
                </label>
                <div className="user-filters__select-container">
                  <Select
                    value={selectedRole}
                    onChange={onRoleChange}
                    options={roleOptions}
                    placeholder={t("users.list.filter.all_roles", "Todos los roles")}
                    fullWidth
                  />
                </div>
              </div>

              {/* Filtro de Verificación */}
              <div className="user-filters__filter-group">
                <label className="user-filters__filter-label">
                  {t("users.list.filter.verification_label", "Verificación")}
                </label>
                <div className="user-filters__select-container">
                  <Select
                    value={selectedVerification}
                    onChange={onVerificationChange}
                    options={verificationOptions}
                    placeholder={t("users.list.filter.all", "Todos")}
                    fullWidth
                  />
                </div>
              </div>

              {/* Limpiar filtros */}
              {hasActiveFilters && (
                <button
                  type="button"
                  className="user-filters__clear"
                  onClick={() => {
                    onClearFilters();
                    setIsPopoverOpen(false);
                  }}
                >
                  {t("users.list.filter.clear", "Limpiar filtros")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
