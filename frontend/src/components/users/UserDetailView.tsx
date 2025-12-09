/**
 * UserDetailView Component
 *
 * Vista de detalle de usuario con:
 * - Header con avatar, nombre, estado y verificación
 * - Layout de 2 columnas (contenido principal + sidebar)
 * - Tabs: Información Personal, Seguridad y Permisos, Historial de Actividad
 * - Sidebar con Rol del Sistema y Metadatos
 * - Zona de peligro para acciones destructivas
 *
 * Siguiendo el diseño de las capturas de referencia.
 */
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  Key,
  Power,
  User,
  Phone,
  MapPin,
  Briefcase,
  At,
  Shield,
  ShieldCheck,
  SpinnerGap,
  ShieldWarning,
  EnvelopeSimple,
  CheckCircle,
  Clock,
  Trash,
  FloppyDisk,
  Buildings,
  Globe,
  ArrowClockwise,
} from "@phosphor-icons/react";

// Components
import { Input } from "@/components/ui/rui-input";
import { FormSelect } from "@/components/ui/rui/form";
import { Button } from "@/components/ui/rui-button";
import { ConfirmDialog } from "@/components/ui/rui-confirm-dialog";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { UserStatusBadge, UserVerificationBadge, UserAvatar } from "./components";

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

  // ============================================
  // STYLES
  // ============================================

  const containerStyle: React.CSSProperties = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "var(--space-6)",
  };

  const backButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "0",
    marginBottom: "var(--space-4)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 150ms ease",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "var(--space-6)",
    gap: "var(--space-4)",
    flexWrap: "wrap",
  };

  const headerTitleStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-2xl)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    margin: 0,
  };

  const pageSubtitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
    margin: 0,
  };

  const headerActionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  };

  // User card (header card with avatar)
  const userCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
    padding: "var(--space-5)",
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    marginBottom: "var(--space-6)",
  };

  const userInfoContainerStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
  };

  const userDetailsStyle: React.CSSProperties = {
    flex: 1,
  };

  const userNameStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    marginBottom: "var(--space-1)",
  };

  const userNameTextStyle: React.CSSProperties = {
    fontSize: "var(--font-size-lg)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
  };

  const userMetaStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
    flexWrap: "wrap",
  };

  const userMetaItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-1)",
  };

  const verificationSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "var(--space-1)",
    textAlign: "right",
  };

  const verificationLabelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    fontWeight: 500,
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  // Main content layout
  const mainLayoutStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: "var(--space-6)",
  };

  const mainContentStyle: React.CSSProperties = {
    minWidth: 0,
  };

  const sidebarStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
  };

  // Tabs
  const tabsContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--space-1)",
    borderBottom: "1px solid var(--color-grey-200)",
    marginBottom: "var(--space-6)",
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "var(--space-3) var(--space-4)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: isActive ? "var(--color-red-600)" : "var(--color-text-muted)",
    background: "none",
    border: "none",
    borderBottom: isActive ? "2px solid var(--color-red-500)" : "2px solid transparent",
    marginBottom: "-1px",
    cursor: "pointer",
    transition: "all 150ms ease",
  });

  // Card styles
  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-5)",
    marginBottom: "var(--space-4)",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-base)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    marginBottom: "var(--space-4)",
  };

  const formGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--space-4)",
  };

  // Sidebar card
  const sidebarCardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-grey-200)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-4)",
  };

  const sidebarTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    fontWeight: 600,
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "var(--space-3)",
  };

  const roleCardStyle = (isSelected: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    padding: "var(--space-3)",
    borderRadius: "var(--radius-md)",
    border: isSelected ? "1px solid var(--color-red-200)" : "1px solid var(--color-grey-200)",
    backgroundColor: isSelected ? "var(--color-red-050)" : "var(--color-bg-primary)",
    marginBottom: "var(--space-2)",
    cursor: "default",
  });

  const roleIconStyle = (isSelected: boolean): React.CSSProperties => ({
    width: "32px",
    height: "32px",
    borderRadius: "var(--radius-md)",
    backgroundColor: isSelected ? "var(--color-red-100)" : "var(--color-grey-100)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: isSelected ? "var(--color-red-600)" : "var(--color-grey-500)",
  });

  const metadataRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "var(--space-2) 0",
    borderBottom: "1px solid var(--color-grey-100)",
  };

  const metadataLabelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
  };

  const metadataValueStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: "var(--color-text-primary)",
  };

  // Security section
  const securityItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--space-4)",
    backgroundColor: "var(--color-grey-050)",
    borderRadius: "var(--radius-md)",
    marginBottom: "var(--space-3)",
  };

  const securityItemLeftStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  };

  const securityIconStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--color-bg-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-grey-500)",
  };

  const dangerZoneStyle: React.CSSProperties = {
    marginTop: "var(--space-6)",
    paddingTop: "var(--space-4)",
    borderTop: "1px solid var(--color-grey-200)",
  };

  const dangerTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 600,
    color: "var(--color-red-600)",
    marginBottom: "var(--space-3)",
  };

  const dangerItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--space-3)",
    backgroundColor: "var(--color-red-050)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-red-100)",
  };

  // Activity log
  const activityItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "var(--space-3)",
    padding: "var(--space-3) 0",
    borderBottom: "1px solid var(--color-grey-100)",
  };

  const activityIconStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--color-cyan-100)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-cyan-600)",
    flexShrink: 0,
  };

  // ============================================
  // LOADING & ERROR
  // ============================================

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <SpinnerGap size={32} style={{ animation: "spin 1s linear infinite", color: "var(--color-grey-400)" }} />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem", gap: "16px" }}>
        <ShieldWarning size={48} color="var(--color-red-400)" />
        <p style={{ color: "var(--color-red-600)" }}>{t("users.detail.error", "Error al cargar el usuario")}</p>
        <Button variant="secondary" onClick={handleBack}>{t("common.back", "Volver")}</Button>
      </div>
    );
  }

  const fullName = getDisplayName(user);
  const currentRole = roles?.find((r) => r.id === user.role?.id);

  // ============================================
  // RENDER TABS CONTENT
  // ============================================

  const renderPersonalTab = () => (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>
        {t("users.detail.general_data", "Datos Generales")}
      </h3>
      <div style={formGridStyle}>
        <Input
          label={t("users.field.firstName", "Nombres")}
          value={formData.firstName}
          onChange={(e) => handleFormChange("firstName", e.target.value)}
          placeholder={t("users.placeholder.firstName", "Nombre")}
          leftIcon={<User size={16} />}
          disabled={!isEditing}
        />
        <Input
          label={t("users.field.lastName", "Apellidos")}
          value={formData.lastName}
          onChange={(e) => handleFormChange("lastName", e.target.value)}
          placeholder={t("users.placeholder.lastName", "Apellido")}
          leftIcon={<User size={16} />}
          disabled={!isEditing}
        />
        <Input
          label={t("users.field.email", "Correo Electrónico")}
          type="email"
          value={formData.email}
          onChange={(e) => handleFormChange("email", e.target.value)}
          placeholder={t("users.placeholder.email", "usuario@ejemplo.com")}
          leftIcon={<EnvelopeSimple size={16} />}
          disabled={!isEditing}
        />
        <Input
          label={t("users.field.phone", "Teléfono")}
          value={formData.phoneNumber}
          onChange={(e) => handleFormChange("phoneNumber", e.target.value)}
          placeholder={t("users.placeholder.phone", "+51 987 654 321")}
          leftIcon={<Phone size={16} />}
          disabled={!isEditing}
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <Input
            label={t("users.field.organization", "Organización / Colegio")}
            value={formData.organization}
            onChange={(e) => handleFormChange("organization", e.target.value)}
            placeholder={t("users.placeholder.organization", "CIP Lima")}
            leftIcon={<Buildings size={16} />}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <>
      {/* Security Card */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>
          {t("users.detail.account_security", "Seguridad de la Cuenta")}
        </h3>

        {/* Password */}
        <div style={securityItemStyle}>
          <div style={securityItemLeftStyle}>
            <div style={securityIconStyle}>
              <Key size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                {t("users.detail.password", "Contraseña")}
              </div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                {t("users.detail.password_last_change", "Último cambio hace 3 meses")}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => resetPasswordDialog.open()}>
            {t("users.detail.change_password", "Cambiar contraseña")}
          </Button>
        </div>

        {/* Force Reset */}
        <div style={securityItemStyle}>
          <div style={securityItemLeftStyle}>
            <div style={securityIconStyle}>
              <ArrowClockwise size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                {t("users.detail.reset_access", "Restablecer Accesos")}
              </div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                {t("users.detail.reset_access_desc", "Forzar cambio de contraseña en próximo inicio")}
              </div>
            </div>
          </div>
          {/* Toggle switch placeholder */}
          <div style={{
            width: "44px",
            height: "24px",
            borderRadius: "12px",
            backgroundColor: "var(--color-grey-200)",
            cursor: "pointer",
          }} />
        </div>

        {/* Danger Zone */}
        {isSuperAdmin && (
          <div style={dangerZoneStyle}>
            <h4 style={dangerTitleStyle}>
              {t("users.detail.danger_zone", "Zona de Peligro")}
            </h4>
            <div style={dangerItemStyle}>
              <div>
                <div style={{ fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                  {t("users.detail.delete_user", "Eliminar usuario")}
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  {t("users.detail.delete_warning", "Esta acción no se puede deshacer.")}
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => deleteDialog.open()}>
                <Trash size={16} />
                {t("common.delete", "Eliminar")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderActivityTab = () => (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>
        {t("users.detail.activity_log", "Registro de Actividad")}
      </h3>
      {/* Mock activity items */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={activityItemStyle}>
          <div style={activityIconStyle}>
            <Globe size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
              {t("users.detail.login_success", "Inicio de sesión exitoso")}
            </div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              IP: 192.168.1.{10 + i} • Navegador Chrome en Windows
            </div>
          </div>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
            Hace {i}h
          </div>
        </div>
      ))}
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div style={containerStyle}>
      {/* Back button */}
      <button
        type="button"
        style={backButtonStyle}
        onClick={handleBack}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
      >
        <ArrowLeft size={16} />
        {t("users.detail.back_to_list", "Volver a la lista")}
      </button>

      {/* Page Header */}
      <div style={headerStyle}>
        <div style={headerTitleStyle}>
          <h1 style={pageTitleStyle}>
            {t("users.detail.title", "Detalles del Usuario")}
          </h1>
          <p style={pageSubtitleStyle}>
            {t("users.detail.subtitle", "Visualiza y edita la información completa de")} {formData.firstName || fullName}.
          </p>
        </div>
        <div style={headerActionsStyle}>
          {isSuperAdmin && (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => toggleStatusDialog.open()}
              >
                {user.isActive
                  ? t("users.detail.deactivate_account", "Desactivar Cuenta")
                  : t("users.detail.activate_account", "Activar Cuenta")}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => isEditing ? updateMutation.mutate() : setIsEditing(true)}
                isLoading={updateMutation.isPending}
              >
                <FloppyDisk size={18} />
                {isEditing
                  ? t("users.detail.save_changes", "Guardar Cambios")
                  : t("common.edit", "Editar")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* User Card */}
      <div style={userCardStyle}>
        <div style={userInfoContainerStyle}>
          <UserAvatar user={user} size="xl" />
          <div style={userDetailsStyle}>
            <div style={userNameStyle}>
              <span style={userNameTextStyle}>{fullName}</span>
              <UserStatusBadge isActive={user.isActive} size="sm" />
            </div>
            <div style={userMetaStyle}>
              <div style={userMetaItemStyle}>
                <EnvelopeSimple size={14} />
                {user.email}
              </div>
              {user.profile?.organization && (
                <div style={userMetaItemStyle}>
                  <Buildings size={14} />
                  {user.profile.organization}
                </div>
              )}
              <div style={userMetaItemStyle}>
                <Shield size={14} />
                {user.role?.description || user.role?.name}
              </div>
            </div>
          </div>
        </div>
        <div style={verificationSectionStyle}>
          <span style={verificationLabelStyle}>
            {t("users.detail.verified_label", "Verificado")}
          </span>
          <UserVerificationBadge isVerified={user.isVerified} showLabel={false} size="md" />
          <div style={{ marginTop: "var(--space-2)" }}>
            <span style={verificationLabelStyle}>
              {t("users.detail.last_access_label", "Último Acceso")}
            </span>
            <div style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: "var(--font-size-sm)" }}>
              {user.lastLoginAt ? getRelativeTime(user.lastLoginAt, locale) : t("users.detail.never", "Nunca")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={mainLayoutStyle}>
        {/* Left: Content with tabs */}
        <div style={mainContentStyle}>
          {/* Tabs */}
          <div style={tabsContainerStyle}>
            <button
              type="button"
              style={getTabStyle(activeTab === "personal")}
              onClick={() => setActiveTab("personal")}
            >
              {t("users.detail.tab_personal", "Información Personal")}
            </button>
            <button
              type="button"
              style={getTabStyle(activeTab === "security")}
              onClick={() => setActiveTab("security")}
            >
              {t("users.detail.tab_security", "Seguridad y Permisos")}
            </button>
            <button
              type="button"
              style={getTabStyle(activeTab === "activity")}
              onClick={() => setActiveTab("activity")}
            >
              {t("users.detail.tab_activity", "Historial de Actividad")}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "personal" && renderPersonalTab()}
          {activeTab === "security" && renderSecurityTab()}
          {activeTab === "activity" && renderActivityTab()}
        </div>

        {/* Right: Sidebar */}
        <div style={sidebarStyle}>
          {/* Role Card - Solo muestra el rol actual del usuario */}
          <div style={sidebarCardStyle}>
            <h4 style={sidebarTitleStyle}>
              {t("users.detail.system_role", "Rol del Sistema")}
            </h4>

            {/* Rol actual del usuario */}
            <div style={roleCardStyle(true)}>
              <div style={roleIconStyle(true)}>
                <ShieldCheck size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 500,
                  color: "var(--color-red-700)",
                  fontSize: "var(--font-size-sm)",
                }}>
                  {user.role?.description || user.role?.name || t("users.no_role", "Sin rol")}
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  {t("users.detail.current_role_desc", "Rol asignado actualmente")}
                </div>
              </div>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--color-red-500)",
              }} />
            </div>
          </div>

          {/* Metadata Card */}
          <div style={sidebarCardStyle}>
            <h4 style={sidebarTitleStyle}>
              {t("users.detail.metadata", "Metadatos")}
            </h4>
            <div style={metadataRowStyle}>
              <span style={metadataLabelStyle}>{t("users.detail.user_id", "ID Usuario")}</span>
              <span style={{ ...metadataValueStyle, fontFamily: "monospace", fontSize: "var(--font-size-xs)" }}>
                USR-{user.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div style={metadataRowStyle}>
              <span style={metadataLabelStyle}>{t("users.detail.registered", "Registrado")}</span>
              <span style={metadataValueStyle}>
                {formatDateTimeLong(user.createdAt, locale)}
              </span>
            </div>
            <div style={{ ...metadataRowStyle, borderBottom: "none" }}>
              <span style={metadataLabelStyle}>{t("users.detail.last_ip", "Última IP")}</span>
              <span style={{ ...metadataValueStyle, fontFamily: "monospace" }}>
                {user.lastLoginIp || "—"}
              </span>
            </div>
          </div>
        </div>
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
        onConfirm={() => {
          deleteDialog.setLoading(true);
          usersService.remove(userId).then(() => {
            toast.success(t("users.detail.deleted", "Usuario eliminado"));
            handleBack();
          }).catch(() => {
            toast.error(t("users.detail.delete_error", "Error al eliminar"));
            deleteDialog.setLoading(false);
          });
        }}
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
