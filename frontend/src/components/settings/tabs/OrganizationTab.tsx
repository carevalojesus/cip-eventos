/**
 * OrganizationTab Component
 *
 * Tab de configuración de la organización.
 * Usa componentes RUI: Alert, Section, DataField.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Buildings,
    Globe,
    PencilSimple,
    FloppyDisk,
} from "@phosphor-icons/react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Section } from "@/components/ui/section";
import { DataField, DataFieldGroup } from "@/components/ui/data-field";

// Services
import {
    settingsService,
    type OrganizationConfig,
} from "@/services/settings.service";

// ============================================
// Types
// ============================================

interface OrganizationTabProps {
    data: OrganizationConfig;
}

// ============================================
// Organization Tab Component
// ============================================

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
            <Alert
                variant="info"
                title={t(
                    "settings.org_info_title",
                    "Información de la Organización"
                )}
                action={
                    !isEditing && (
                        <Button
                            variant="soft"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            <PencilSimple size={16} weight="bold" />
                            {t("common.edit", "Editar")}
                        </Button>
                    )
                }
            >
                {t(
                    "settings.org_info_desc",
                    "Estos datos se muestran en certificados, facturas y documentos oficiales."
                )}
            </Alert>

            {/* Section: Datos Generales */}
            <Section>
                <Section.Header
                    icon={<Buildings size={18} weight="duotone" />}
                    iconVariant="primary"
                    title={t("settings.general_data", "Datos Generales")}
                    subtitle={t(
                        "settings.general_data_desc",
                        "Información básica de la organización"
                    )}
                />
                <Section.Content>
                    {isEditing ? (
                        <div className="settings__form-grid">
                            <div className="settings__form-grid--full">
                                <Input
                                    label={t("settings.org_name", "Razón Social")}
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                            </div>
                            <Input
                                label={t("settings.org_short_name", "Nombre Corto")}
                                value={formData.shortName}
                                onChange={(e) => handleChange("shortName", e.target.value)}
                            />
                            <Input
                                label={t("settings.ruc", "RUC")}
                                value={formData.ruc}
                                onChange={(e) => handleChange("ruc", e.target.value)}
                            />
                            <Input
                                label={t("settings.phone", "Teléfono")}
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                            />
                            <Input
                                label={t("settings.address", "Dirección Fiscal")}
                                value={formData.address}
                                onChange={(e) => handleChange("address", e.target.value)}
                            />
                        </div>
                    ) : (
                        <DataFieldGroup columns={2}>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <DataField
                                    label={t("settings.org_name", "Razón Social")}
                                    value={formData.name}
                                />
                            </div>
                            <DataField
                                label={t("settings.org_short_name", "Nombre Corto")}
                                value={formData.shortName}
                            />
                            <DataField
                                label={t("settings.ruc", "RUC")}
                                value={formData.ruc}
                                copyable
                                type="mono"
                            />
                            <DataField
                                label={t("settings.phone", "Teléfono")}
                                value={formData.phone}
                                copyable
                            />
                            <DataField
                                label={t("settings.address", "Dirección Fiscal")}
                                value={formData.address}
                            />
                        </DataFieldGroup>
                    )}
                </Section.Content>
            </Section>

            {/* Section: Contacto Web */}
            <Section>
                <Section.Header
                    icon={<Globe size={18} weight="duotone" />}
                    iconVariant="info"
                    title={t("settings.contact", "Contacto Web")}
                    subtitle={t(
                        "settings.contact_desc",
                        "Presencia digital de la organización"
                    )}
                />
                <Section.Content>
                    {isEditing ? (
                        <div className="settings__form-grid">
                            <Input
                                label={t("settings.email", "Correo Institucional")}
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                type="email"
                            />
                            <Input
                                label={t("settings.website", "Sitio Web")}
                                value={formData.website}
                                onChange={(e) => handleChange("website", e.target.value)}
                            />
                        </div>
                    ) : (
                        <DataFieldGroup columns={2}>
                            <DataField
                                label={t("settings.email", "Correo Institucional")}
                                value={formData.email}
                                copyable
                            />
                            <DataField
                                label={t("settings.website", "Sitio Web")}
                                value={formData.website}
                                copyable
                            />
                        </DataFieldGroup>
                    )}
                </Section.Content>
            </Section>

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
                        isLoading={updateMutation.isPending}
                    >
                        <FloppyDisk size={16} />
                        {t("form.save_changes", "Guardar Cambios")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OrganizationTab;
