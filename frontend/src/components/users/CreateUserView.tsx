import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CreateUserDrawer } from "./CreateUserDrawer";

interface CreateUserViewProps {
  onNavigate: (path: string) => void;
}

export const CreateUserView: React.FC<CreateUserViewProps> = ({ onNavigate }) => {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith("en");

  const handleClose = () => {
    const path = isEnglish ? "/en/users" : "/usuarios";
    onNavigate(path);
  };

  const handleSuccess = () => {
    const path = isEnglish ? "/en/users" : "/usuarios";
    onNavigate(path);
  };

  // Auto-open drawer when view mounts
  return (
    <CreateUserDrawer
      isOpen={true}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
};
