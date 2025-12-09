import React from "react";
import { useTranslation } from "react-i18next";
import { useCreateUser } from "@/hooks/useCreateUser";
import { CreateUserFormRui } from "./rui/CreateUserFormRui";
import { LoadingState } from "@/components/dashboard/LoadingState";

interface CreateUserViewProps {
  onNavigate: (path: string) => void;
}

export const CreateUserView: React.FC<CreateUserViewProps> = ({ onNavigate }) => {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith("en");
  const { form, roles, loading, submitting, onSubmit } = useCreateUser();

  const handleCancel = () => {
    const path = isEnglish ? "/en/users" : "/usuarios";
    onNavigate(path);
  };

  const handleSubmit = async (data: Parameters<typeof onSubmit>[0]) => {
    const success = await onSubmit(data);
    if (success) {
      const path = isEnglish ? "/en/users" : "/usuarios";
      onNavigate(path);
    }
    return success;
  };

  if (loading) {
    return <LoadingState message="Cargando roles..." />;
  }

  return (
    <CreateUserFormRui
      form={form}
      roles={roles}
      onSubmit={handleSubmit}
      submitting={submitting}
      onCancel={handleCancel}
    />
  );
};
