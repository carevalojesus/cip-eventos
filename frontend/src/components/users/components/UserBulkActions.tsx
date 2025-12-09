import React from "react";
import { useTranslation } from "react-i18next";
import { Check, Prohibit, ShieldCheck, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/rui";

export type BulkAction = "delete" | "activate" | "deactivate" | "resendVerification";

interface UserBulkActionsProps {
  selectedCount: number;
  onAction: (action: BulkAction) => void;
  onClearSelection: () => void;
}

export const UserBulkActions: React.FC<UserBulkActionsProps> = ({
  selectedCount,
  onAction,
  onClearSelection,
}) => {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  // ============================================
  // ESTILOS
  // ============================================

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-4)",
    padding: "var(--space-3) var(--space-4)",
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
    marginBottom: "var(--space-4)",
  };

  const leftSectionStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  };

  // Badge con check icon + contador (usando rojo primario)
  const countBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-1)",
    padding: "var(--space-1) var(--space-3)",
    backgroundColor: "var(--color-red-025)",
    color: "var(--color-red-600)",
    borderRadius: "var(--radius-full)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
  };

  // Link para cancelar selección
  const cancelLinkStyle: React.CSSProperties = {
    color: "var(--color-text-muted)",
    fontSize: "var(--font-size-sm)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={containerStyle}>
      {/* Izquierda: Badge + Cancelar */}
      <div style={leftSectionStyle}>
        <span style={countBadgeStyle}>
          <Check size={14} weight="bold" />
          {selectedCount} {t("users.bulk_actions.selected_short", "seleccionados")}
        </span>
        <button
          type="button"
          style={cancelLinkStyle}
          onClick={onClearSelection}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          {t("users.bulk_actions.cancel_selection", "Cancelar selección")}
        </button>
      </div>

      {/* Derecha: Acciones usando Button RUI */}
      <div style={actionsStyle}>
        {/* Desactivar */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => onAction("deactivate")}
          icon={<Prohibit size={16} color="var(--color-red-500)" />}
        >
          {t("users.bulk_actions.deactivate", "Desactivar")}
        </Button>

        {/* Verificar */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => onAction("resendVerification")}
          icon={<ShieldCheck size={16} color="var(--color-green-600)" />}
        >
          {t("users.bulk_actions.verify", "Verificar")}
        </Button>

        {/* Separador */}
        <div
          style={{
            width: "1px",
            height: "24px",
            backgroundColor: "var(--color-grey-200)",
            margin: "0 var(--space-1)",
          }}
        />

        {/* Eliminar */}
        <Button
          variant="danger"
          size="md"
          onClick={() => onAction("delete")}
          icon={<Trash size={16} />}
        >
          {t("users.bulk_actions.delete", "Eliminar")} ({selectedCount})
        </Button>
      </div>
    </div>
  );
};

export default UserBulkActions;
