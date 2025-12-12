/**
 * ProfileView Component
 *
 * Vista de perfil del usuario autenticado con:
 * - User Card con avatar editable
 * - Tabs: Información Personal, Seguridad, Datos Nominales
 * - Layout de 2 columnas (main + sidebar)
 * - Cambio de contraseña
 * - Metadatos del usuario
 */
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
    Key,
    ShieldCheck,
    Lock,
    X,
    SealCheck,
    Clock,
    PencilSimple,
} from "@phosphor-icons/react";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect } from "@/components/ui/form/index";
import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";
import {
    AvatarEditor,
    UserAvatar,
    UserVerificationBadge,
} from "@/components/users/components";

// Store & Services
import { useAuthStore } from "@/store/auth.store";
import { usersService, uploadService } from "@/services/users.service";
import {
    profileService,
    personService,
    type Profile,
    type Person,
    type UpdateProfileDto,
    type CreatePersonDto,
    type UpdatePersonDto,
    DocumentType,
} from "@/services/profile.service";
import { getRoleDisplayName } from "@/lib/userUtils";
import {
    formatEventDate,
    getRelativeTime,
    getLocaleFromLang,
} from "@/lib/dateUtils";
import api from "@/lib/api";

// Styles
import "./ProfileView.css";

// ============================================
// Types
// ============================================

type TabId = "personal" | "security" | "nominal";

// ============================================
// Loading Skeleton
// ============================================

const LoadingSkeleton: React.FC = () => (
    <div className="profile">
        {/* Header Skeleton */}
        <div className="profile__header">
            <div className="profile__header-title">
                <Skeleton width={200} height={28} />
                <Skeleton
                    width={300}
                    height={16}
                    style={{ marginTop: "var(--space-2)" }}
                />
            </div>
        </div>

        {/* User Card Skeleton */}
        <div className="profile__user-card">
            <div className="profile__user-info">
                <SkeletonCircle size={80} />
                <div className="profile__user-details">
                    <Skeleton width={180} height={24} />
                    <Skeleton
                        width={200}
                        height={16}
                        style={{ marginTop: "var(--space-2)" }}
                    />
                </div>
            </div>
        </div>

        {/* Tabs Skeleton */}
        <div
            style={{
                display: "flex",
                gap: "var(--space-4)",
                marginBottom: "var(--space-6)",
                borderBottom: "1px solid var(--color-grey-200)",
                paddingBottom: "var(--space-3)",
            }}
        >
            <Skeleton width={140} height={20} />
            <Skeleton width={100} height={20} />
            <Skeleton width={130} height={20} />
        </div>

        {/* Content Skeleton */}
        <div className="profile__layout">
            <div className="profile__main">
                <div className="profile__card">
                    <Skeleton
                        width={120}
                        height={20}
                        style={{ marginBottom: "var(--space-4)" }}
                    />
                    <div className="profile__form-grid">
                        <div>
                            <Skeleton
                                width="40%"
                                height={14}
                                style={{ marginBottom: "var(--space-2)" }}
                            />
                            <Skeleton
                                width="100%"
                                height={40}
                                style={{ borderRadius: "var(--radius-md)" }}
                            />
                        </div>
                        <div>
                            <Skeleton
                                width="40%"
                                height={14}
                                style={{ marginBottom: "var(--space-2)" }}
                            />
                            <Skeleton
                                width="100%"
                                height={40}
                                style={{ borderRadius: "var(--radius-md)" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="profile__sidebar">
                <div className="profile__sidebar-card">
                    <Skeleton
                        width={100}
                        height={16}
                        style={{ marginBottom: "var(--space-3)" }}
                    />
                    <Skeleton
                        width="100%"
                        height={36}
                        style={{ borderRadius: "var(--radius-md)" }}
                    />
                </div>
            </div>
        </div>
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
// Change Password Modal
// ============================================

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validate = (): string | null => {
        if (!currentPassword) {
            return t(
                "change_password.validation.current_required",
                "Ingresa tu contraseña actual"
            );
        }
        if (!newPassword) {
            return t(
                "change_password.validation.new_required",
                "Ingresa la nueva contraseña"
            );
        }
        if (newPassword.length < 8) {
            return t(
                "change_password.validation.min_length",
                "La contraseña debe tener al menos 8 caracteres"
            );
        }
        if (!/[A-Z]/.test(newPassword)) {
            return t(
                "change_password.validation.uppercase",
                "La contraseña debe contener al menos una mayúscula"
            );
        }
        if (!/[0-9]/.test(newPassword)) {
            return t(
                "change_password.validation.number",
                "La contraseña debe contener al menos un número"
            );
        }
        if (newPassword !== confirmPassword) {
            return t(
                "change_password.validation.mismatch",
                "Las contraseñas no coinciden"
            );
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.post("/auth/change-password", {
                currentPassword,
                newPassword,
            });
            toast.success(
                t(
                    "profile.password_changed",
                    "Contraseña cambiada exitosamente"
                )
            );
            handleClose();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                t("errors.unknown", "Error desconocido");
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="profile__modal-overlay" onClick={handleClose}>
            <div
                className="profile__modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="profile__modal-header">
                    <div className="profile__modal-icon">
                        <Key size={20} weight="duotone" />
                    </div>
                    <h2 className="profile__modal-title">
                        {t("profile.change_password", "Cambiar Contraseña")}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        style={{ marginLeft: "auto" }}
                    >
                        <X size={18} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="profile__modal-content">
                        <div className="profile__modal-form">
                            <Input
                                label={t(
                                    "change_password.current",
                                    "Contraseña actual"
                                )}
                                type="password"
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                }
                                placeholder={t(
                                    "change_password.current_placeholder",
                                    "Ingresa tu contraseña actual"
                                )}
                                leftIcon={<Lock size={16} />}
                                showPasswordToggle
                            />

                            <Input
                                label={t(
                                    "change_password.new",
                                    "Nueva contraseña"
                                )}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t(
                                    "change_password.new_placeholder",
                                    "Ingresa la nueva contraseña"
                                )}
                                leftIcon={<Lock size={16} />}
                                showPasswordToggle
                            />

                            <Input
                                label={t(
                                    "change_password.confirm",
                                    "Confirmar contraseña"
                                )}
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder={t(
                                    "change_password.confirm_placeholder",
                                    "Confirma la nueva contraseña"
                                )}
                                leftIcon={<Lock size={16} />}
                                showPasswordToggle
                            />

                            {error && (
                                <div className="profile__modal-message profile__modal-message--error">
                                    <Warning size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile__modal-footer">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            {t("common.cancel", "Cancelar")}
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                        >
                            {t(
                                "profile.change_password_submit",
                                "Cambiar Contraseña"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================
// Personal Tab
// ============================================

interface PersonalTabProps {
    profile: Profile | null;
    isLoading: boolean;
    onSave: (data: UpdateProfileDto) => void;
    isSaving: boolean;
    userEmail: string;
}

const PersonalTab: React.FC<PersonalTabProps> = ({
    profile,
    isLoading,
    onSave,
    isSaving,
    userEmail,
}) => {
    const { t } = useTranslation();

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
        return (
            <div className="profile__loading">
                <SpinnerGap size={32} className="profile__spinner" />
            </div>
        );
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
                            {t(
                                "profile.section.account",
                                "Información de Cuenta"
                            )}
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
                    <div className="profile__form-grid--full">
                        <Input
                            label={t("profile.email", "Correo electrónico")}
                            value={userEmail}
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

                    <Input
                        label={t("profile.first_name", "Nombre")}
                        value={formData.firstName}
                        onChange={(e) =>
                            handleChange("firstName", e.target.value)
                        }
                        placeholder={t(
                            "profile.first_name_placeholder",
                            "Tu nombre"
                        )}
                    />

                    <Input
                        label={t("profile.last_name", "Apellido")}
                        value={formData.lastName}
                        onChange={(e) =>
                            handleChange("lastName", e.target.value)
                        }
                        placeholder={t(
                            "profile.last_name_placeholder",
                            "Tu apellido"
                        )}
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
                    <Input
                        label={t("profile.phone", "Teléfono")}
                        value={formData.phoneNumber}
                        onChange={(e) =>
                            handleChange("phoneNumber", e.target.value)
                        }
                        placeholder={t(
                            "profile.phone_placeholder",
                            "+51 999 999 999"
                        )}
                        leftIcon={<Phone size={16} />}
                    />

                    <Input
                        label={t("profile.designation", "Cargo / Profesión")}
                        value={formData.designation}
                        onChange={(e) =>
                            handleChange("designation", e.target.value)
                        }
                        placeholder={t(
                            "profile.designation_placeholder",
                            "Ej: Ingeniero Civil"
                        )}
                        leftIcon={<Briefcase size={16} />}
                    />

                    <div className="profile__form-grid--full">
                        <Input
                            label={t("profile.address", "Dirección")}
                            value={formData.address}
                            onChange={(e) =>
                                handleChange("address", e.target.value)
                            }
                            placeholder={t(
                                "profile.address_placeholder",
                                "Tu dirección"
                            )}
                            leftIcon={<MapPin size={16} />}
                        />
                    </div>

                    <div className="profile__form-grid--full">
                        <Textarea
                            label={t("profile.description", "Acerca de ti")}
                            value={formData.description}
                            onChange={(e) =>
                                handleChange("description", e.target.value)
                            }
                            placeholder={t(
                                "profile.description_placeholder",
                                "Una breve descripción sobre ti..."
                            )}
                            rows={3}
                        />
                    </div>
                </div>
            </section>

            <div className="profile__form-actions">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                    {t("profile.save", "Guardar cambios")}
                </Button>
            </div>
        </form>
    );
};

// ============================================
// Security Tab
// ============================================

interface SecurityTabProps {
    onChangePassword: () => void;
    isVerified: boolean;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
    onChangePassword,
    isVerified,
}) => {
    const { t } = useTranslation();

    return (
        <div className="profile__card">
            <h3 className="profile__card-title">
                {t("profile.account_security", "Seguridad de la Cuenta")}
            </h3>

            {/* Password */}
            <div className="profile__security-item">
                <div className="profile__security-left">
                    <div className="profile__security-icon">
                        <Key size={20} />
                    </div>
                    <div>
                        <div className="profile__security-title">
                            {t("profile.password", "Contraseña")}
                        </div>
                        <div className="profile__security-desc">
                            {t(
                                "profile.password_desc",
                                "Cambia tu contraseña regularmente para mayor seguridad"
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onChangePassword}
                    style={{ color: "var(--color-red-600)" }}
                >
                    {t("profile.change_password", "Cambiar contraseña")}
                </Button>
            </div>

            {/* Email Verification Status */}
            <div className="profile__security-item">
                <div className="profile__security-left">
                    <div className="profile__security-icon">
                        <Envelope size={20} />
                    </div>
                    <div>
                        <div className="profile__security-title">
                            {t(
                                "profile.email_verification",
                                "Verificación de Correo"
                            )}
                        </div>
                        <div className="profile__security-desc">
                            {isVerified
                                ? t(
                                      "profile.email_verified_status",
                                      "Tu correo electrónico está verificado"
                                  )
                                : t(
                                      "profile.email_not_verified",
                                      "Tu correo electrónico no ha sido verificado"
                                  )}
                        </div>
                    </div>
                </div>
                {isVerified ? (
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-1)",
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-green-600)",
                            fontWeight: 500,
                        }}
                    >
                        <SealCheck size={16} weight="fill" />
                        {t("profile.verified", "Verificado")}
                    </span>
                ) : (
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-1)",
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-yellow-600)",
                            fontWeight: 500,
                        }}
                    >
                        <Clock size={16} />
                        {t("profile.pending", "Pendiente")}
                    </span>
                )}
            </div>
        </div>
    );
};

// ============================================
// Nominal Tab
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

const NominalTab: React.FC<NominalTabProps> = ({
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
    React.useEffect(() => {
        if (person) {
            // Extraer solo la parte de fecha (YYYY-MM-DD) para el input type="date"
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
                                {t("profile.editing_nominal", "Editando datos nominales")}
                            </p>
                            <p className="profile__alert-text">
                                {t("profile.editing_nominal_notice", "Al guardar, se revalidará automáticamente con RENIEC si es DNI.")}
                            </p>
                        </div>
                    </div>

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
                                    {t("profile.section.nominal_desc", "Información oficial para certificados")}
                                </p>
                            </div>
                        </div>

                        <div className="profile__form-grid">
                            <Input
                                label={t("profile.first_name", "Nombre")}
                                value={editData.firstName || ""}
                                onChange={(e) => handleEditChange("firstName", e.target.value)}
                                placeholder={t("profile.legal_name_placeholder", "Como aparece en tu documento")}
                                required
                            />
                            <Input
                                label={t("profile.last_name", "Apellido")}
                                value={editData.lastName || ""}
                                onChange={(e) => handleEditChange("lastName", e.target.value)}
                                placeholder={t("profile.legal_lastname_placeholder", "Como aparece en tu documento")}
                                required
                            />
                            <FormSelect
                                label={t("profile.document_type", "Tipo de documento")}
                                value={editData.documentType || DocumentType.DNI}
                                onChange={(value) => handleEditChange("documentType", value)}
                                options={documentTypeOptions}
                                required
                            />
                            <Input
                                label={t("profile.document_number", "Número de documento")}
                                value={editData.documentNumber || ""}
                                onChange={(e) => handleEditChange("documentNumber", e.target.value)}
                                placeholder={t("profile.document_number_placeholder", "12345678")}
                                required
                            />
                            <Input
                                label={t("profile.country", "País")}
                                value={editData.country || ""}
                                onChange={(e) => handleEditChange("country", e.target.value)}
                                placeholder="Perú"
                            />
                            <Input
                                label={t("profile.birth_date", "Fecha de nacimiento")}
                                type="date"
                                value={editData.birthDate || ""}
                                onChange={(e) => handleEditChange("birthDate", e.target.value)}
                            />
                        </div>
                    </section>

                    <div className="profile__form-actions" style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                        <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                            {t("common.cancel", "Cancelar")}
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isSaving}>
                            {t("profile.save_and_revalidate", "Guardar y revalidar")}
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
                    <div style={{ marginLeft: "auto", display: "flex", gap: "var(--space-2)" }}>
                        {!isValidated && person.documentType === DocumentType.DNI && (
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
                                          // Parsear fecha sin conversión de zona horaria
                                          const [year, month, day] = person.birthDate.split("T")[0].split("-");
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
                        onChange={(value) =>
                            handleChange("documentType", value)
                        }
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

// ============================================
// Main ProfileView Component
// ============================================

export const ProfileView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isEnglish = i18n.language?.startsWith("en");
    const locale = getLocaleFromLang(isEnglish ? "en" : "es");
    const { user, updateUser } = useAuthStore();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<TabId>("personal");
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Query: Full user data
    const { data: fullUser, isLoading: isLoadingUser } = useQuery({
        queryKey: ["user", "profile"],
        queryFn: usersService.getProfile,
    });

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
            queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
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
            toast.error(
                t("profile.save_error", "Error al actualizar el perfil")
            );
        },
    });

    // Mutation: Create Person
    const createPersonMutation = useMutation({
        mutationFn: personService.createMyPerson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["person", "me"] });
            toast.success(
                t(
                    "profile.nominal_save_success",
                    "Datos nominales guardados correctamente"
                )
            );
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                t(
                    "profile.nominal_save_error",
                    "Error al guardar los datos nominales"
                );
            toast.error(message);
        },
    });

    // Mutation: Update Person
    const updatePersonMutation = useMutation({
        mutationFn: personService.updateMyPerson,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["person", "me"] });
            const isValidated =
                data.reniecValidationScore !== null &&
                data.reniecValidationScore >= 80;
            if (isValidated) {
                toast.success(
                    t(
                        "profile.nominal_update_success",
                        "Datos actualizados y verificados con RENIEC"
                    )
                );
            } else {
                toast.warning(
                    t(
                        "profile.nominal_update_partial",
                        "Datos actualizados pero no coinciden completamente con RENIEC"
                    )
                );
            }
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                t(
                    "profile.nominal_update_error",
                    "Error al actualizar los datos nominales"
                );
            toast.error(message);
        },
    });

    // Mutation: Revalidate Person with RENIEC
    const revalidatePersonMutation = useMutation({
        mutationFn: personService.revalidateMyPerson,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["person", "me"] });
            const isValidated =
                data.reniecValidationScore !== null &&
                data.reniecValidationScore >= 80;
            if (isValidated) {
                toast.success(
                    t(
                        "profile.revalidate_success",
                        "Datos verificados correctamente con RENIEC"
                    )
                );
            } else {
                toast.warning(
                    t(
                        "profile.revalidate_partial",
                        "Los datos no coinciden completamente con RENIEC"
                    )
                );
            }
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                t(
                    "profile.revalidate_error",
                    "Error al revalidar con RENIEC"
                );
            toast.error(message);
        },
    });

    // Avatar handlers
    const handleAvatarChange = async (file: File) => {
        setIsUploadingAvatar(true);
        try {
            const { uploadUrl, publicUrl } =
                await uploadService.getAvatarUploadUrl(file.type, file.size);

            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            await profileService.updateProfile({ avatar: publicUrl });
            queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
            queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
            updateUser({ avatar: publicUrl });
            toast.success(
                t("users.avatar.upload_success", "Avatar actualizado")
            );
        } catch (err) {
            console.error("Avatar upload error:", err);
            toast.error(
                t("users.avatar.upload_error", "Error al subir el avatar")
            );
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleAvatarRemove = async () => {
        setIsUploadingAvatar(true);
        try {
            await profileService.updateProfile({ avatar: "" });
            queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
            queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
            updateUser({ avatar: undefined });
            toast.success(t("users.avatar.remove_success", "Avatar eliminado"));
        } catch {
            toast.error(
                t("users.avatar.remove_error", "Error al eliminar el avatar")
            );
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // Loading state
    if (isLoadingUser) {
        return <LoadingSkeleton />;
    }

    const displayName =
        profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : user?.email || "";

    // Create a UserLike object for components that need it
    const userLike = {
        email: user?.email || "",
        profile: {
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            avatar: profile?.avatar,
        },
    };

    return (
        <div className="profile">
            {/* Header */}
            <div className="profile__header">
                <div className="profile__header-title">
                    <h1 className="profile__title">
                        {t("profile.title", "Mi Perfil")}
                    </h1>
                    <p className="profile__subtitle">
                        {t(
                            "profile.subtitle",
                            "Administra tu información personal, seguridad y datos nominales"
                        )}
                    </p>
                </div>
            </div>

            {/* User Card */}
            <div className="profile__user-card">
                <div className="profile__user-info">
                    <AvatarEditor
                        user={userLike}
                        onAvatarChange={handleAvatarChange}
                        onAvatarRemove={handleAvatarRemove}
                        isUploading={isUploadingAvatar}
                    />
                    <div className="profile__user-details">
                        <div className="profile__user-name">
                            <span className="profile__user-name-text">
                                {displayName}
                            </span>
                        </div>
                        <div className="profile__user-meta">
                            <div className="profile__user-meta-item">
                                <Envelope size={14} />
                                {user?.email}
                            </div>
                            {profile?.designation && (
                                <div className="profile__user-meta-item">
                                    <Briefcase size={14} />
                                    {profile.designation}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="profile__verification">
                    <div className="profile__verification-item">
                        <span className="profile__verification-label">
                            {t("profile.verified_label", "Verificado")}
                        </span>
                        <UserVerificationBadge
                            isVerified={fullUser?.isVerified || false}
                            showLabel={false}
                            size="md"
                        />
                    </div>
                    <div className="profile__verification-item">
                        <span className="profile__verification-label">
                            {t("profile.last_access_label", "Último Acceso")}
                        </span>
                        <span className="profile__verification-value">
                            {fullUser?.lastLoginAt
                                ? getRelativeTime(fullUser.lastLoginAt, locale)
                                : t("profile.now", "Ahora")}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile__tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "personal"}
                    className={`profile__tab ${
                        activeTab === "personal" ? "profile__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("personal")}
                >
                    <User size={18} />
                    {t("profile.tab_personal", "Información Personal")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "security"}
                    className={`profile__tab ${
                        activeTab === "security" ? "profile__tab--active" : ""
                    }`}
                    onClick={() => setActiveTab("security")}
                >
                    <Key size={18} />
                    {t("profile.tab_security", "Seguridad")}
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

            {/* Main Layout */}
            <div className="profile__layout">
                {/* Left: Tab Content */}
                <div className="profile__main">
                    {activeTab === "personal" && (
                        <PersonalTab
                            profile={profile || null}
                            isLoading={isLoadingProfile}
                            onSave={(data) =>
                                updateProfileMutation.mutate(data)
                            }
                            isSaving={updateProfileMutation.isPending}
                            userEmail={user?.email || ""}
                        />
                    )}

                    {activeTab === "security" && (
                        <SecurityTab
                            onChangePassword={() =>
                                setIsPasswordModalOpen(true)
                            }
                            isVerified={fullUser?.isVerified || false}
                        />
                    )}

                    {activeTab === "nominal" && (
                        <NominalTab
                            person={personResponse?.data || null}
                            hasData={personResponse?.hasData || false}
                            isLoading={isLoadingPerson}
                            onSave={(data) => createPersonMutation.mutate(data)}
                            onUpdate={(data) => updatePersonMutation.mutate(data)}
                            isSaving={createPersonMutation.isPending || updatePersonMutation.isPending}
                            userEmail={user?.email || ""}
                            onRevalidate={() => revalidatePersonMutation.mutate()}
                            isRevalidating={revalidatePersonMutation.isPending}
                        />
                    )}
                </div>

                {/* Right: Sidebar */}
                <aside className="profile__sidebar">
                    {/* Role Card */}
                    <div className="profile__sidebar-card">
                        <h4 className="profile__sidebar-title">
                            {t("profile.system_role", "Rol del Sistema")}
                        </h4>
                        <div className="profile__role-card">
                            <div className="profile__role-icon">
                                <ShieldCheck size={18} />
                            </div>
                            <div className="profile__role-name">
                                {getRoleDisplayName(user?.role)}
                            </div>
                            <div className="profile__role-indicator" />
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="profile__sidebar-card">
                        <h4 className="profile__sidebar-title">
                            {t("profile.metadata", "Metadatos")}
                        </h4>
                        {fullUser?.id && (
                            <div className="profile__metadata-row">
                                <span className="profile__metadata-label">
                                    {t("profile.user_id", "ID Usuario")}
                                </span>
                                <span className="profile__metadata-value profile__metadata-value--mono">
                                    USR-{fullUser.id.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        )}
                        {fullUser?.createdAt && (
                            <div className="profile__metadata-row">
                                <span className="profile__metadata-label">
                                    {t("profile.registered", "Registrado")}
                                </span>
                                <span className="profile__metadata-value">
                                    {formatEventDate(
                                        fullUser.createdAt,
                                        locale
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    );
};

export default ProfileView;
