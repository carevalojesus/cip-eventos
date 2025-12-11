import { useTranslation } from "react-i18next";
import {
  Phone,
  EnvelopeSimple,
  Briefcase,
  MapPin,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface UserPersonalTabProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    designation: string;
    description: string;
    address: string;
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
          disabled={!isEditing}
        />
        <Input
          label={t("users.field.lastName", "Apellidos")}
          value={formData.lastName}
          onChange={(e) => onFormChange("lastName", e.target.value)}
          placeholder={t("users.placeholder.lastName", "Apellido")}
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
        <Input
          label={t("users.field.designation", "Cargo / Título")}
          value={formData.designation}
          onChange={(e) => onFormChange("designation", e.target.value)}
          placeholder={t("users.placeholder.designation", "Ingeniero Civil Senior")}
          leftIcon={<Briefcase size={16} />}
          disabled={!isEditing}
        />
        <Input
          label={t("users.field.address", "Dirección")}
          value={formData.address}
          onChange={(e) => onFormChange("address", e.target.value)}
          placeholder={t("users.placeholder.address", "Av. Principal 123, Lima")}
          leftIcon={<MapPin size={16} />}
          disabled={!isEditing}
        />
        <div className="user-detail__form-grid--full">
          <Textarea
            label={t("users.field.description", "Descripción Profesional")}
            value={formData.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            placeholder={t("users.placeholder.description", "Breve descripción profesional...")}
            disabled={!isEditing}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

export default UserPersonalTab;
