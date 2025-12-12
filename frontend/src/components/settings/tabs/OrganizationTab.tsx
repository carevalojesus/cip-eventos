/**
 * OrganizationTab Component
 *
 * Tab de configuración de la organización.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Buildings,
    Globe,
    Info,
    SpinnerGap,
    PencilSimple,
    FloppyDisk,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    settingsService,
    type OrganizationConfig,
} from "@/services/settings.service";

// ============================================
// Editable Field Component
// ============================================

interface EditableFieldProps {
    label: string;
    value: string;
    name: string;
    onChange: (name: string, value: string) => void;
    isEditing: boolean;
    placeholder?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
    label,
    value,
    name,
    onChange,
    isEditing,
    placeholder,
}) => (
    <div className="settings__readonly-field">
        <span className="settings__readonly-label">{label}</span>
        {isEditing ? (
            <Input
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                placeholder={placeholder}
            />
        ) : (
            <div className="settings__readonly-value">{value || "-"}</div>
        )}
    </div>
);

// ============================================
// Organization Tab
// ============================================

interface OrganizationTabProps {
    data: OrganizationConfig;
}

export const OrganizationTab: React.FC<OrganizationTabProps> = ({ data }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<OrganizationConfig>(data);

    const updateMutation = useMutation({
        mutationFn: settingsService.updateOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            setIsEditing(false);
            toast.success(
                t("settings.update_success", "Configuración actualizada")
            );
        },
        onError: () => {
            toast.error(t("settings.update_error", "Error al actualizar"));
        },
    });

    const handleChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    const handleCancel = () => {
        setFormData(data);
        setIsEditing(false);
    };

    return (
        <div className="settings__form">
            {/* Info Alert */}
            <div className="settings__alert settings__alert--info">
                <Info
                    size={20}
                    weight="duotone"
                    className="settings__alert-icon"
                    style={{ color: "var(--color-cyan-600)" }}
                />
                <div className="settings__alert-content">
                    <p className="settings__alert-title">
                        {t(
                            "settings.org_info_title",
                            "Información de la Organización"
                        )}
                    </p>
                    <p className="settings__alert-text">
                        {t(
                            "settings.org_info_desc",
                            "Estos datos se muestran en certificados, facturas y documentos oficiales."
                        )}
                    </p>
                </div>
                {!isEditing && (
                    <Button
                        variant="soft"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    >
                        <PencilSimple size={16} weight="bold" />
                        {t("common.edit", "Editar")}
                    </Button>
                )}
            </div>

            {/* Section: Datos Generales */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--org">
                        <Buildings size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.general_data", "Datos Generales")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t(
                                "settings.general_data_desc",
                                "Información básica de la organización"
                            )}
                        </p>
                    </div>
                </div>

                <div className="settings__form-grid">
                    <EditableField
                        label={t("settings.org_name", "Razón Social")}
                        value={formData.name}
                        name="name"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <EditableField
                        label={t("settings.org_short_name", "Nombre Corto")}
                        value={formData.shortName}
                        name="shortName"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <EditableField
                        label={t("settings.ruc", "RUC")}
                        value={formData.ruc}
                        name="ruc"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <EditableField
                        label={t("settings.phone", "Teléfono")}
                        value={formData.phone}
                        name="phone"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <div className="settings__form-grid--full">
                        <EditableField
                            label={t("settings.address", "Dirección Fiscal")}
                            value={formData.address}
                            name="address"
                            onChange={handleChange}
                            isEditing={isEditing}
                        />
                    </div>
                </div>
            </section>

            {/* Section: Contacto */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--contact">
                        <Globe size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t("settings.contact", "Contacto Web")}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t(
                                "settings.contact_desc",
                                "Presencia digital de la organización"
                            )}
                        </p>
                    </div>
                </div>

                <div className="settings__form-grid">
                    <EditableField
                        label={t("settings.email", "Correo Institucional")}
                        value={formData.email}
                        name="email"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                    <EditableField
                        label={t("settings.website", "Sitio Web")}
                        value={formData.website}
                        name="website"
                        onChange={handleChange}
                        isEditing={isEditing}
                    />
                </div>
            </section>

            {/* Edit Actions */}
            {isEditing && (
                <div className="settings__form-actions">
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                    >
                        {t("common.cancel", "Cancelar")}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? (
                            <SpinnerGap size={16} className="animate-spin" />
                        ) : (
                            <FloppyDisk size={16} />
                        )}
                        {t("form.save_changes", "Guardar Cambios")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OrganizationTab;
