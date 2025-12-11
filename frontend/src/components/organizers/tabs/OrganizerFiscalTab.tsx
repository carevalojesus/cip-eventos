import { useTranslation } from "react-i18next";
import {
    IdentificationCard,
    MapPin,
    CurrencyCircleDollar,
    Receipt,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormSelect } from "@/components/ui/form/index";

import "./OrganizerTabs.css";

interface OrganizerFiscalTabProps {
    formData: {
        ruc: string;
        businessName: string;
        fiscalAddress: string;
        baseCurrency: string;
        emitsFiscalDocuments: boolean;
    };
    isEditing: boolean;
    onFormChange: (field: string, value: string | boolean) => void;
    errors?: Record<string, string>;
}

const currencyOptions = [
    { value: "PEN", label: "PEN - Sol Peruano" },
    { value: "USD", label: "USD - Dólar Americano" },
    { value: "EUR", label: "EUR - Euro" },
];

export function OrganizerFiscalTab({
    formData,
    isEditing,
    onFormChange,
    errors = {},
}: OrganizerFiscalTabProps) {
    const { t } = useTranslation();

    return (
        <div className="organizer-tab">
            {/* Sección: Datos Tributarios */}
            <section className="organizer-tab__section">
                <div className="organizer-tab__section-header">
                    <div className="organizer-tab__section-icon organizer-tab__section-icon--fiscal">
                        <IdentificationCard size={18} weight="duotone" />
                    </div>
                    <div className="organizer-tab__section-title-group">
                        <h3 className="organizer-tab__section-title">
                            {t("organizers.detail.section.tax_info", "Datos Tributarios")}
                        </h3>
                        <p className="organizer-tab__section-subtitle">
                            {t(
                                "organizers.detail.section.tax_info_desc",
                                "Información para facturación"
                            )}
                        </p>
                    </div>
                </div>

                <div className="organizer-tab__form-grid">
                    <Input
                        label={t("organizers.field.ruc", "RUC")}
                        value={formData.ruc}
                        onChange={(e) => onFormChange("ruc", e.target.value)}
                        placeholder={t("organizers.placeholder.ruc", "20123456789")}
                        leftIcon={<IdentificationCard size={16} />}
                        disabled={!isEditing}
                        maxLength={11}
                        error={errors.ruc}
                    />
                    <Input
                        label={t("organizers.field.business_name", "Razón Social")}
                        value={formData.businessName}
                        onChange={(e) => onFormChange("businessName", e.target.value)}
                        placeholder={t(
                            "organizers.placeholder.business_name",
                            "EMPRESA S.A.C."
                        )}
                        disabled={!isEditing}
                        error={errors.businessName}
                    />
                    <div className="organizer-tab__form-grid--full">
                        <Input
                            label={t("organizers.field.fiscal_address", "Dirección Fiscal")}
                            value={formData.fiscalAddress}
                            onChange={(e) => onFormChange("fiscalAddress", e.target.value)}
                            placeholder={t(
                                "organizers.placeholder.fiscal_address",
                                "Av. Principal 123, Lima"
                            )}
                            leftIcon={<MapPin size={16} />}
                            disabled={!isEditing}
                            error={errors.fiscalAddress}
                        />
                    </div>
                </div>
            </section>

            {/* Sección: Configuración */}
            <section className="organizer-tab__section">
                <div className="organizer-tab__section-header">
                    <div className="organizer-tab__section-icon organizer-tab__section-icon--config">
                        <CurrencyCircleDollar size={18} weight="duotone" />
                    </div>
                    <div className="organizer-tab__section-title-group">
                        <h3 className="organizer-tab__section-title">
                            {t("organizers.detail.section.config", "Configuración")}
                        </h3>
                        <p className="organizer-tab__section-subtitle">
                            {t(
                                "organizers.detail.section.config_desc",
                                "Moneda y opciones de facturación"
                            )}
                        </p>
                    </div>
                </div>

                <div className="organizer-tab__form-grid">
                    <FormSelect
                        label={t("organizers.field.currency", "Moneda Base")}
                        value={formData.baseCurrency}
                        onChange={(value) => onFormChange("baseCurrency", value)}
                        options={currencyOptions}
                        disabled={!isEditing}
                        error={errors.baseCurrency}
                    />

                    <div className="organizer-tab__switch-row">
                        <div className="organizer-tab__switch-label">
                            <span className="organizer-tab__switch-title">
                                <Receipt size={16} />
                                {t(
                                    "organizers.field.emits_fiscal",
                                    "Emite comprobantes fiscales"
                                )}
                            </span>
                            <span className="organizer-tab__switch-desc">
                                {t(
                                    "organizers.field.emits_fiscal_desc",
                                    "Boletas y facturas electrónicas"
                                )}
                            </span>
                        </div>
                        <Switch
                            checked={formData.emitsFiscalDocuments}
                            onCheckedChange={(checked) =>
                                onFormChange("emitsFiscalDocuments", checked)
                            }
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </section>

            {/* Nota informativa */}
            <div className="organizer-tab__info-note">
                <CurrencyCircleDollar size={16} />
                <span>
                    {t(
                        "organizers.detail.fiscal_note",
                        "Los datos fiscales se utilizarán para la generación de comprobantes de pago de los eventos."
                    )}
                </span>
            </div>
        </div>
    );
}

export default OrganizerFiscalTab;
