/**
 * UserPageHeader Component
 *
 * Header para la vista de lista de usuarios usando el componente
 * PageHeader del sistema de diseño RUI.
 *
 * Incluye:
 * - Título y descripción
 * - Botón de crear nuevo usuario (primario)
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "@phosphor-icons/react";
import { PageHeader } from "@/components/ui/rui";
import { Button } from "@/components/ui/rui-button";

interface UserPageHeaderProps {
  /** Callback para crear nuevo usuario */
  onCreateUser: () => void;
}

export const UserPageHeader: React.FC<UserPageHeaderProps> = ({
  onCreateUser,
}) => {
  const { t } = useTranslation();

  return (
    <PageHeader
      title={t("users.list.title", "Gestión de Usuarios")}
      subtitle={t("users.list.subtitle", "Administra los accesos y permisos de la plataforma.")}
      action={
        <Button variant="primary" size="md" onClick={onCreateUser}>
          <Plus size={18} weight="bold" />
          {t("users.list.new_user", "Nuevo Usuario")}
        </Button>
      }
    />
  );
};

export default UserPageHeader;
