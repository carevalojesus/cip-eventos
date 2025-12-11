import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    User,
    IdentificationCard,
    CheckCircle,
    Warning,
    SpinnerGap,
    Envelope,
    Phone,
    MapPin,
    Briefcase,
    Info,
} from "@phosphor-icons/react";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect } from "@/components/ui/form/index";

// Store & Services
import { useAuthStore } from "@/store/auth.store";
import {
    profileService,
    personService,
    type Profile,
    type Person,
    type UpdateProfileDto,
    type CreatePersonDto,
    DocumentType,
} from "@/services/profile.service";

// Styles
import "./ProfileView.css";

// ============================================
// Types
// ============================================

type TabId = "account" | "nominal";

// ============================================
// Loading Component
// ============================================

const LoadingState: React.FC = () => (
    <div className="profile__loading">
        <SpinnerGap size={32} className="profile__spinner" />
    </div>
);

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
// Profile Form (Datos de Cuenta)
// ============================================

interface ProfileFormProps {
    profile: Profile | null;
    isLoading: boolean;
    onSave: (data: UpdateProfileDto) => void;
    isSaving: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
    profile,
    isLoading,
    onSave,
    isSaving,
}) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const [formData, setFormData] = useState<UpdateProfileDto>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        designation: "",
        description: "",
        address: "",
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                phoneNumber: profile.phoneNumber || "",
                designation: profile.designation || "",
                description: profile.description || "",
                address: profile.address || "",
            });
        }
    }, [profile]);

    const handleChange = (field: keyof UpdateProfileDto, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (isLoading) {
        return <LoadingState />;
    }

    return (
        <form onSubmit={handleSubmit} className="profile__form">
            {/* Sección: Información de Cuenta */}
            <section className="profile__section">
                <div className="profile__section-header">
                    <div className="profile__section-icon profile__section-icon--account">
                        <User size={18} weight="duotone" />
                    </div>
                    <div className="profile__section-title-group">
                        <h3 className="profile__section-title">
                            {t("profile.section.account", "Información de Cuenta")}
                        </h3>
                        <p className="profile__section-subtitle">
                            {t(
                                "profile.section.account_desc",
                                "Tu información básica de usuario"
                            )}
                        </p>
                    </div>
                </div>

                <div className="profile__form-grid">
                    {/* Email (readonly) */}
                    <div className="profile__form-grid--full">
                        <Input
                            label={t("profile.email", "Correo electrónico")}
                            value={user?.email || ""}
                            disabled
                            leftIcon={<Envelope size={16} />}
                        />
                        <p className="profile__email-note">
                            {t(
                                "profile.email_readonly",
                                "El correo no puede ser modificado"
                            )}
                        </p>
                    </div>

                    {/* Nombre */}
                    <Input
                        label={t("profile.first_name", "Nombre")}
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        placeholder={t("profile.first_name_placeholder", "Tu nombre")}
                    />

                    {/* Apellido */}
                    <Input
                        label={t("profile.last_name", "Apellido")}
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        placeholder={t("profile.last_name_placeholder", "Tu apellido")}
                    />
                </div>
            </section>

            {/* Sección: Contacto */}
            <section className="profile__section">
                <div className="profile__section-header">
                    <div className="profile__section-icon profile__section-icon--contact">
                        <Phone size={18} weight="duotone" />
                    </div>
                    <div className="profile__section-title-group">
                        <h3 className="profile__section-title">
                            {t("profile.section.contact", "Contacto")}
                        </h3>
                        <p className="profile__section-subtitle">
                            {t(
                                "profile.section.contact_desc",
                                "Información de contacto y ubicación"
                            )}
                        </p>
                    </div>
                </div>

                <div className="profile__form-grid">
                    {/* Teléfono */}
                    <Input
                        label={t("profile.phone", "Teléfono")}
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange("phoneNumber", e.target.value)}
                        placeholder={t("profile.phone_placeholder", "+51 999 999 999")}
                        leftIcon={<Phone size={16} />}
                    />

                    {/* Cargo */}
                    <Input
                        label={t("profile.designation", "Cargo / Profesión")}
                        value={formData.designation}
                        onChange={(e) => handleChange("designation", e.target.value)}
                        placeholder={t(
                            "profile.designation_placeholder",
                            "Ej: Ingeniero Civil"
                        )}
                        leftIcon={<Briefcase size={16} />}
                    />

                    {/* Dirección */}
                    <div className="profile__form-grid--full">
                        <Input
                            label={t("profile.address", "Dirección")}
                            value={formData.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            placeholder={t("profile.address_placeholder", "Tu dirección")}
                            leftIcon={<MapPin size={16} />}
                        />
                    </div>

                    {/* Descripción */}
                    <div className="profile__form-grid--full">
                        <Textarea
                            label={t("profile.description", "Acerca de ti")}
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder={t(
                                "profile.description_placeholder",
                                "Una breve descripción sobre ti..."
                            )}
                            rows={3}
                        />
                    </div>
                </div>
            </section>

            {/* Botón guardar */}
            <div className="profile__form-actions">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                    {t("profile.save", "Guardar cambios")}
                </Button>
            </div>
        </form>
    );
};

// ============================================
// Person Form (Datos Nominales)
// ============================================

interface PersonFormProps {
    person: Person | null;
    hasData: boolean;
    isLoading: boolean;
    onSave: (data: CreatePersonDto) => void;
    isSaving: boolean;
    userEmail: string;
}

const PersonForm: React.FC<PersonFormProps> = ({
    person,
    hasData,
    isLoading,
    onSave,
    isSaving,
    userEmail,
}) => {
    const { t } = useTranslation();

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

    const handleChange = (field: keyof CreatePersonDto, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const documentTypeOptions = [
        { value: DocumentType.DNI, label: "DNI" },
        { value: DocumentType.CE, label: t("profile.doc_ce", "Carné de Extranjería") },
        { value: DocumentType.PASSPORT, label: t("profile.doc_passport", "Pasaporte") },
        { value: DocumentType.OTHER, label: t("profile.doc_other", "Otro") },
    ];

    if (isLoading) {
        return <LoadingState />;
    }

    // Si ya tiene Person, mostrar en modo lectura
    if (hasData && person) {
        const isValidated =
            person.reniecValidationScore !== null &&
            person.reniecValidationScore >= 80;

        return (
            <div className="profile__form">
                {/* Badge de validación */}
                <div
                    className={`profile__alert ${
                        isValidated ? "profile__alert--success" : "profile__alert--warning"
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
                                ? t("profile.person_verified", "Datos verificados con RENIEC")
                                : t(
                                      "profile.person_pending",
                                      "Datos pendientes de verificación"
                                  )}
                        </p>
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
                            label={t("profile.document_type", "Tipo de documento")}
                            value={person.documentType}
                        />
                        <ReadOnlyField
                            label={t("profile.document_number", "Número de documento")}
                            value={person.documentNumber}
                        />
                        <ReadOnlyField
                            label={t("profile.country", "País")}
                            value={person.country || "-"}
                        />
                        <ReadOnlyField
                            label={t("profile.birth_date", "Fecha de nacimiento")}
                            value={
                                person.birthDate
                                    ? new Date(person.birthDate).toLocaleDateString("es-PE")
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
                                "profile.person_readonly_notice",
                                "Los datos nominales se utilizan para emitir certificados oficiales. Si necesitas corregirlos, contacta a soporte."
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
                        {t("profile.complete_nominal_data", "Completa tus datos nominales")}
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
                    {/* Nombre */}
                    <Input
                        label={t("profile.first_name", "Nombre")}
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        placeholder={t(
                            "profile.legal_name_placeholder",
                            "Como aparece en tu documento"
                        )}
                        required
                    />

                    {/* Apellido */}
                    <Input
                        label={t("profile.last_name", "Apellido")}
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        placeholder={t(
                            "profile.legal_lastname_placeholder",
                            "Como aparece en tu documento"
                        )}
                        required
                    />

                    {/* Tipo de documento */}
                    <FormSelect
                        label={t("profile.document_type", "Tipo de documento")}
                        value={formData.documentType}
                        onChange={(value) => handleChange("documentType", value)}
                        options={documentTypeOptions}
                        required
                    />

                    {/* Número de documento */}
                    <Input
                        label={t("profile.document_number", "Número de documento")}
                        value={formData.documentNumber}
                        onChange={(e) => handleChange("documentNumber", e.target.value)}
                        placeholder={t("profile.document_number_placeholder", "12345678")}
                        required
                    />

                    {/* País */}
                    <Input
                        label={t("profile.country", "País")}
                        value={formData.country}
                        onChange={(e) => handleChange("country", e.target.value)}
                        placeholder="Perú"
                    />

                    {/* Fecha de nacimiento */}
                    <Input
                        label={t("profile.birth_date", "Fecha de nacimiento")}
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleChange("birthDate", e.target.value)}
                    />
                </div>
            </section>

            {/* Botón guardar */}
            <div className="profile__form-actions">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                    {t("profile.save_nominal_data", "Guardar datos nominales")}
                </Button>
            </div>
        </form>
    );
};

// ============================================
// Main ProfileView Component
// ============================================

export const ProfileView: React.FC = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabId>("account");

    // Query: Profile
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ["profile", "me"],
        queryFn: profileService.getMyProfile,
        retry: false,
    });

    // Query: Person
    const { data: personResponse, isLoading: isLoadingPerson } = useQuery({
        queryKey: ["person", "me"],
        queryFn: personService.getMyPerson,
    });

    // Mutation: Update Profile
    const updateProfileMutation = useMutation({
        mutationFn: profileService.updateProfile,
        onSuccess: (updatedProfile) => {
            queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
            // Actualizar el store de auth
            updateUser({
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
                avatar: updatedProfile.avatar,
            });
            toast.success(
                t("profile.save_success", "Perfil actualizado correctamente")
            );
        },
        onError: () => {
            toast.error(t("profile.save_error", "Error al actualizar el perfil"));
        },
    });

    // Mutation: Create Person
    const createPersonMutation = useMutation({
        mutationFn: personService.createMyPerson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["person", "me"] });
            toast.success(
                t("profile.nominal_save_success", "Datos nominales guardados correctamente")
            );
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                t("profile.nominal_save_error", "Error al guardar los datos nominales");
            toast.error(message);
        },
    });

    return (
        <div className="profile">
            {/* Header */}
            <div className="profile__header">
                <h1 className="profile__title">{t("profile.title", "Mi Perfil")}</h1>
                <p className="profile__subtitle">
                    {t(
                        "profile.subtitle",
                        "Administra tu información personal y datos nominales"
                    )}
                </p>
            </div>

            {/* Tabs */}
            <div className="profile__tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "account"}
                    className={`profile__tab ${
                        activeTab === "account" ? "profile__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("account")}
                >
                    <User size={18} />
                    {t("profile.tab_account", "Cuenta")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "nominal"}
                    className={`profile__tab ${
                        activeTab === "nominal" ? "profile__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("nominal")}
                >
                    <IdentificationCard size={18} />
                    {t("profile.tab_nominal", "Datos Nominales")}
                </button>
            </div>

            {/* Content */}
            {activeTab === "account" ? (
                <ProfileForm
                    profile={profile || null}
                    isLoading={isLoadingProfile}
                    onSave={(data) => updateProfileMutation.mutate(data)}
                    isSaving={updateProfileMutation.isPending}
                />
            ) : (
                <PersonForm
                    person={personResponse?.data || null}
                    hasData={personResponse?.hasData || false}
                    isLoading={isLoadingPerson}
                    onSave={(data) => createPersonMutation.mutate(data)}
                    isSaving={createPersonMutation.isPending}
                    userEmail={user?.email || ""}
                />
            )}
        </div>
    );
};

export default ProfileView;
