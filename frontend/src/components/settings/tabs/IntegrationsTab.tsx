/**
 * IntegrationsTab Component
 *
 * Tab de configuración de integraciones.
 * Usa componentes RUI: Alert, Section.
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

// UI Components
import { Alert } from "@/components/ui/alert";
import { Section } from "@/components/ui/section";

// Services & Types
import type { IntegrationStatus } from "@/services/settings.service";

// Components
import {
    IntegrationCard,
    IntegrationEditModal,
} from "../components";
import type { IntegrationCardData } from "../components";

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
// Integrations Tab Component
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
            <Alert
                variant="info"
                title={t(
                    "settings.integrations_title",
                    "Integraciones del Sistema"
                )}
            >
                {t(
                    "settings.integrations_desc_admin",
                    "Configura las credenciales y parámetros de conexión de los servicios externos."
                )}
            </Alert>

            {/* Integrations List */}
            <Section>
                <Section.Header
                    icon={<Plugs size={18} weight="duotone" />}
                    iconVariant="info"
                    title={t(
                        "settings.active_integrations",
                        "Integraciones Activas"
                    )}
                    subtitle={t(
                        "settings.active_integrations_desc",
                        "Estado de los servicios externos"
                    )}
                />
                <Section.Content>
                    <div className="settings__integrations-grid">
                        {integrationsWithIcons.map((integration) => (
                            <IntegrationCard
                                key={integration.key}
                                integration={integration}
                                onConfigure={handleConfigure}
                            />
                        ))}
                    </div>
                </Section.Content>
            </Section>

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
