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
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    User,
    IdentificationCard,
    Envelope,
    Briefcase,
    Key,
    ShieldCheck,
} from "@phosphor-icons/react";

// Components
import { Button } from "@/components/ui/button";
import {
    AvatarEditor,
    UserVerificationBadge,
} from "@/components/users/components";

// Tabs
import { PersonalTab } from "./tabs/PersonalTab";
import { SecurityTab } from "./tabs/SecurityTab";
import { NominalTab } from "./tabs/NominalTab";

// Components
import { ProfileSkeleton } from "./components/ProfileSkeleton";
import { ChangePasswordModal } from "./components/ChangePasswordModal";

// Store & Services
import { useAuthStore } from "@/store/auth.store";
import { usersService, uploadService } from "@/services/users.service";
import {
    profileService,
    personService,
} from "@/services/profile.service";
import { getRoleDisplayName } from "@/lib/userUtils";
import {
    formatEventDate,
    getRelativeTime,
    getLocaleFromLang,
} from "@/lib/dateUtils";

// Styles
import "./ProfileView.css";

// ============================================
// Types
// ============================================

type TabId = "personal" | "security" | "nominal";

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
                t("profile.revalidate_error", "Error al revalidar con RENIEC");
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
        return <ProfileSkeleton />;
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
                            onSave={(data) => updateProfileMutation.mutate(data)}
                            isSaving={updateProfileMutation.isPending}
                            userEmail={user?.email || ""}
                        />
                    )}

                    {activeTab === "security" && (
                        <SecurityTab
                            onChangePassword={() => setIsPasswordModalOpen(true)}
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
                            isSaving={
                                createPersonMutation.isPending ||
                                updatePersonMutation.isPending
                            }
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
                                    {formatEventDate(fullUser.createdAt, locale)}
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
