import React from "react";
import { useTranslation } from "react-i18next";
import type { Organizer } from "@/services/organizers.service";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizerAvatar } from "./OrganizerAvatar";
import { OrganizerStatusBadge } from "./OrganizerStatusBadge";
import { OrganizerActions, type OrganizerAction } from "./OrganizerActions";
import { Globe, EnvelopeSimple, Receipt } from "@phosphor-icons/react";

import "./OrganizerTable.css";

interface OrganizerTableProps {
    organizers: Organizer[];
    onOrganizerClick: (organizerId: string) => void;
    onAction: (action: OrganizerAction, organizer: Organizer) => void;
    isLoading?: boolean;
}

export const OrganizerTable: React.FC<OrganizerTableProps> = ({
    organizers,
    onOrganizerClick,
    onAction,
    isLoading = false,
}) => {
    const { t } = useTranslation();

    if (isLoading) {
        const skeletonRows = 5;
        return (
            <div className="organizer-table-container">
                <table className="organizer-table">
                    <thead>
                        <tr>
                            <th className="organizer-table__header">
                                <Skeleton width="60%" height={12} />
                            </th>
                            <th className="organizer-table__header">
                                <Skeleton width="50%" height={12} />
                            </th>
                            <th className="organizer-table__header">
                                <Skeleton width="40%" height={12} />
                            </th>
                            <th className="organizer-table__header">
                                <Skeleton width="50%" height={12} />
                            </th>
                            <th className="organizer-table__header organizer-table__header--actions" />
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: skeletonRows }).map((_, index) => (
                            <tr key={index} className="organizer-table__row">
                                <td className="organizer-table__cell">
                                    <div className="organizer-table__org-cell">
                                        <Skeleton
                                            width={40}
                                            height={40}
                                            style={{ borderRadius: "var(--radius-md)" }}
                                        />
                                        <div className="organizer-table__org-info">
                                            <Skeleton width={120 + Math.random() * 60} height={14} />
                                            <Skeleton width={100 + Math.random() * 40} height={12} />
                                        </div>
                                    </div>
                                </td>
                                <td className="organizer-table__cell">
                                    <Skeleton width={100} height={14} />
                                </td>
                                <td className="organizer-table__cell">
                                    <Skeleton width={50} height={14} />
                                </td>
                                <td className="organizer-table__cell">
                                    <Skeleton
                                        width={70}
                                        height={24}
                                        style={{ borderRadius: "var(--radius-full)" }}
                                    />
                                </td>
                                <td className="organizer-table__cell organizer-table__cell--actions">
                                    <Skeleton
                                        width={28}
                                        height={28}
                                        style={{
                                            borderRadius: "var(--radius-md)",
                                            marginLeft: "auto",
                                        }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="organizer-table-container">
            <table className="organizer-table">
                <thead>
                    <tr>
                        <th className="organizer-table__header">
                            {t("organizers.list.table.organizer", "Organizador")}
                        </th>
                        <th className="organizer-table__header organizer-table__header--contact">
                            {t("organizers.list.table.contact", "Contacto")}
                        </th>
                        <th className="organizer-table__header">
                            {t("organizers.list.table.currency", "Moneda")}
                        </th>
                        <th className="organizer-table__header">
                            {t("organizers.list.table.status", "Estado")}
                        </th>
                        <th className="organizer-table__header organizer-table__header--actions" />
                    </tr>
                </thead>

                <tbody>
                    {organizers.map((organizer) => (
                        <tr key={organizer.id} className="organizer-table__row">
                            <td className="organizer-table__cell">
                                <div className="organizer-table__org-cell">
                                    <OrganizerAvatar organizer={organizer} size="lg" />
                                    <div className="organizer-table__org-info">
                                        <button
                                            onClick={() => onOrganizerClick(organizer.id)}
                                            className="organizer-table__org-name"
                                        >
                                            {organizer.name}
                                        </button>
                                        {organizer.ruc && (
                                            <div className="organizer-table__org-ruc">
                                                RUC: {organizer.ruc}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            <td className="organizer-table__cell organizer-table__cell--contact">
                                <div className="organizer-table__contact">
                                    {organizer.email && (
                                        <div className="organizer-table__contact-item">
                                            <EnvelopeSimple size={14} />
                                            <span>{organizer.email}</span>
                                        </div>
                                    )}
                                    {organizer.website && (
                                        <div className="organizer-table__contact-item">
                                            <Globe size={14} />
                                            <a
                                                href={organizer.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="organizer-table__link"
                                            >
                                                {organizer.website.replace(/^https?:\/\//, "")}
                                            </a>
                                        </div>
                                    )}
                                    {!organizer.email && !organizer.website && (
                                        <span className="organizer-table__no-data">
                                            {t("common.not_specified", "No especificado")}
                                        </span>
                                    )}
                                </div>
                            </td>

                            <td className="organizer-table__cell">
                                <div className="organizer-table__currency">
                                    <span className="organizer-table__currency-code">
                                        {organizer.baseCurrency}
                                    </span>
                                    {organizer.emitsFiscalDocuments && (
                                        <span
                                            className="organizer-table__fiscal-badge"
                                            title={t(
                                                "organizers.emits_fiscal",
                                                "Emite comprobantes"
                                            )}
                                        >
                                            <Receipt size={14} />
                                        </span>
                                    )}
                                </div>
                            </td>

                            <td className="organizer-table__cell">
                                <OrganizerStatusBadge isActive={organizer.isActive} />
                            </td>

                            <td className="organizer-table__cell organizer-table__cell--actions">
                                <div className="organizer-table__actions">
                                    <OrganizerActions
                                        organizer={organizer}
                                        onAction={onAction}
                                        onView={() => onOrganizerClick(organizer.id)}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrganizerTable;
