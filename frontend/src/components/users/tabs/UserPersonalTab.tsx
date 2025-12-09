import { useTranslation } from "react-i18next";
import {
  User,
  Phone,
  EnvelopeSimple,
  Buildings,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/rui-input";

interface UserPersonalTabProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    organization: string;
  };
  isEditing: boolean;
  onFormChange: (field: string, value: string) => void;
}

export function UserPersonalTab({
  formData,
  isEditing,
  onFormChange,
}: UserPersonalTabProps) {
  const { t } = useTranslation();

  return (
    <div className="user-detail__card">
      <h3 className="user-detail__card-title">
        {t("users.detail.general_data", "Datos Generales")}
      </h3>
      <div className="user-detail__form-grid">
        <Input
          label={t("users.field.firstName", "Nombres")}
          value={formData.firstName}
          onChange={(e) => onFormChange("firstName", e.target.value)}
          placeholder={t("users.placeholder.firstName", "Nombre")}
          leftIcon={<User size={16} />}
          disabled={!isEditing}
        />
        <Input
          label={t("users.field.lastName", "Apellidos")}
          value={formData.lastName}
          onChange={(e) => onFormChange("lastName", e.target.value)}
          placeholder={t("users.placeholder.lastName", "Apellido")}
          leftIcon={<User size={16} />}
          disabled={!isEditing}
        />
        <Input
          label={t("users.field.email", "Correo Electrónico")}
          type="email"
          value={formData.email}
          onChange={(e) => onFormChange("email", e.target.value)}
          placeholder={t("users.placeholder.email", "usuario@ejemplo.com")}
          leftIcon={<EnvelopeSimple size={16} />}
          disabled={!isEditing}
        />
        <Input
          label={t("users.field.phone", "Teléfono")}
          value={formData.phoneNumber}
          onChange={(e) => onFormChange("phoneNumber", e.target.value)}
          placeholder={t("users.placeholder.phone", "+51 987 654 321")}
          leftIcon={<Phone size={16} />}
          disabled={!isEditing}
        />
        <div className="user-detail__form-grid--full">
          <Input
            label={t("users.field.organization", "Organización / Colegio")}
            value={formData.organization}
            onChange={(e) => onFormChange("organization", e.target.value)}
            placeholder={t("users.placeholder.organization", "CIP Lima")}
            leftIcon={<Buildings size={16} />}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );
}

export default UserPersonalTab;
