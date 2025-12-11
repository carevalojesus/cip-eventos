/**
 * UserDetailView Component
 *
 * Vista de detalle de usuario con:
 * - Header con título y acciones (editar, activar/desactivar)
 * - Tabs de navegación a ancho completo
 * - Layout de 2 columnas debajo de tabs (contenido principal + sidebar)
 * - User Card con avatar, nombre, estado y verificación
 * - Tabs: Información Personal, Seguridad y Permisos, Historial de Actividad
 * - Sidebar con Rol del Sistema y Metadatos
 * - Zona de peligro para acciones destructivas
 */
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  SpinnerGap,
  ShieldWarning,
  EnvelopeSimple,
  Shield,
  ShieldCheck,
  Briefcase,
  FloppyDisk,
  PencilSimple,
  X,
} from "@phosphor-icons/react";

// Components
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/rui/form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { UserStatusBadge, UserVerificationBadge, UserAvatar, AvatarEditor } from "./components";
import { UserPersonalTab, UserSecurityTab, UserActivityTab } from "./tabs";

// Hooks
import { useDialog } from "@/hooks/useDialog";

// Services & Utils
import {
  usersService,
  rolesService,
  adminProfileService,
  uploadService,
} from "@/services/users.service";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/constants/roles";
import { getDisplayName, getRoleDisplayName } from "@/lib/userUtils";
import { formatEventDate, getRelativeTime, getLocaleFromLang } from "@/lib/dateUtils";

// Styles
import "./UserDetailView.css";

// ============================================
// TYPES
// ============================================

type TabId = "personal" | "security" | "activity";

interface UserDetailViewProps {
  userId: string;
  onNavigate: (path: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export const UserDetailView: React.FC<UserDetailViewProps> = ({ userId, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith("en");
  const locale = getLocaleFromLang(isEnglish ? "en" : "es");
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isOwnProfile = currentUser?.id === userId;

  // ============================================
  // STATE
  // ============================================

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [forcePasswordReset, setForcePasswordReset] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    email: "",
    roleId: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    designation: "",
    description: "",
    address: "",
  });

  // Dialogs
  const resetPasswordDialog = useDialog();
  const toggleStatusDialog = useDialog();
  const deleteDialog = useDialog();
  const changeRoleDialog = useDialog();
  const verifyEmailDialog = useDialog();

  // Change role state
  const [selectedRoleId, setSelectedRoleId] = useState("");

  // ============================================
  // QUERIES
  // ============================================

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersService.findById(userId),
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesService.findAll,
  });

  // Initialize form data and forcePasswordReset
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        roleId: user.role?.id?.toString() || "",
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        phoneNumber: user.profile?.phoneNumber || "",
        designation: user.profile?.designation || "",
        description: user.profile?.description || "",
        address: user.profile?.address || "",
      });
      setForcePasswordReset(user.forcePasswordReset || false);
    }
  }, [user]);

  // Role options
  const roleOptions = (roles || []).filter((r) => r.isActive).map((role) => ({
    value: role.id.toString(),
    label: getRoleDisplayName(role.name),
  }));

  // ============================================
  // MUTATIONS
  // ============================================

  const updateMutation = useMutation({
    mutationFn: async () => {
      await usersService.update(userId, {
        email: formData.email,
        roleId: parseInt(formData.roleId),
      });
      await adminProfileService.updateByUserId(userId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        designation: formData.designation,
        description: formData.description,
        address: formData.address,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success(t("users.detail.update_success", "Usuario actualizado correctamente"));
      setIsEditing(false);
      setHasChanges(false);
    },
    onError: () => {
      toast.error(t("users.detail.update_error", "Error al actualizar el usuario"));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => user?.isActive
      ? usersService.remove(userId)
      : usersService.update(userId, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(user?.isActive
        ? t("users.detail.deactivated", "Usuario desactivado")
        : t("users.detail.activated", "Usuario activado"));
      toggleStatusDialog.reset();
    },
    onError: () => {
      toast.error(t("users.detail.toggle_error", "Error al cambiar el estado"));
      toggleStatusDialog.setLoading(false);
    },
  });

  const forcePasswordResetMutation = useMutation({
    mutationFn: (value: boolean) => usersService.update(userId, { forcePasswordReset: value }),
    onSuccess: (_, value) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success(value
        ? t("users.detail.force_reset_enabled", "Se forzará cambio de contraseña en próximo inicio")
        : t("users.detail.force_reset_disabled", "Forzar cambio de contraseña desactivado"));
    },
    onError: () => {
      // Revertir el estado local si falla
      setForcePasswordReset(!forcePasswordReset);
      toast.error(t("users.detail.force_reset_error", "Error al actualizar configuración"));
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: (roleId: number) => usersService.changeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success(t("users.detail.role_changed", "Rol actualizado correctamente"));
      changeRoleDialog.reset();
    },
    onError: () => {
      toast.error(t("users.detail.role_change_error", "Error al cambiar el rol"));
      changeRoleDialog.setLoading(false);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: () => usersService.verifyEmailManually(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success(t("users.detail.email_verified", "Correo verificado correctamente"));
      verifyEmailDialog.reset();
    },
    onError: () => {
      toast.error(t("users.detail.verify_error", "Error al verificar el correo"));
      verifyEmailDialog.setLoading(false);
    },
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleBack = () => onNavigate(isEnglish ? "/en/users" : "/usuarios");

  const handleForcePasswordResetChange = (value: boolean) => {
    setForcePasswordReset(value);
    forcePasswordResetMutation.mutate(value);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setHasChanges(false);
    if (user) {
      setFormData({
        email: user.email,
        roleId: user.role?.id?.toString() || "",
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        phoneNumber: user.profile?.phoneNumber || "",
        designation: user.profile?.designation || "",
        description: user.profile?.description || "",
        address: user.profile?.address || "",
      });
    }
  };

  const handleSendResetLink = async () => {
    if (!user) return;
    resetPasswordDialog.setLoading(true);
    try {
      await usersService.adminResetPassword(user.email);
      toast.success(t("users.detail.reset_link_sent", "Enlace de recuperación enviado"));
      resetPasswordDialog.reset();
    } catch {
      toast.error(t("users.detail.reset_link_error", "Error al enviar el enlace"));
      resetPasswordDialog.setLoading(false);
    }
  };

  const handleSetPassword = async (password: string) => {
    if (!user) return;
    resetPasswordDialog.setLoading(true);
    try {
      await usersService.adminSetPassword(user.email, password);
      toast.success(t("users.detail.password_set", "Contraseña establecida"));
      resetPasswordDialog.reset();
    } catch {
      toast.error(t("users.detail.password_error", "Error al establecer la contraseña"));
      resetPasswordDialog.setLoading(false);
    }
  };

  const handleDelete = async () => {
    deleteDialog.setLoading(true);
    try {
      await usersService.remove(userId);
      toast.success(t("users.detail.deleted", "Usuario eliminado"));
      handleBack();
    } catch {
      toast.error(t("users.detail.delete_error", "Error al eliminar"));
      deleteDialog.setLoading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      // Get presigned URL
      const { uploadUrl, publicUrl } = await uploadService.getAvatarUploadUrl(
        file.type,
        file.size
      );

      console.log("Avatar upload - publicUrl:", publicUrl);
      console.log("Avatar upload - uploadUrl:", uploadUrl);

      // Upload to S3/MinIO
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload to storage failed: ${uploadResponse.status}`);
      }

      console.log("Avatar upload - File uploaded to storage successfully");

      // Update profile with new avatar URL
      await adminProfileService.updateByUserId(userId, { avatar: publicUrl });
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success(t("users.avatar.upload_success", "Avatar actualizado"));
    } catch (err: unknown) {
      console.error("Avatar upload error:", err);
      // Show more details if available
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: unknown } };
        console.error("Error response data:", axiosErr.response?.data);
      }
      toast.error(t("users.avatar.upload_error", "Error al subir el avatar"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setIsUploadingAvatar(true);
    try {
      await adminProfileService.updateByUserId(userId, { avatar: "" });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success(t("users.avatar.remove_success", "Avatar eliminado"));
    } catch {
      toast.error(t("users.avatar.remove_error", "Error al eliminar el avatar"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ============================================
  // LOADING & ERROR
  // ============================================

  if (isLoading) {
    return (
      <div className="user-detail">
        {/* Skeleton Breadcrumbs */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Skeleton width={200} height={16} />
        </div>

        {/* Skeleton Back Button */}
        <div style={{ marginBottom: "var(--space-6)" }}>
          <Skeleton width={140} height={36} style={{ borderRadius: "var(--radius-md)" }} />
        </div>

        {/* Skeleton Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
          <Skeleton width={180} height={28} />
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Skeleton width={100} height={36} style={{ borderRadius: "var(--radius-md)" }} />
            <Skeleton width={80} height={36} style={{ borderRadius: "var(--radius-md)" }} />
          </div>
        </div>

        {/* Skeleton User Card */}
        <div style={{
          backgroundColor: "var(--color-bg-primary)",
          border: "1px solid var(--color-grey-200)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
          marginBottom: "var(--space-6)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <SkeletonCircle size={80} />
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <Skeleton width={200} height={24} />
              <Skeleton width={180} height={16} />
              <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                <Skeleton width={70} height={24} style={{ borderRadius: "var(--radius-full)" }} />
                <Skeleton width={90} height={24} style={{ borderRadius: "var(--radius-full)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Tabs */}
        <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-6)", borderBottom: "1px solid var(--color-grey-200)", paddingBottom: "var(--space-3)" }}>
          <Skeleton width={140} height={20} />
          <Skeleton width={160} height={20} />
          <Skeleton width={150} height={20} />
        </div>

        {/* Skeleton Content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--space-6)" }}>
          {/* Main content */}
          <div style={{
            backgroundColor: "var(--color-bg-primary)",
            border: "1px solid var(--color-grey-200)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-6)"
          }}>
            <Skeleton width={120} height={20} style={{ marginBottom: "var(--space-4)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div><Skeleton width="40%" height={14} style={{ marginBottom: "var(--space-2)" }} /><Skeleton width="100%" height={40} style={{ borderRadius: "var(--radius-md)" }} /></div>
                <div><Skeleton width="40%" height={14} style={{ marginBottom: "var(--space-2)" }} /><Skeleton width="100%" height={40} style={{ borderRadius: "var(--radius-md)" }} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div><Skeleton width="50%" height={14} style={{ marginBottom: "var(--space-2)" }} /><Skeleton width="100%" height={40} style={{ borderRadius: "var(--radius-md)" }} /></div>
                <div><Skeleton width="35%" height={14} style={{ marginBottom: "var(--space-2)" }} /><Skeleton width="100%" height={40} style={{ borderRadius: "var(--radius-md)" }} /></div>
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-grey-200)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-4)"
            }}>
              <Skeleton width={100} height={16} style={{ marginBottom: "var(--space-3)" }} />
              <Skeleton width="100%" height={36} style={{ borderRadius: "var(--radius-md)" }} />
            </div>
            <div style={{
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-grey-200)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-4)"
            }}>
              <Skeleton width={80} height={16} style={{ marginBottom: "var(--space-3)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Skeleton width="100%" height={14} />
                <Skeleton width="100%" height={14} />
                <Skeleton width="80%" height={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-detail__error">
        <ShieldWarning size={48} color="var(--color-red-400)" />
        <p className="user-detail__error-text">
          {t("users.detail.error", "Error al cargar el usuario")}
        </p>
        <Button variant="secondary" onClick={handleBack}>
          {t("common.back", "Volver")}
        </Button>
      </div>
    );
  }

  const fullName = getDisplayName(user);

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="user-detail">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t("users.list.title", "Usuarios"), href: isEnglish ? "/en/users" : "/usuarios" },
          { label: fullName }
        ]}
      />

      {/* Back button */}
      <button type="button" className="user-detail__back" onClick={handleBack}>
        <ArrowLeft size={16} />
        {t("users.detail.back_to_list", "Volver a la lista")}
      </button>

      {/* Page Header */}
      <div className="user-detail__header">
        <div className="user-detail__header-title">
          <h1 className="user-detail__title">
            {t("users.detail.title", "Detalles del Usuario")}
          </h1>
          <p className="user-detail__subtitle">
            {t("users.detail.subtitle", "Visualiza y edita la información completa de")} {formData.firstName || fullName}.
          </p>
        </div>
        <div className="user-detail__header-actions">
          {isSuperAdmin && (
            <>
              {isEditing ? (
                <>
                  <Button variant="ghost" size="md" onClick={handleCancelEdit}>
                    <X size={18} />
                    {t("common.cancel", "Cancelar")}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => updateMutation.mutate()}
                    isLoading={updateMutation.isPending}
                    disabled={!hasChanges}
                  >
                    <FloppyDisk size={18} />
                    {t("users.detail.save_changes", "Guardar Cambios")}
                  </Button>
                </>
              ) : (
                !isOwnProfile && (
                  <>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => toggleStatusDialog.open()}
                    >
                      {user.isActive
                        ? t("users.detail.deactivate_account", "Desactivar")
                        : t("users.detail.activate_account", "Activar")}
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setIsEditing(true)}
                    >
                      <PencilSimple size={18} />
                      {t("common.edit", "Editar")}
                    </Button>
                  </>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* User Card - Full width above tabs */}
      <div className="user-detail__user-card">
        <div className="user-detail__user-info">
          {isEditing ? (
            <AvatarEditor
              user={user}
              onAvatarChange={handleAvatarChange}
              onAvatarRemove={handleAvatarRemove}
              isUploading={isUploadingAvatar}
            />
          ) : (
            <UserAvatar user={user} size="xl" />
          )}
          <div className="user-detail__user-details">
            <div className="user-detail__user-name">
              <span className="user-detail__user-name-text">{fullName}</span>
              <UserStatusBadge isActive={user.isActive} size="sm" />
            </div>
            <div className="user-detail__user-meta">
              <div className="user-detail__user-meta-item">
                <EnvelopeSimple size={14} />
                {user.email}
              </div>
              {user.profile?.designation && (
                <div className="user-detail__user-meta-item">
                  <Briefcase size={14} />
                  {user.profile.designation}
                </div>
              )}
              <div className="user-detail__user-meta-item">
                <Shield size={14} />
                {user.role?.description || user.role?.name}
              </div>
            </div>
          </div>
        </div>
        <div className="user-detail__verification">
          <div className="user-detail__verification-item">
            <span className="user-detail__verification-label">
              {t("users.detail.verified_label", "Verificado")}
            </span>
            <UserVerificationBadge isVerified={user.isVerified} showLabel={false} size="md" />
          </div>
          <div className="user-detail__verification-item">
            <span className="user-detail__verification-label">
              {t("users.detail.last_access_label", "Último Acceso")}
            </span>
            <span className="user-detail__verification-value">
              {user.lastLoginAt ? getRelativeTime(user.lastLoginAt, locale) : t("users.detail.never", "Nunca")}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs - Full width */}
      <div className="user-detail__tabs" role="tablist" aria-label={t("users.detail.tabs", "Secciones del usuario")}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "personal"}
          aria-controls="panel-personal"
          className={`user-detail__tab ${activeTab === "personal" ? "user-detail__tab--active" : ""}`}
          onClick={() => setActiveTab("personal")}
        >
          {t("users.detail.tab_personal", "Información Personal")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "security"}
          aria-controls="panel-security"
          className={`user-detail__tab ${activeTab === "security" ? "user-detail__tab--active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          {t("users.detail.tab_security", "Seguridad y Permisos")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "activity"}
          aria-controls="panel-activity"
          className={`user-detail__tab ${activeTab === "activity" ? "user-detail__tab--active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          {t("users.detail.tab_activity", "Historial de Actividad")}
        </button>
      </div>

      {/* Main Layout */}
      <div className="user-detail__layout">
        {/* Left: Tab Content */}
        <div className="user-detail__main">
          {/* Tab Content */}
          <div role="tabpanel" id="panel-personal" hidden={activeTab !== "personal"}>
            {activeTab === "personal" && (
              <UserPersonalTab
                formData={formData}
                isEditing={isEditing}
                onFormChange={handleFormChange}
              />
            )}
          </div>

          <div role="tabpanel" id="panel-security" hidden={activeTab !== "security"}>
            {activeTab === "security" && (
              <UserSecurityTab
                isSuperAdmin={isSuperAdmin}
                isOwnProfile={isOwnProfile}
                forcePasswordReset={forcePasswordReset}
                onForcePasswordResetChange={handleForcePasswordResetChange}
                onResetPassword={() => resetPasswordDialog.open()}
                onDeleteUser={() => deleteDialog.open()}
                onVerifyEmail={() => verifyEmailDialog.open()}
                onChangeRole={() => {
                  setSelectedRoleId(user.role?.id?.toString() || "");
                  changeRoleDialog.open();
                }}
                isVerified={user.isVerified}
                currentRoleName={user.role?.name}
              />
            )}
          </div>

          <div role="tabpanel" id="panel-activity" hidden={activeTab !== "activity"}>
            {activeTab === "activity" && (
              <UserActivityTab userId={userId} />
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="user-detail__sidebar">
          {/* Role Card */}
          <div className="user-detail__sidebar-card">
            <h4 className="user-detail__sidebar-title">
              {t("users.detail.system_role", "Rol del Sistema")}
            </h4>

            {isEditing ? (
              <FormSelect
                label=""
                value={formData.roleId}
                onChange={(value) => handleFormChange("roleId", value)}
                options={roleOptions}
                placeholder={t("users.select_role", "Seleccionar rol")}
              />
            ) : (
              <div className="user-detail__role-card user-detail__role-card--active">
                <div className="user-detail__role-icon user-detail__role-icon--active">
                  <ShieldCheck size={18} />
                </div>
                <div className="user-detail__role-info">
                  <div className="user-detail__role-name user-detail__role-name--active">
                    {getRoleDisplayName(user.role?.name) || t("users.no_role", "Sin rol")}
                  </div>
                </div>
                <div className="user-detail__role-indicator" />
              </div>
            )}
          </div>

          {/* Metadata Card */}
          <div className="user-detail__sidebar-card">
            <h4 className="user-detail__sidebar-title">
              {t("users.detail.metadata", "Metadatos")}
            </h4>
            <div className="user-detail__metadata-row">
              <span className="user-detail__metadata-label">
                {t("users.detail.user_id", "ID Usuario")}
              </span>
              <span className="user-detail__metadata-value user-detail__metadata-value--mono">
                USR-{user.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="user-detail__metadata-row">
              <span className="user-detail__metadata-label">
                {t("users.detail.registered", "Registrado")}
              </span>
              <span className="user-detail__metadata-value">
                {formatEventDate(user.createdAt, locale)}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <ResetPasswordModal
        isOpen={resetPasswordDialog.isOpen}
        onClose={resetPasswordDialog.close}
        userEmail={user.email}
        userName={fullName !== user.email ? fullName : null}
        onSendResetLink={handleSendResetLink}
        onSetPassword={handleSetPassword}
        isLoading={resetPasswordDialog.isLoading}
      />

      <ConfirmDialog
        isOpen={toggleStatusDialog.isOpen}
        onClose={toggleStatusDialog.close}
        onConfirm={() => { toggleStatusDialog.setLoading(true); toggleStatusMutation.mutate(); }}
        title={user.isActive
          ? t("users.detail.deactivate_title", "Desactivar usuario")
          : t("users.detail.activate_title", "Activar usuario")}
        description={user.isActive
          ? t("users.detail.deactivate_desc", { name: fullName, defaultValue: `¿Desactivar a ${fullName}? No podrá acceder al sistema.` })
          : t("users.detail.activate_desc", { name: fullName, defaultValue: `¿Activar a ${fullName}? Podrá acceder al sistema.` })}
        confirmText={user.isActive
          ? t("users.detail.deactivate", "Desactivar")
          : t("users.detail.activate", "Activar")}
        cancelText={t("common.cancel", "Cancelar")}
        variant={user.isActive ? "danger" : "success"}
        isLoading={toggleStatusDialog.isLoading}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={handleDelete}
        title={t("users.detail.delete_title", "Eliminar usuario")}
        description={t("users.detail.delete_desc", { name: fullName, defaultValue: `¿Estás seguro de eliminar a ${fullName}? Esta acción no se puede deshacer.` })}
        confirmText={t("common.delete", "Eliminar")}
        cancelText={t("common.cancel", "Cancelar")}
        variant="danger"
        isLoading={deleteDialog.isLoading}
      />

      <ConfirmDialog
        isOpen={verifyEmailDialog.isOpen}
        onClose={verifyEmailDialog.close}
        onConfirm={() => { verifyEmailDialog.setLoading(true); verifyEmailMutation.mutate(); }}
        title={t("users.detail.verify_email_title", "Verificar correo")}
        description={t("users.detail.verify_email_desc", { name: fullName, defaultValue: `¿Verificar manualmente el correo de ${fullName}? Esta acción quedará registrada en el historial.` })}
        confirmText={t("users.detail.verify_confirm", "Verificar")}
        cancelText={t("common.cancel", "Cancelar")}
        variant="info"
        isLoading={verifyEmailDialog.isLoading}
      />

      <ConfirmDialog
        isOpen={changeRoleDialog.isOpen}
        onClose={() => { changeRoleDialog.close(); setSelectedRoleId(""); }}
        onConfirm={() => {
          if (selectedRoleId && selectedRoleId !== user.role?.id?.toString()) {
            changeRoleDialog.setLoading(true);
            changeRoleMutation.mutate(parseInt(selectedRoleId));
          }
        }}
        title={t("users.detail.change_role_title", "Cambiar rol")}
        description={t("users.detail.change_role_desc", { name: fullName, defaultValue: `Selecciona el nuevo rol para ${fullName}. Esta acción quedará registrada en el historial.` })}
        confirmText={t("users.detail.change_role_confirm", "Cambiar")}
        cancelText={t("common.cancel", "Cancelar")}
        variant="warning"
        isLoading={changeRoleDialog.isLoading}
      >
        <div style={{ marginTop: "var(--space-4)" }}>
          <FormSelect
            label={t("users.detail.new_role", "Nuevo rol")}
            value={selectedRoleId}
            onChange={setSelectedRoleId}
            options={roleOptions}
            placeholder={t("users.select_role", "Seleccionar rol")}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default UserDetailView;
