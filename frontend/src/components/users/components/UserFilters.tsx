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

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole: string;
  onRoleChange: (roleId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
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
  selectedStatus,
  onStatusChange,
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
  const statusOptions = useMemo(() => [
    { value: "all", label: t("users.list.filter.all", "Todos") },
    { value: "active", label: t("users.list.status.active", "Activo") },
    { value: "inactive", label: t("users.list.status.inactive", "Inactivo") },
  ], [t]);

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

  // ============================================
  // ESTILOS
  // ============================================

  const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "var(--space-4)",
    marginBottom: "var(--space-4)",
    flexWrap: "wrap",
  };

  const filtersGroupStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    flexWrap: "wrap",
  };

  // Botón de filtros avanzados
  const filtersButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    height: "var(--button-height-lg)",
    padding: "0 var(--space-3)",
    backgroundColor: "var(--color-bg-primary)",
    border: `1px solid ${isPopoverOpen || advancedFiltersCount > 0 ? "var(--color-red-400)" : "var(--color-grey-200)"}`,
    borderRadius: "var(--radius-md)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: isPopoverOpen || advancedFiltersCount > 0 ? "var(--color-red-600)" : "var(--color-text-secondary)",
    cursor: "pointer",
    transition: "all 150ms ease",
    position: "relative",
  };

  // Badge contador
  const badgeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "18px",
    height: "18px",
    padding: "0 5px",
    backgroundColor: "var(--color-red-500)",
    color: "white",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "9999px",
  };

  // Popover container
  const popoverContainerStyle: React.CSSProperties = {
    position: "relative",
  };

  const popoverStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: "280px",
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg), var(--shadow-sm)",
    zIndex: 1000,
    padding: "var(--space-4)",
  };

  const popoverHeaderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--space-4)",
    paddingBottom: "var(--space-3)",
    borderBottom: "1px solid var(--color-grey-100)",
  };

  const popoverTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
  };

  const closeButtonStyle: React.CSSProperties = {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-grey-400)",
    cursor: "pointer",
    transition: "all 150ms ease",
  };

  const filterGroupStyle: React.CSSProperties = {
    marginBottom: "var(--space-4)",
  };

  const filterLabelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--font-size-xs)",
    fontWeight: 500,
    color: "var(--color-text-muted)",
    marginBottom: "var(--space-2)",
  };

  const selectContainerStyle: React.CSSProperties = {
    width: "100%",
  };

  const clearFiltersStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "right",
    fontSize: "var(--font-size-xs)",
    color: "var(--color-cyan-600)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "var(--space-2) 0",
    marginTop: "var(--space-2)",
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={containerStyle}>
      {/* Búsqueda a la izquierda */}
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={t("users.list.search_placeholder", "Buscar por nombre, correo o DNI...")}
        maxWidth="380px"
        ariaLabel={t("users.list.search_aria", "Buscar usuarios")}
      />

      {/* Filtros a la derecha */}
      <div style={filtersGroupStyle}>
        {/* Select de estado */}
        <Select
          value={selectedStatus}
          onChange={onStatusChange}
          options={statusOptions}
          placeholder={t("users.list.filter.status_label", "Estado")}
        />

        {/* Botón Exportar */}
        {onExport && (
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              height: "var(--button-height-lg)",
              padding: "0 var(--space-3)",
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-grey-200)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onClick={onExport}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-grey-300)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-grey-200)";
            }}
          >
            <Export size={16} />
            {t("users.list.export", "Exportar")}
          </button>
        )}

        {/* Botón de filtros avanzados con popover */}
        <div style={popoverContainerStyle}>
          <button
            ref={buttonRef}
            type="button"
            style={filtersButtonStyle}
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            onMouseEnter={(e) => {
              if (!isPopoverOpen && advancedFiltersCount === 0) {
                e.currentTarget.style.borderColor = "var(--color-grey-300)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isPopoverOpen && advancedFiltersCount === 0) {
                e.currentTarget.style.borderColor = "var(--color-grey-200)";
              }
            }}
          >
            <SlidersHorizontal size={16} weight={advancedFiltersCount > 0 ? "fill" : "regular"} />
            {t("users.list.filter.advanced", "Filtros")}
            {advancedFiltersCount > 0 && (
              <span style={badgeStyle}>{advancedFiltersCount}</span>
            )}
          </button>

          {/* Popover de filtros avanzados */}
          {isPopoverOpen && (
            <div ref={popoverRef} style={popoverStyle}>
              {/* Header */}
              <div style={popoverHeaderStyle}>
                <span style={popoverTitleStyle}>
                  {t("users.list.filter.advanced_title", "Filtros Avanzados")}
                </span>
                <button
                  type="button"
                  style={closeButtonStyle}
                  onClick={() => setIsPopoverOpen(false)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-grey-100)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Filtro de Rol */}
              <div style={filterGroupStyle}>
                <label style={filterLabelStyle}>
                  {t("users.list.filter.role_label", "Rol")}
                </label>
                <div style={selectContainerStyle}>
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
              <div style={filterGroupStyle}>
                <label style={filterLabelStyle}>
                  {t("users.list.filter.verification_label", "Verificación")}
                </label>
                <div style={selectContainerStyle}>
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
                  style={clearFiltersStyle}
                  onClick={() => {
                    onClearFilters();
                    setIsPopoverOpen(false);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
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
