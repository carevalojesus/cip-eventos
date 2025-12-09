/**
 * UserDetailView Component
 *
 * Vista de detalle de usuario con:
 * - Header con avatar, nombre, estado y verificación
 * - Layout de 2 columnas (contenido principal + sidebar)
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
  Buildings,
  FloppyDisk,
  PencilSimple,
  X,
} from "@phosphor-icons/react";

// Components
import { Button } from "@/components/ui/rui-button";
import { FormSelect } from "@/components/ui/rui/form";
import { ConfirmDialog } from "@/components/ui/rui-confirm-dialog";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { UserStatusBadge, UserVerificationBadge, UserAvatar } from "./components";
import { UserPersonalTab, UserSecurityTab, UserActivityTab } from "./tabs";

// Hooks
import { useDialog } from "@/hooks/useDialog";

// Services & Utils
import {
  usersService,
  rolesService,
  adminProfileService,
} from "@/services/users.service";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/constants/roles";
import { getDisplayName } from "@/lib/userUtils";
import { formatDateTimeLong, getRelativeTime, getLocaleFromLang } from "@/lib/dateUtils";

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

  // ============================================
  // STATE
  // ============================================

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [forcePasswordReset, setForcePasswordReset] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    email: "",
    roleId: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    designation: "",
    address: "",
    organization: "",
  });

  // Dialogs
  const resetPasswordDialog = useDialog();
  const toggleStatusDialog = useDialog();
  const deleteDialog = useDialog();

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

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        roleId: user.role?.id?.toString() || "",
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        phoneNumber: user.profile?.phoneNumber || "",
        designation: user.profile?.designation || "",
        address: user.profile?.address || "",
        organization: user.profile?.organization || "",
      });
    }
  }, [user]);

  // Role options
  const roleOptions = (roles || []).filter((r) => r.isActive).map((role) => ({
    value: role.id.toString(),
    label: role.description || role.name,
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
        address: formData.address,
        organization: formData.organization,
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

  // ============================================
  // HANDLERS
  // ============================================

  const handleBack = () => onNavigate(isEnglish ? "/en/users" : "/usuarios");

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
        address: user.profile?.address || "",
        organization: user.profile?.organization || "",
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

  // ============================================
  // LOADING & ERROR
  // ============================================

  if (isLoading) {
    return (
      <div className="user-detail__loading">
        <SpinnerGap size={32} className="animate-spin" style={{ color: "var(--color-grey-400)" }} />
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
              )}
            </>
          )}
        </div>
      </div>

      {/* User Card */}
      <div className="user-detail__user-card">
        <div className="user-detail__user-info">
          <UserAvatar user={user} size="xl" />
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
              {user.profile?.organization && (
                <div className="user-detail__user-meta-item">
                  <Buildings size={14} />
                  {user.profile.organization}
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
          <span className="user-detail__verification-label">
            {t("users.detail.verified_label", "Verificado")}
          </span>
          <UserVerificationBadge isVerified={user.isVerified} showLabel={false} size="md" />
          <div className="user-detail__last-access">
            <span className="user-detail__verification-label">
              {t("users.detail.last_access_label", "Último Acceso")}
            </span>
            <div className="user-detail__last-access-value">
              {user.lastLoginAt ? getRelativeTime(user.lastLoginAt, locale) : t("users.detail.never", "Nunca")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="user-detail__layout">
        {/* Left: Content with tabs */}
        <div className="user-detail__main">
          {/* Tabs */}
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
                forcePasswordReset={forcePasswordReset}
                onForcePasswordResetChange={setForcePasswordReset}
                onResetPassword={() => resetPasswordDialog.open()}
                onDeleteUser={() => deleteDialog.open()}
              />
            )}
          </div>

          <div role="tabpanel" id="panel-activity" hidden={activeTab !== "activity"}>
            {activeTab === "activity" && (
              <UserActivityTab
                userId={userId}
                activityLogs={[]} // TODO: Connect to real API
              />
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
                    {user.role?.description || user.role?.name || t("users.no_role", "Sin rol")}
                  </div>
                  <div className="user-detail__role-desc">
                    {t("users.detail.current_role_desc", "Rol asignado actualmente")}
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
                {formatDateTimeLong(user.createdAt, locale)}
              </span>
            </div>
            <div className="user-detail__metadata-row">
              <span className="user-detail__metadata-label">
                {t("users.detail.last_ip", "Última IP")}
              </span>
              <span className="user-detail__metadata-value user-detail__metadata-value--mono">
                {user.lastLoginIp || "—"}
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
          ? t("users.detail.deactivate_desc", `¿Desactivar a ${fullName}? No podrá acceder al sistema.`)
          : t("users.detail.activate_desc", `¿Activar a ${fullName}? Podrá acceder al sistema.`)}
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
        description={t("users.detail.delete_desc", `¿Estás seguro de eliminar a ${fullName}? Esta acción no se puede deshacer.`)}
        confirmText={t("common.delete", "Eliminar")}
        cancelText={t("common.cancel", "Cancelar")}
        variant="danger"
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
};

export default UserDetailView;
