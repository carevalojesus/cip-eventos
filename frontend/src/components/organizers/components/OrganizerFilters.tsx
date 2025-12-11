import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, X } from "@phosphor-icons/react";
import { SearchInput, Select } from "@/components/ui/rui";

import "./OrganizerFilters.css";

interface OrganizerFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedStatus: string;
    onStatusChange: (status: string) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export const OrganizerFilters: React.FC<OrganizerFiltersProps> = ({
    searchQuery,
    onSearchChange,
    selectedStatus,
    onStatusChange,
    hasActiveFilters,
    onClearFilters,
}) => {
    const { t } = useTranslation();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const advancedFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedStatus !== "all") count++;
        return count;
    }, [selectedStatus]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsPopoverOpen(false);
            }
        };

        if (isPopoverOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isPopoverOpen]);

    const statusOptions = useMemo(
        () => [
            {
                value: "all",
                label: t("organizers.list.filter.all_status", "Todos los estados"),
            },
            { value: "active", label: t("organizers.status.active", "Activo") },
            { value: "inactive", label: t("organizers.status.inactive", "Inactivo") },
        ],
        [t]
    );

    const isFilterButtonActive = isPopoverOpen || advancedFiltersCount > 0;
    const filterButtonClass = `organizer-filters__button ${isFilterButtonActive ? "organizer-filters__button--active" : ""}`;

    return (
        <div className="organizer-filters">
            <SearchInput
                value={searchQuery}
                onChange={onSearchChange}
                placeholder={t(
                    "organizers.list.search_placeholder",
                    "Buscar por nombre, RUC o email..."
                )}
                maxWidth="380px"
                ariaLabel={t("organizers.list.search_aria", "Buscar organizadores")}
            />

            <div className="organizer-filters__group">
                <div className="organizer-filters__popover-container">
                    <button
                        ref={buttonRef}
                        type="button"
                        className={filterButtonClass}
                        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                    >
                        <SlidersHorizontal
                            size={16}
                            weight={advancedFiltersCount > 0 ? "fill" : "regular"}
                        />
                        {t("organizers.list.filter.advanced", "Filtros")}
                        {advancedFiltersCount > 0 && (
                            <span className="organizer-filters__badge">
                                {advancedFiltersCount}
                            </span>
                        )}
                    </button>

                    {isPopoverOpen && (
                        <div ref={popoverRef} className="organizer-filters__popover">
                            <div className="organizer-filters__popover-header">
                                <span className="organizer-filters__popover-title">
                                    {t(
                                        "organizers.list.filter.advanced_title",
                                        "Filtros Avanzados"
                                    )}
                                </span>
                                <button
                                    type="button"
                                    className="organizer-filters__close-button"
                                    onClick={() => setIsPopoverOpen(false)}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="organizer-filters__filter-group">
                                <label className="organizer-filters__filter-label">
                                    {t("organizers.list.filter.status_label", "Estado")}
                                </label>
                                <div className="organizer-filters__select-container">
                                    <Select
                                        value={selectedStatus}
                                        onChange={onStatusChange}
                                        options={statusOptions}
                                        placeholder={t(
                                            "organizers.list.filter.all_status",
                                            "Todos los estados"
                                        )}
                                        fullWidth
                                    />
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    className="organizer-filters__clear"
                                    onClick={() => {
                                        onClearFilters();
                                        setIsPopoverOpen(false);
                                    }}
                                >
                                    {t("organizers.list.filter.clear", "Limpiar filtros")}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerFilters;
