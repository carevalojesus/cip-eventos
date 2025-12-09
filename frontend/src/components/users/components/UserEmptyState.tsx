import React from "react";
import { useTranslation } from "react-i18next";
import { UserPlus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/rui-button";
import { EmptyState } from "@/components/ui/rui/EmptyState";

interface UserEmptyStateProps {
  hasFilters: boolean;
  onCreateUser: () => void;
}

export const UserEmptyState: React.FC<UserEmptyStateProps> = ({
  hasFilters,
  onCreateUser,
}) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      illustration={hasFilters ? "no-results" : "no-users"}
      title={
        hasFilters
          ? t("users.list.empty.no_results", "No se encontraron usuarios")
          : t("users.list.empty.title", "No hay usuarios")
      }
      description={
        hasFilters
          ? t("users.list.empty.try_different", "Intenta con otros filtros de búsqueda.")
          : t("users.list.empty.description", "Crea tu primer usuario para comenzar.")
      }
      size="md"
      action={
        !hasFilters ? (
          <Button variant="primary" size="md" onClick={onCreateUser}>
            <UserPlus size={16} weight="bold" />
            {t("users.list.new_user", "Nuevo Usuario")}
          </Button>
        ) : undefined
      }
    />
  );
};

export default UserEmptyState;
