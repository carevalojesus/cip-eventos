import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface OrganizerEmptyStateProps {
    hasFilters: boolean;
    onCreateOrganizer: () => void;
}

export const OrganizerEmptyState: React.FC<OrganizerEmptyStateProps> = ({
    hasFilters,
    onCreateOrganizer,
}) => {
    const { t } = useTranslation();

    return (
        <EmptyState
            illustration={hasFilters ? "no-results" : "no-users"}
            title={
                hasFilters
                    ? t(
                          "organizers.list.empty.no_results",
                          "No se encontraron organizadores"
                      )
                    : t("organizers.list.empty.title", "No hay organizadores")
            }
            description={
                hasFilters
                    ? t(
                          "organizers.list.empty.try_different",
                          "Intenta con otros filtros de búsqueda."
                      )
                    : t(
                          "organizers.list.empty.description",
                          "Crea tu primer organizador para comenzar."
                      )
            }
            size="md"
            action={
                !hasFilters ? (
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

export default OrganizerEmptyState;
