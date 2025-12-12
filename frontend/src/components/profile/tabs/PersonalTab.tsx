/**
 * PersonalTab Component
 *
 * Tab de información personal del perfil.
 */
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    User,
    Phone,
    Envelope,
    MapPin,
    Briefcase,
    SpinnerGap,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Profile, UpdateProfileDto } from "@/services/profile.service";

interface PersonalTabProps {
    profile: Profile | null;
    isLoading: boolean;
    onSave: (data: UpdateProfileDto) => void;
    isSaving: boolean;
    userEmail: string;
}

export const PersonalTab: React.FC<PersonalTabProps> = ({
    profile,
    isLoading,
    onSave,
    isSaving,
    userEmail,
}) => {
    const { t } = useTranslation();

    const [formData, setFormData] = useState<UpdateProfileDto>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        designation: "",
        description: "",
        address: "",
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                phoneNumber: profile.phoneNumber || "",
                designation: profile.designation || "",
                description: profile.description || "",
                address: profile.address || "",
            });
        }
    }, [profile]);

    const handleChange = (field: keyof UpdateProfileDto, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (isLoading) {
        return (
            <div className="profile__loading">
                <SpinnerGap size={32} className="profile__spinner" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="profile__form">
            {/* Sección: Información de Cuenta */}
            <section className="profile__section">
                <div className="profile__section-header">
                    <div className="profile__section-icon profile__section-icon--account">
                        <User size={18} weight="duotone" />
                    </div>
                    <div className="profile__section-title-group">
                        <h3 className="profile__section-title">
                            {t(
                                "profile.section.account",
                                "Información de Cuenta"
                            )}
                        </h3>
                        <p className="profile__section-subtitle">
                            {t(
                                "profile.section.account_desc",
                                "Tu información básica de usuario"
                            )}
                        </p>
                    </div>
                </div>

                <div className="profile__form-grid">
                    <div className="profile__form-grid--full">
                        <Input
                            label={t("profile.email", "Correo electrónico")}
                            value={userEmail}
                            disabled
                            leftIcon={<Envelope size={16} />}
                        />
                        <p className="profile__email-note">
                            {t(
                                "profile.email_readonly",
                                "El correo no puede ser modificado"
                            )}
                        </p>
                    </div>

                    <Input
                        label={t("profile.first_name", "Nombre")}
                        value={formData.firstName}
                        onChange={(e) =>
                            handleChange("firstName", e.target.value)
                        }
                        placeholder={t(
                            "profile.first_name_placeholder",
                            "Tu nombre"
                        )}
                    />

                    <Input
                        label={t("profile.last_name", "Apellido")}
                        value={formData.lastName}
                        onChange={(e) =>
                            handleChange("lastName", e.target.value)
                        }
                        placeholder={t(
                            "profile.last_name_placeholder",
                            "Tu apellido"
                        )}
                    />
                </div>
            </section>

            {/* Sección: Contacto */}
            <section className="profile__section">
                <div className="profile__section-header">
                    <div className="profile__section-icon profile__section-icon--contact">
                        <Phone size={18} weight="duotone" />
                    </div>
                    <div className="profile__section-title-group">
                        <h3 className="profile__section-title">
                            {t("profile.section.contact", "Contacto")}
                        </h3>
                        <p className="profile__section-subtitle">
                            {t(
                                "profile.section.contact_desc",
                                "Información de contacto y ubicación"
                            )}
                        </p>
                    </div>
                </div>

                <div className="profile__form-grid">
                    <Input
                        label={t("profile.phone", "Teléfono")}
                        value={formData.phoneNumber}
                        onChange={(e) =>
                            handleChange("phoneNumber", e.target.value)
                        }
                        placeholder={t(
                            "profile.phone_placeholder",
                            "+51 999 999 999"
                        )}
                        leftIcon={<Phone size={16} />}
                    />

                    <Input
                        label={t("profile.designation", "Cargo / Profesión")}
                        value={formData.designation}
                        onChange={(e) =>
                            handleChange("designation", e.target.value)
                        }
                        placeholder={t(
                            "profile.designation_placeholder",
                            "Ej: Ingeniero Civil"
                        )}
                        leftIcon={<Briefcase size={16} />}
                    />

                    <div className="profile__form-grid--full">
                        <Input
                            label={t("profile.address", "Dirección")}
                            value={formData.address}
                            onChange={(e) =>
                                handleChange("address", e.target.value)
                            }
                            placeholder={t(
                                "profile.address_placeholder",
                                "Tu dirección"
                            )}
                            leftIcon={<MapPin size={16} />}
                        />
                    </div>

                    <div className="profile__form-grid--full">
                        <Textarea
                            label={t("profile.description", "Acerca de ti")}
                            value={formData.description}
                            onChange={(e) =>
                                handleChange("description", e.target.value)
                            }
                            placeholder={t(
                                "profile.description_placeholder",
                                "Una breve descripción sobre ti..."
                            )}
                            rows={3}
                        />
                    </div>
                </div>
            </section>

            <div className="profile__form-actions">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                    {t("profile.save", "Guardar cambios")}
                </Button>
            </div>
        </form>
    );
};

export default PersonalTab;
