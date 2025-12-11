import React from "react";
import { useTranslation } from "react-i18next";
import {
    DotsThree,
    Eye,
    PencilSimple,
    Trash,
    Power,
} from "@phosphor-icons/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Organizer } from "@/services/organizers.service";

import "./OrganizerActions.css";

export type OrganizerAction = "view" | "edit" | "delete" | "activate";

interface OrganizerActionsProps {
    organizer: Organizer;
    onAction: (action: OrganizerAction, organizer: Organizer) => void;
    onView?: () => void;
}

export const OrganizerActions: React.FC<OrganizerActionsProps> = ({
    organizer,
    onAction,
    onView,
}) => {
    const { t } = useTranslation();

    const handleAction = (action: OrganizerAction) => {
        if (action === "view" && onView) {
            onView();
        } else {
            onAction(action, organizer);
        }
    };

    const getItemClass = (variant?: "danger" | "success") => {
        let className = "organizer-actions__item rui-dropdown-item";
        if (variant === "danger") className += " organizer-actions__item--danger";
        if (variant === "success") className += " organizer-actions__item--success";
        return className;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="organizer-actions__trigger"
                    aria-label={t("organizers.list.actions.menu", "Menú de acciones")}
                >
                    <DotsThree size={18} weight="bold" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="organizer-actions__content rui-dropdown"
            >
                {!organizer.isActive ? (
                    <DropdownMenuItem
                        className={getItemClass("success")}
                        onClick={() => handleAction("activate")}
                    >
                        <Power size={16} />
                        {t("organizers.list.actions.activate", "Activar organizador")}
                    </DropdownMenuItem>
                ) : (
                    <>
                        {onView && (
                            <DropdownMenuItem
                                className={getItemClass()}
                                onClick={() => handleAction("view")}
                            >
                                <Eye size={16} />
                                {t("organizers.list.actions.view", "Ver detalles")}
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                            className={getItemClass()}
                            onClick={() => handleAction("edit")}
                        >
                            <PencilSimple size={16} />
                            {t("organizers.list.actions.edit", "Editar")}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="organizer-actions__separator rui-dropdown-separator" />

                        <DropdownMenuItem
                            className={getItemClass("danger")}
                            onClick={() => handleAction("delete")}
                        >
                            <Trash size={16} />
                            {t("organizers.list.actions.delete", "Eliminar")}
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default OrganizerActions;
