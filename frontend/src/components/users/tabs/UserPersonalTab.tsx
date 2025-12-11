/**
 * UserPersonalTab Component
 *
 * Tab de información personal con campos agrupados en secciones:
 * - Información Personal (nombre, apellido)
 * - Información de Contacto (email, teléfono, dirección)
 * - Información Profesional (cargo, descripción)
 *
 * Siguiendo el sistema de diseño RUI del proyecto.
 */
import { useTranslation } from "react-i18next";
import {
  User,
  Phone,
  EnvelopeSimple,
  Briefcase,
  MapPin,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import "./UserPersonalTab.css";

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
  errors?: Record<string, string>;
}

const MAX_DESCRIPTION_LENGTH = 500;

export function UserPersonalTab({
  formData,
  isEditing,
  onFormChange,
  errors = {},
}: UserPersonalTabProps) {
  const { t } = useTranslation();

  // Calcular caracteres restantes para descripción
  const descriptionLength = formData.description?.length || 0;
  const remainingChars = MAX_DESCRIPTION_LENGTH - descriptionLength;

  const getCharCounterClass = () => {
    if (remainingChars < 0) return "user-personal__char-counter user-personal__char-counter--error";
    if (remainingChars < 50) return "user-personal__char-counter user-personal__char-counter--warning";
    return "user-personal__char-counter";
  };

  return (
    <div className="user-personal">
      {/* ============================================
          Sección: Información Personal
          ============================================ */}
      <section className="user-personal__section">
        <div className="user-personal__section-header">
          <div className="user-personal__section-icon user-personal__section-icon--info">
            <User size={18} weight="duotone" />
          </div>
          <div className="user-personal__section-title-group">
            <h3 className="user-personal__section-title">
              {t("users.detail.section.personal_info", "Información Personal")}
            </h3>
            <p className="user-personal__section-subtitle">
              {t("users.detail.section.personal_info_desc", "Datos básicos de identificación")}
            </p>
          </div>
        </div>

        <div className="user-personal__form-grid">
          <Input
            label={t("users.field.firstName", "Nombres")}
            value={formData.firstName}
            onChange={(e) => onFormChange("firstName", e.target.value)}
            placeholder={t("users.placeholder.firstName", "Nombre")}
            disabled={!isEditing}
            required={isEditing}
            error={errors.firstName}
          />
          <Input
            label={t("users.field.lastName", "Apellidos")}
            value={formData.lastName}
            onChange={(e) => onFormChange("lastName", e.target.value)}
            placeholder={t("users.placeholder.lastName", "Apellido")}
            disabled={!isEditing}
            required={isEditing}
            error={errors.lastName}
          />
        </div>
      </section>

      {/* ============================================
          Sección: Información de Contacto
          ============================================ */}
      <section className="user-personal__section">
        <div className="user-personal__section-header">
          <div className="user-personal__section-icon user-personal__section-icon--contact">
            <EnvelopeSimple size={18} weight="duotone" />
          </div>
          <div className="user-personal__section-title-group">
            <h3 className="user-personal__section-title">
              {t("users.detail.section.contact_info", "Información de Contacto")}
            </h3>
            <p className="user-personal__section-subtitle">
              {t("users.detail.section.contact_info_desc", "Medios de comunicación y ubicación")}
            </p>
          </div>
        </div>

        <div className="user-personal__form-grid">
          <Input
            label={t("users.field.email", "Correo Electrónico")}
            type="email"
            value={formData.email}
            onChange={(e) => onFormChange("email", e.target.value)}
            placeholder={t("users.placeholder.email", "usuario@ejemplo.com")}
            leftIcon={<EnvelopeSimple size={16} />}
            disabled={!isEditing}
            required={isEditing}
            error={errors.email}
          />
          <Input
            label={t("users.field.phone", "Teléfono")}
            value={formData.phoneNumber}
            onChange={(e) => onFormChange("phoneNumber", e.target.value)}
            placeholder={t("users.placeholder.phone", "+51 987 654 321")}
            leftIcon={<Phone size={16} />}
            disabled={!isEditing}
          />
          <div className="user-personal__form-grid--full">
            <Input
              label={t("users.field.address", "Dirección")}
              value={formData.address}
              onChange={(e) => onFormChange("address", e.target.value)}
              placeholder={t("users.placeholder.address", "Av. Principal 123, Lima")}
              leftIcon={<MapPin size={16} />}
              disabled={!isEditing}
            />
          </div>
        </div>
      </section>

      {/* ============================================
          Sección: Información Profesional
          ============================================ */}
      <section className="user-personal__section">
        <div className="user-personal__section-header">
          <div className="user-personal__section-icon user-personal__section-icon--professional">
            <Briefcase size={18} weight="duotone" />
          </div>
          <div className="user-personal__section-title-group">
            <h3 className="user-personal__section-title">
              {t("users.detail.section.professional_info", "Información Profesional")}
            </h3>
            <p className="user-personal__section-subtitle">
              {t("users.detail.section.professional_info_desc", "Cargo y descripción laboral")}
            </p>
          </div>
        </div>

        <div className="user-personal__form-grid">
          <div className="user-personal__form-grid--full">
            <Input
              label={t("users.field.designation", "Cargo / Título")}
              value={formData.designation}
              onChange={(e) => onFormChange("designation", e.target.value)}
              placeholder={t("users.placeholder.designation", "Ingeniero Civil Senior")}
              leftIcon={<Briefcase size={16} />}
              disabled={!isEditing}
            />
          </div>
          <div className="user-personal__form-grid--full">
            <Textarea
              label={t("users.field.description", "Descripción Profesional")}
              value={formData.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              placeholder={t("users.placeholder.description", "Breve descripción de tu experiencia profesional, especialidades y áreas de interés...")}
              disabled={!isEditing}
              rows={4}
            />
            {isEditing && (
              <div className={getCharCounterClass()}>
                {remainingChars >= 0
                  ? t("users.field.chars_remaining", "{{count}} caracteres restantes", { count: remainingChars })
                  : t("users.field.chars_exceeded", "{{count}} caracteres excedidos", { count: Math.abs(remainingChars) })
                }
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Nota de campos requeridos (solo en modo edición) */}
      {isEditing && (
        <div className="user-personal__required-note">
          <span className="user-personal__required-asterisk">*</span>
          {t("users.detail.required_fields", "Campos requeridos")}
        </div>
      )}
    </div>
  );
}

export default UserPersonalTab;
