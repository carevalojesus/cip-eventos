/**
 * IntegrationCard Component
 *
 * Tarjeta para mostrar el estado de una integración.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, Warning, Gear } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { IntegrationStatus } from "@/services/settings.service";

export interface IntegrationCardData extends IntegrationStatus {
    icon: React.ReactNode;
}

interface IntegrationCardProps {
    integration: IntegrationCardData;
    onConfigure: (key: string) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
    integration,
    onConfigure,
}) => {
    const { t } = useTranslation();

    return (
        <div
            className={`settings__integration-card ${
                integration.enabled ? "settings__integration-card--enabled" : ""
            }`}
        >
            <div className="settings__integration-header">
                <div className="settings__integration-icon">{integration.icon}</div>
                <div className="settings__integration-info">
                    <h4 className="settings__integration-name">{integration.name}</h4>
                    <p className="settings__integration-desc">
                        {integration.description}
                    </p>
                </div>
                <div className="settings__integration-actions">
                    {integration.enabled ? (
                        <span className="settings__status-badge settings__status-badge--success">
                            <CheckCircle size={14} weight="fill" />
                            {t("settings.enabled", "Habilitado")}
                        </span>
                    ) : (
                        <span className="settings__status-badge settings__status-badge--disabled">
                            <XCircle size={14} weight="fill" />
                            {t("settings.disabled", "Deshabilitado")}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfigure(integration.key)}
                    >
                        <Gear size={16} />
                        {t("settings.configure", "Configurar")}
                    </Button>
                </div>
            </div>
            {integration.enabled && !integration.configured && (
                <div className="settings__integration-warning">
                    <Warning size={16} />
                    <span>
                        {t("settings.needs_configuration", "Requiere configuración")}
                    </span>
                </div>
            )}
        </div>
    );
};

export default IntegrationCard;
