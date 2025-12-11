import { useTranslation } from "react-i18next";
import { FileText, ShieldCheck } from "@phosphor-icons/react";
import { Textarea } from "@/components/ui/textarea";

import "./OrganizerTabs.css";

interface OrganizerLegalTabProps {
    formData: {
        termsText: string;
        privacyText: string;
    };
    isEditing: boolean;
    onFormChange: (field: string, value: string) => void;
}

export function OrganizerLegalTab({
    formData,
    isEditing,
    onFormChange,
}: OrganizerLegalTabProps) {
    const { t } = useTranslation();

    return (
        <div className="organizer-tab">
            {/* Sección: Términos y Condiciones */}
            <section className="organizer-tab__section">
                <div className="organizer-tab__section-header">
                    <div className="organizer-tab__section-icon organizer-tab__section-icon--terms">
                        <FileText size={18} weight="duotone" />
                    </div>
                    <div className="organizer-tab__section-title-group">
                        <h3 className="organizer-tab__section-title">
                            {t(
                                "organizers.detail.section.terms",
                                "Términos y Condiciones"
                            )}
                        </h3>
                        <p className="organizer-tab__section-subtitle">
                            {t(
                                "organizers.detail.section.terms_desc",
                                "Condiciones de uso para inscripciones y servicios"
                            )}
                        </p>
                    </div>
                </div>

                <div className="organizer-tab__form-grid">
                    <div className="organizer-tab__form-grid--full">
                        <Textarea
                            value={formData.termsText}
                            onChange={(e) => onFormChange("termsText", e.target.value)}
                            placeholder={t(
                                "organizers.placeholder.terms",
                                "Ingrese los términos y condiciones del organizador..."
                            )}
                            disabled={!isEditing}
                            rows={10}
                        />
                    </div>
                </div>
            </section>

            {/* Sección: Política de Privacidad */}
            <section className="organizer-tab__section">
                <div className="organizer-tab__section-header">
                    <div className="organizer-tab__section-icon organizer-tab__section-icon--privacy">
                        <ShieldCheck size={18} weight="duotone" />
                    </div>
                    <div className="organizer-tab__section-title-group">
                        <h3 className="organizer-tab__section-title">
                            {t(
                                "organizers.detail.section.privacy",
                                "Política de Privacidad"
                            )}
                        </h3>
                        <p className="organizer-tab__section-subtitle">
                            {t(
                                "organizers.detail.section.privacy_desc",
                                "Información sobre el tratamiento de datos personales"
                            )}
                        </p>
                    </div>
                </div>

                <div className="organizer-tab__form-grid">
                    <div className="organizer-tab__form-grid--full">
                        <Textarea
                            value={formData.privacyText}
                            onChange={(e) => onFormChange("privacyText", e.target.value)}
                            placeholder={t(
                                "organizers.placeholder.privacy",
                                "Ingrese la política de privacidad del organizador..."
                            )}
                            disabled={!isEditing}
                            rows={10}
                        />
                    </div>
                </div>
            </section>

            {/* Nota informativa */}
            <div className="organizer-tab__info-note">
                <ShieldCheck size={16} />
                <span>
                    {t(
                        "organizers.detail.legal_note",
                        "Estos textos se mostrarán a los participantes durante el proceso de inscripción a los eventos."
                    )}
                </span>
            </div>
        </div>
    );
}

export default OrganizerLegalTab;
