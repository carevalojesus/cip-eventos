import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "@phosphor-icons/react";
import { PageHeader } from "@/components/ui/rui";
import { Button } from "@/components/ui/button";

interface OrganizerPageHeaderProps {
    onCreateOrganizer: () => void;
    showCreateButton?: boolean;
}

export const OrganizerPageHeader: React.FC<OrganizerPageHeaderProps> = ({
    onCreateOrganizer,
    showCreateButton = true,
}) => {
    const { t } = useTranslation();

    return (
        <PageHeader
            title={t("organizers.list.title", "Gestión de Organizadores")}
            subtitle={t(
                "organizers.list.subtitle",
                "Administra las entidades que organizan eventos en la plataforma."
            )}
            action={
                showCreateButton ? (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={onCreateOrganizer}
                    >
                        <Plus size={18} weight="bold" />
                        {t("organizers.list.new", "Nuevo Organizador")}
                    </Button>
                ) : undefined
            }
        />
    );
};

export default OrganizerPageHeader;
