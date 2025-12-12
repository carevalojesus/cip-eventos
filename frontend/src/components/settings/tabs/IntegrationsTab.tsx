/**
 * IntegrationsTab Component
 *
 * Tab de configuración de integraciones.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Plugs,
    IdentificationCard,
    CreditCard,
    Database,
    Receipt,
    PaperPlaneTilt,
} from "@phosphor-icons/react";
import type { IntegrationStatus } from "@/services/settings.service";
import {
    IntegrationCard,
    IntegrationCardData,
    IntegrationEditModal,
} from "../components";

// ============================================
// Types
// ============================================

interface IntegrationsTabProps {
    data: IntegrationStatus[];
}

// ============================================
// Icon Map
// ============================================

const iconMap: Record<string, React.ReactNode> = {
    reniec: <IdentificationCard size={24} weight="duotone" />,
    paypal: <CreditCard size={24} weight="duotone" />,
    cip: <Database size={24} weight="duotone" />,
    sunat: <Receipt size={24} weight="duotone" />,
    twilio: <PaperPlaneTilt size={24} weight="duotone" />,
};

// ============================================
// Component
// ============================================

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ data }) => {
    const { t } = useTranslation();
    const [selectedIntegration, setSelectedIntegration] = useState<{
        key: string;
        name: string;
    } | null>(null);

    const integrationsWithIcons: IntegrationCardData[] = data.map((int) => ({
        ...int,
        icon: iconMap[int.key] || <Plugs size={24} weight="duotone" />,
    }));

    const handleConfigure = (key: string) => {
        const integration = data.find((int) => int.key === key);
        if (integration) {
            setSelectedIntegration({ key, name: integration.name });
        }
    };

    return (
        <div className="settings__form">
            {/* Info Alert */}
            <div className="settings__alert settings__alert--info">
                <Plugs
                    size={20}
                    weight="duotone"
                    className="settings__alert-icon"
                    style={{ color: "var(--color-cyan-600)" }}
                />
                <div className="settings__alert-content">
                    <p className="settings__alert-title">
                        {t(
                            "settings.integrations_title",
                            "Integraciones del Sistema"
                        )}
                    </p>
                    <p className="settings__alert-text">
                        {t(
                            "settings.integrations_desc_admin",
                            "Configura las credenciales y parámetros de conexión de los servicios externos."
                        )}
                    </p>
                </div>
            </div>

            {/* Integrations List */}
            <section className="settings__section">
                <div className="settings__section-header">
                    <div className="settings__section-icon settings__section-icon--integrations">
                        <Plugs size={18} weight="duotone" />
                    </div>
                    <div className="settings__section-title-group">
                        <h3 className="settings__section-title">
                            {t(
                                "settings.active_integrations",
                                "Integraciones Activas"
                            )}
                        </h3>
                        <p className="settings__section-subtitle">
                            {t(
                                "settings.active_integrations_desc",
                                "Estado de los servicios externos"
                            )}
                        </p>
                    </div>
                </div>

                <div className="settings__integrations-grid">
                    {integrationsWithIcons.map((integration) => (
                        <IntegrationCard
                            key={integration.key}
                            integration={integration}
                            onConfigure={handleConfigure}
                        />
                    ))}
                </div>
            </section>

            {/* Edit Modal */}
            {selectedIntegration && (
                <IntegrationEditModal
                    integrationKey={selectedIntegration.key}
                    integrationName={selectedIntegration.name}
                    isOpen={!!selectedIntegration}
                    onClose={() => setSelectedIntegration(null)}
                />
            )}
        </div>
    );
};

export default IntegrationsTab;
