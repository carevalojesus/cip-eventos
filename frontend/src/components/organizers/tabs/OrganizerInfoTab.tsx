import { useTranslation } from "react-i18next";
import {
    Buildings,
    Envelope,
    Globe,
    Image,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

import "./OrganizerTabs.css";

interface OrganizerInfoTabProps {
    formData: {
        name: string;
        email: string;
        website: string;
        logoUrl: string;
    };
    isEditing: boolean;
    onFormChange: (field: string, value: string) => void;
    errors?: Record<string, string>;
}

export function OrganizerInfoTab({
    formData,
    isEditing,
    onFormChange,
    errors = {},
}: OrganizerInfoTabProps) {
    const { t } = useTranslation();

    return (
        <div className="organizer-tab">
            {/* Sección: Información Básica */}
            <section className="organizer-tab__section">
                <div className="organizer-tab__section-header">
                    <div className="organizer-tab__section-icon organizer-tab__section-icon--info">
                        <Buildings size={18} weight="duotone" />
                    </div>
                    <div className="organizer-tab__section-title-group">
                        <h3 className="organizer-tab__section-title">
                            {t("organizers.detail.section.basic_info", "Información Básica")}
                        </h3>
                        <p className="organizer-tab__section-subtitle">
                            {t(
                                "organizers.detail.section.basic_info_desc",
                                "Datos principales del organizador"
                            )}
                        </p>
                    </div>
                </div>

                <div className="organizer-tab__form-grid">
                    <div className="organizer-tab__form-grid--full">
                        <Input
                            label={t("organizers.field.name", "Nombre del Organizador")}
                            value={formData.name}
                            onChange={(e) => onFormChange("name", e.target.value)}
                            placeholder={t(
                                "organizers.placeholder.name",
                                "Colegio de Ingenieros del Perú"
                            )}
                            leftIcon={<Buildings size={16} />}
                            disabled={!isEditing}
                            required={isEditing}
                            error={errors.name}
                        />
                    </div>
                </div>
            </section>

            {/* Sección: Contacto */}
            <section className="organizer-tab__section">
                <div className="organizer-tab__section-header">
                    <div className="organizer-tab__section-icon organizer-tab__section-icon--contact">
                        <Envelope size={18} weight="duotone" />
                    </div>
                    <div className="organizer-tab__section-title-group">
                        <h3 className="organizer-tab__section-title">
                            {t("organizers.detail.section.contact", "Contacto")}
                        </h3>
                        <p className="organizer-tab__section-subtitle">
                            {t(
                                "organizers.detail.section.contact_desc",
                                "Información de contacto y web"
                            )}
                        </p>
                    </div>
                </div>

                <div className="organizer-tab__form-grid">
                    <Input
                        label={t("organizers.field.email", "Email de contacto")}
                        type="email"
                        value={formData.email}
                        onChange={(e) => onFormChange("email", e.target.value)}
                        placeholder={t(
                            "organizers.placeholder.email",
                            "contacto@organizador.com"
                        )}
                        leftIcon={<Envelope size={16} />}
                        disabled={!isEditing}
                        error={errors.email}
                    />
                    <Input
                        label={t("organizers.field.website", "Sitio Web")}
                        type="url"
                        value={formData.website}
                        onChange={(e) => onFormChange("website", e.target.value)}
                        placeholder={t(
                            "organizers.placeholder.website",
                            "https://www.ejemplo.com"
                        )}
                        leftIcon={<Globe size={16} />}
                        disabled={!isEditing}
                        error={errors.website}
                    />
                </div>
            </section>

            {/* Sección: Logo */}
            <section className="organizer-tab__section">
                <div className="organizer-tab__section-header">
                    <div className="organizer-tab__section-icon organizer-tab__section-icon--logo">
                        <Image size={18} weight="duotone" />
                    </div>
                    <div className="organizer-tab__section-title-group">
                        <h3 className="organizer-tab__section-title">
                            {t("organizers.detail.section.logo", "Logo")}
                        </h3>
                        <p className="organizer-tab__section-subtitle">
                            {t(
                                "organizers.detail.section.logo_desc",
                                "Imagen institucional del organizador"
                            )}
                        </p>
                    </div>
                </div>

                <div className="organizer-tab__form-grid">
                    <div className="organizer-tab__form-grid--full">
                        <Input
                            label={t("organizers.field.logo", "URL del Logo")}
                            type="url"
                            value={formData.logoUrl}
                            onChange={(e) => onFormChange("logoUrl", e.target.value)}
                            placeholder={t(
                                "organizers.placeholder.logo",
                                "https://ejemplo.com/logo.png"
                            )}
                            disabled={!isEditing}
                            error={errors.logoUrl}
                        />
                    </div>

                    {formData.logoUrl && (
                        <div className="organizer-tab__logo-preview">
                            <img
                                src={formData.logoUrl}
                                alt={t("organizers.logo_preview", "Vista previa del logo")}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        </div>
                    )}
                </div>
            </section>

            {isEditing && (
                <div className="organizer-tab__required-note">
                    <span className="organizer-tab__required-asterisk">*</span>
                    {t("organizers.detail.required_fields", "Campos requeridos")}
                </div>
            )}
        </div>
    );
}

export default OrganizerInfoTab;
