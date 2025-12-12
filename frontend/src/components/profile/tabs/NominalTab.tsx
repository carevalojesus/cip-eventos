/**
 * NominalTab Component
 *
 * Tab de datos nominales del perfil (para certificados oficiales).
 * Incluye validación con RENIEC.
 */
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    IdentificationCard,
    CheckCircle,
    Warning,
    SpinnerGap,
    Info,
    PencilSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form/index";
import type {
    Person,
    CreatePersonDto,
    UpdatePersonDto,
} from "@/services/profile.service";
import { DocumentType } from "@/services/profile.service";

// ============================================
// ReadOnly Field Component
// ============================================

interface ReadOnlyFieldProps {
    label: string;
    value: string;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value }) => (
    <div className="profile__readonly-field">
        <span className="profile__readonly-label">{label}</span>
        <div className="profile__readonly-value">{value}</div>
    </div>
);

// ============================================
// NominalTab Props
// ============================================

interface NominalTabProps {
    person: Person | null;
    hasData: boolean;
    isLoading: boolean;
    onSave: (data: CreatePersonDto) => void;
    onUpdate: (data: UpdatePersonDto) => void;
    isSaving: boolean;
    userEmail: string;
    onRevalidate: () => void;
    isRevalidating: boolean;
}

// ============================================
// NominalTab Component
// ============================================

export const NominalTab: React.FC<NominalTabProps> = ({
    person,
    hasData,
    isLoading,
    onSave,
    onUpdate,
    isSaving,
    userEmail,
    onRevalidate,
    isRevalidating,
}) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState<CreatePersonDto>({
        firstName: "",
        lastName: "",
        documentType: DocumentType.DNI,
        documentNumber: "",
        email: userEmail,
        phone: "",
        country: "Perú",
        birthDate: "",
    });

    const [editData, setEditData] = useState<UpdatePersonDto>({});

    // Inicializar editData cuando hay person
    useEffect(() => {
        if (person) {
            const birthDateForInput = person.birthDate
                ? person.birthDate.split("T")[0]
                : "";
            setEditData({
                firstName: person.firstName,
                lastName: person.lastName,
                documentType: person.documentType,
                documentNumber: person.documentNumber,
                country: person.country || "Perú",
                birthDate: birthDateForInput,
            });
        }
    }, [person]);

    const handleChange = (field: keyof CreatePersonDto, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleEditChange = (field: keyof UpdatePersonDto, value: string) => {
        setEditData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(editData);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        if (person) {
            const birthDateForInput = person.birthDate
                ? person.birthDate.split("T")[0]
                : "";
            setEditData({
                firstName: person.firstName,
                lastName: person.lastName,
                documentType: person.documentType,
                documentNumber: person.documentNumber,
                country: person.country || "Perú",
                birthDate: birthDateForInput,
            });
        }
        setIsEditing(false);
    };

    const documentTypeOptions = [
        { value: DocumentType.DNI, label: "DNI" },
        {
            value: DocumentType.CE,
            label: t("profile.doc_ce", "Carné de Extranjería"),
        },
        {
            value: DocumentType.PASSPORT,
            label: t("profile.doc_passport", "Pasaporte"),
        },
        { value: DocumentType.OTHER, label: t("profile.doc_other", "Otro") },
    ];

    if (isLoading) {
        return (
            <div className="profile__loading">
                <SpinnerGap size={32} className="profile__spinner" />
            </div>
        );
    }

    // Si ya tiene Person, mostrar en modo lectura o edición
    if (hasData && person) {
        const isValidated =
            person.reniecValidationScore !== null &&
            person.reniecValidationScore >= 80;

        // Modo edición
        if (isEditing) {
            return (
                <form onSubmit={handleUpdateSubmit} className="profile__form">
                    <div className="profile__alert profile__alert--info">
                        <PencilSimple
                            size={20}
                            weight="duotone"
                            className="profile__alert-icon"
                            style={{ color: "var(--color-cyan-600)" }}
                        />
                        <div className="profile__alert-content">
                            <p className="profile__alert-title">
                                {t(
                                    "profile.editing_nominal",
                                    "Editando datos nominales"
                                )}
                            </p>
                            <p className="profile__alert-text">
                                {t(
                                    "profile.editing_nominal_notice",
                                    "Al guardar, se revalidará automáticamente con RENIEC si es DNI."
                                )}
                            </p>
                        </div>
                    </div>

                    <section className="profile__section">
                        <div className="profile__section-header">
                            <div className="profile__section-icon profile__section-icon--nominal">
                                <IdentificationCard
                                    size={18}
                                    weight="duotone"
                                />
                            </div>
                            <div className="profile__section-title-group">
                                <h3 className="profile__section-title">
                                    {t(
                                        "profile.section.nominal",
                                        "Datos Nominales"
                                    )}
                                </h3>
                                <p className="profile__section-subtitle">
                                    {t(
                                        "profile.section.nominal_desc",
                                        "Información oficial para certificados"
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="profile__form-grid">
                            <Input
                                label={t("profile.first_name", "Nombre")}
                                value={editData.firstName || ""}
                                onChange={(e) =>
                                    handleEditChange(
                                        "firstName",
                                        e.target.value
                                    )
                                }
                                placeholder={t(
                                    "profile.legal_name_placeholder",
                                    "Como aparece en tu documento"
                                )}
                                required
                            />
                            <Input
                                label={t("profile.last_name", "Apellido")}
                                value={editData.lastName || ""}
                                onChange={(e) =>
                                    handleEditChange("lastName", e.target.value)
                                }
                                placeholder={t(
                                    "profile.legal_lastname_placeholder",
                                    "Como aparece en tu documento"
                                )}
                                required
                            />
                            <FormSelect
                                label={t(
                                    "profile.document_type",
                                    "Tipo de documento"
                                )}
                                value={editData.documentType || DocumentType.DNI}
                                onChange={(value) =>
                                    handleEditChange("documentType", value)
                                }
                                options={documentTypeOptions}
                                required
                            />
                            <Input
                                label={t(
                                    "profile.document_number",
                                    "Número de documento"
                                )}
                                value={editData.documentNumber || ""}
                                onChange={(e) =>
                                    handleEditChange(
                                        "documentNumber",
                                        e.target.value
                                    )
                                }
                                placeholder={t(
                                    "profile.document_number_placeholder",
                                    "12345678"
                                )}
                                required
                            />
                            <Input
                                label={t("profile.country", "País")}
                                value={editData.country || ""}
                                onChange={(e) =>
                                    handleEditChange("country", e.target.value)
                                }
                                placeholder="Perú"
                            />
                            <Input
                                label={t(
                                    "profile.birth_date",
                                    "Fecha de nacimiento"
                                )}
                                type="date"
                                value={editData.birthDate || ""}
                                onChange={(e) =>
                                    handleEditChange("birthDate", e.target.value)
                                }
                            />
                        </div>
                    </section>

                    <div
                        className="profile__form-actions"
                        style={{
                            display: "flex",
                            gap: "var(--space-3)",
                            justifyContent: "flex-end",
                        }}
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancelEdit}
                        >
                            {t("common.cancel", "Cancelar")}
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSaving}
                        >
                            {t(
                                "profile.save_and_revalidate",
                                "Guardar y revalidar"
                            )}
                        </Button>
                    </div>
                </form>
            );
        }

        // Modo lectura
        return (
            <div className="profile__form">
                {/* Badge de validación */}
                <div
                    className={`profile__alert ${
                        isValidated
                            ? "profile__alert--success"
                            : "profile__alert--warning"
                    }`}
                >
                    {isValidated ? (
                        <CheckCircle
                            size={20}
                            weight="fill"
                            className="profile__alert-icon"
                            style={{ color: "var(--color-green-600)" }}
                        />
                    ) : (
                        <Warning
                            size={20}
                            weight="fill"
                            className="profile__alert-icon"
                            style={{ color: "var(--color-yellow-600)" }}
                        />
                    )}
                    <div className="profile__alert-content">
                        <p className="profile__alert-title">
                            {isValidated
                                ? t(
                                      "profile.person_verified",
                                      "Datos verificados con RENIEC"
                                  )
                                : t(
                                      "profile.person_pending",
                                      "Datos pendientes de verificación"
                                  )}
                        </p>
                    </div>
                    <div
                        style={{
                            marginLeft: "auto",
                            display: "flex",
                            gap: "var(--space-2)",
                        }}
                    >
                        {!isValidated &&
                            person.documentType === DocumentType.DNI && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onRevalidate}
                                    isLoading={isRevalidating}
                                >
                                    {t("profile.revalidate", "Revalidar")}
                                </Button>
                            )}
                        <Button
                            variant="soft"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            <PencilSimple size={16} />
                            {t("profile.edit_nominal", "Editar")}
                        </Button>
                    </div>
                </div>

                {/* Datos en modo lectura */}
                <section className="profile__section">
                    <div className="profile__section-header">
                        <div className="profile__section-icon profile__section-icon--nominal">
                            <IdentificationCard size={18} weight="duotone" />
                        </div>
                        <div className="profile__section-title-group">
                            <h3 className="profile__section-title">
                                {t("profile.section.nominal", "Datos Nominales")}
                            </h3>
                            <p className="profile__section-subtitle">
                                {t(
                                    "profile.section.nominal_desc",
                                    "Información oficial para certificados"
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="profile__form-grid">
                        <ReadOnlyField
                            label={t("profile.first_name", "Nombre")}
                            value={person.firstName}
                        />
                        <ReadOnlyField
                            label={t("profile.last_name", "Apellido")}
                            value={person.lastName}
                        />
                        <ReadOnlyField
                            label={t(
                                "profile.document_type",
                                "Tipo de documento"
                            )}
                            value={person.documentType}
                        />
                        <ReadOnlyField
                            label={t(
                                "profile.document_number",
                                "Número de documento"
                            )}
                            value={person.documentNumber}
                        />
                        <ReadOnlyField
                            label={t("profile.country", "País")}
                            value={person.country || "-"}
                        />
                        <ReadOnlyField
                            label={t(
                                "profile.birth_date",
                                "Fecha de nacimiento"
                            )}
                            value={
                                person.birthDate
                                    ? (() => {
                                          const [year, month, day] = person.birthDate
                                              .split("T")[0]
                                              .split("-");
                                          return `${day}/${month}/${year}`;
                                      })()
                                    : "-"
                            }
                        />
                    </div>
                </section>

                {/* Aviso */}
                <div className="profile__alert profile__alert--neutral">
                    <Info
                        size={18}
                        className="profile__alert-icon"
                        style={{ color: "var(--color-grey-500)" }}
                    />
                    <div className="profile__alert-content">
                        <p className="profile__alert-text">
                            {t(
                                "profile.person_edit_notice",
                                "Puedes editar tus datos nominales si necesitas corregirlos. Al guardar se revalidará con RENIEC."
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Formulario para crear Person
    return (
        <form onSubmit={handleSubmit} className="profile__form">
            {/* Aviso informativo */}
            <div className="profile__alert profile__alert--info">
                <IdentificationCard
                    size={24}
                    weight="duotone"
                    className="profile__alert-icon"
                    style={{ color: "var(--color-cyan-600)" }}
                />
                <div className="profile__alert-content">
                    <p className="profile__alert-title">
                        {t(
                            "profile.complete_nominal_data",
                            "Completa tus datos nominales"
                        )}
                    </p>
                    <p className="profile__alert-text">
                        {t(
                            "profile.nominal_data_notice",
                            "Estos datos se usarán para emitir certificados oficiales. Asegúrate de que coincidan con tu documento de identidad."
                        )}
                    </p>
                </div>
            </div>

            {/* Sección: Datos Nominales */}
            <section className="profile__section">
                <div className="profile__section-header">
                    <div className="profile__section-icon profile__section-icon--nominal">
                        <IdentificationCard size={18} weight="duotone" />
                    </div>
                    <div className="profile__section-title-group">
                        <h3 className="profile__section-title">
                            {t("profile.section.nominal", "Datos Nominales")}
                        </h3>
                        <p className="profile__section-subtitle">
                            {t(
                                "profile.section.nominal_desc",
                                "Información oficial para certificados"
                            )}
                        </p>
                    </div>
                </div>

                <div className="profile__form-grid">
                    <Input
                        label={t("profile.first_name", "Nombre")}
                        value={formData.firstName}
                        onChange={(e) =>
                            handleChange("firstName", e.target.value)
                        }
                        placeholder={t(
                            "profile.legal_name_placeholder",
                            "Como aparece en tu documento"
                        )}
                        required
                    />

                    <Input
                        label={t("profile.last_name", "Apellido")}
                        value={formData.lastName}
                        onChange={(e) =>
                            handleChange("lastName", e.target.value)
                        }
                        placeholder={t(
                            "profile.legal_lastname_placeholder",
                            "Como aparece en tu documento"
                        )}
                        required
                    />

                    <FormSelect
                        label={t("profile.document_type", "Tipo de documento")}
                        value={formData.documentType}
                        onChange={(value) => handleChange("documentType", value)}
                        options={documentTypeOptions}
                        required
                    />

                    <Input
                        label={t(
                            "profile.document_number",
                            "Número de documento"
                        )}
                        value={formData.documentNumber}
                        onChange={(e) =>
                            handleChange("documentNumber", e.target.value)
                        }
                        placeholder={t(
                            "profile.document_number_placeholder",
                            "12345678"
                        )}
                        required
                    />

                    <Input
                        label={t("profile.country", "País")}
                        value={formData.country}
                        onChange={(e) =>
                            handleChange("country", e.target.value)
                        }
                        placeholder="Perú"
                    />

                    <Input
                        label={t("profile.birth_date", "Fecha de nacimiento")}
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) =>
                            handleChange("birthDate", e.target.value)
                        }
                    />
                </div>
            </section>

            <div className="profile__form-actions">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                    {t("profile.save_nominal_data", "Guardar datos nominales")}
                </Button>
            </div>
        </form>
    );
};

export default NominalTab;
