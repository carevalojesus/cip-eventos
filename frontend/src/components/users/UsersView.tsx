import React, { useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Hooks
import { useDialog } from "@/hooks/useDialog";
import { usePagination } from "@/hooks/usePagination";

// Components
import { ConfirmDialog } from "@/components/ui/rui-confirm-dialog";
import { TablePagination } from "@/components/ui/rui";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { ResetPasswordModal } from "./ResetPasswordModal";
import {
  UserPageHeader,
  UserFilters,
  UserTable,
  UserEmptyState,
  UserBulkActions,
  type UserAction,
  type BulkAction,
} from "./components";

// Services & Utils
import {
  usersService,
  rolesService,
  type User,
  type Role,
} from "@/services/users.service";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/constants/roles";
import { getFullName, sortUsersByStatus } from "@/lib/userUtils";
import { getRelativeTime, getLocaleFromLang } from "@/lib/dateUtils";

interface UsersViewProps {
  onNavigate: (path: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const UsersView: React.FC<UsersViewProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith("en");
  const locale = getLocaleFromLang(isEnglish ? "en" : "es");

  // Auth state
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  // Data state
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedVerification, setSelectedVerification] = React.useState("all");

  // Selection state
  const [selectedUsers, setSelectedUsers] = React.useState<Set<string>>(new Set());

  // Dialog states using useDialog hook
  const deleteDialog = useDialog<User>();
  const activateDialog = useDialog<User>();
  const resendVerificationDialog = useDialog<User>();
  const resetPasswordDialog = useDialog<User>();

  // Bulk action dialog
  const bulkActionDialog = useDialog<{ action: BulkAction; userIds: string[] }>();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, rolesData] = await Promise.all([
          usersService.findAll(isSuperAdmin),
          rolesService.findAll(),
        ]);
        setUsers(sortUsersByStatus(usersData));
        setRoles(rolesData.filter((r) => r.isActive));
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error(t("users.list.error_loading", "Error al cargar usuarios"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t, isSuperAdmin]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = getFullName(user);
      const matchesSearch =
        searchQuery === "" ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fullName && fullName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        selectedRole === "all" || user.role?.id?.toString() === selectedRole;

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && user.isActive) ||
        (selectedStatus === "inactive" && !user.isActive);

      const matchesVerification =
        selectedVerification === "all" ||
        (selectedVerification === "verified" && user.isVerified) ||
        (selectedVerification === "unverified" && !user.isVerified);

      return matchesSearch && matchesRole && matchesStatus && matchesVerification;
    });
  }, [users, searchQuery, selectedRole, selectedStatus, selectedVerification]);

  // Pagination
  const pagination = usePagination({
    items: filteredUsers,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Reset page when filters change
  useEffect(() => {
    pagination.setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedStatus, selectedVerification]);

  // Check if filters are active
  const hasActiveFilters = searchQuery !== "" || selectedRole !== "all" || selectedStatus !== "all" || selectedVerification !== "all";

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setSelectedVerification("all");
  }, []);

  // Export users to CSV
  const handleExportUsers = useCallback(() => {
    const headers = ["Nombre", "Email", "Rol", "Estado", "Verificado", "Último acceso"];
    const rows = filteredUsers.map((user) => [
      getFullName(user) || "-",
      user.email,
      user.role?.name || "-",
      user.isActive ? "Activo" : "Inactivo",
      user.isVerified ? "Sí" : "No",
      user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usuarios_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(t("users.list.export_success", "Lista exportada correctamente"));
  }, [filteredUsers, t]);

  // Navigation handlers
  const handleCreateUser = useCallback(() => {
    const path = isEnglish ? "/en/users/new" : "/usuarios/nuevo";
    onNavigate(path);
  }, [isEnglish, onNavigate]);

  const handleViewUser = useCallback((userId: string) => {
    const path = isEnglish ? `/en/users/${userId}` : `/usuarios/${userId}`;
    onNavigate(path);
  }, [isEnglish, onNavigate]);

  // Action handlers
  const handleAction = useCallback((action: UserAction, user: User) => {
    switch (action) {
      case "edit":
      case "changeRole":
        toast.info(t("sections.coming_soon", "Próximamente"));
        break;
      case "delete":
        deleteDialog.open(user);
        break;
      case "activate":
        activateDialog.open(user);
        break;
      case "resendVerification":
        resendVerificationDialog.open(user);
        break;
      case "resetPassword":
        resetPasswordDialog.open(user);
        break;
    }
  }, [deleteDialog, activateDialog, resendVerificationDialog, resetPasswordDialog, t]);

  // Bulk action handler
  const handleBulkAction = useCallback((action: BulkAction) => {
    const userIds = Array.from(selectedUsers);
    if (userIds.length === 0) return;
    bulkActionDialog.open({ action, userIds });
  }, [selectedUsers, bulkActionDialog]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedUsers(new Set());
  }, []);

  // Confirm bulk action
  const handleConfirmBulkAction = async () => {
    if (!bulkActionDialog.data) return;

    const { action, userIds } = bulkActionDialog.data;
    bulkActionDialog.setLoading(true);

    try {
      switch (action) {
        case "activate":
          await Promise.all(userIds.map((id) => usersService.update(id, { isActive: true })));
          setUsers((prev) =>
            sortUsersByStatus(
              prev.map((u) => (userIds.includes(u.id) ? { ...u, isActive: true } : u))
            )
          );
          toast.success(t("users.bulk_actions.activate_success", "Usuarios activados correctamente"));
          break;

        case "deactivate":
          await Promise.all(userIds.map((id) => usersService.update(id, { isActive: false })));
          setUsers((prev) =>
            sortUsersByStatus(
              prev.map((u) => (userIds.includes(u.id) ? { ...u, isActive: false } : u))
            )
          );
          toast.success(t("users.bulk_actions.deactivate_success", "Usuarios desactivados correctamente"));
          break;

        case "delete":
          await Promise.all(userIds.map((id) => usersService.remove(id)));
          if (isSuperAdmin) {
            setUsers((prev) =>
              sortUsersByStatus(
                prev.map((u) => (userIds.includes(u.id) ? { ...u, isActive: false } : u))
              )
            );
          } else {
            setUsers((prev) => prev.filter((u) => !userIds.includes(u.id)));
          }
          toast.success(t("users.bulk_actions.delete_success", "Usuarios eliminados correctamente"));
          break;

        case "resendVerification":
          const unverifiedUsers = users.filter((u) => userIds.includes(u.id) && !u.isVerified);
          await Promise.all(unverifiedUsers.map((u) => usersService.resendVerificationEmail(u.email)));
          toast.success(t("users.bulk_actions.resend_success", "Correos de verificación enviados"));
          break;
      }

      setSelectedUsers(new Set());
      bulkActionDialog.reset();
    } catch (error) {
      console.error("Error in bulk action:", error);
      toast.error(t("users.bulk_actions.error", "Error al realizar la acción"));
      bulkActionDialog.setLoading(false);
    }
  };

  // Get bulk action dialog info
  const getBulkActionDialogInfo = () => {
    if (!bulkActionDialog.data) return { title: "", description: "", variant: "default" as const };

    const { action, userIds } = bulkActionDialog.data;
    const count = userIds.length;

    switch (action) {
      case "activate":
        return {
          title: t("users.bulk_actions.confirm_activate_title", "Activar usuarios"),
          description: t("users.bulk_actions.confirm_activate_description", {
            count,
            defaultValue: `¿Estás seguro de que deseas activar ${count} usuario(s)?`,
          }),
          variant: "success" as const,
          confirmText: t("users.bulk_actions.activate", "Activar"),
        };
      case "deactivate":
        return {
          title: t("users.bulk_actions.confirm_deactivate_title", "Desactivar usuarios"),
          description: t("users.bulk_actions.confirm_deactivate_description", {
            count,
            defaultValue: `¿Estás seguro de que deseas desactivar ${count} usuario(s)?`,
          }),
          variant: "warning" as const,
          confirmText: t("users.bulk_actions.deactivate", "Desactivar"),
        };
      case "delete":
        return {
          title: t("users.bulk_actions.confirm_delete_title", "Eliminar usuarios"),
          description: t("users.bulk_actions.confirm_delete_description", {
            count,
            defaultValue: `¿Estás seguro de que deseas eliminar ${count} usuario(s)? Esta acción no se puede deshacer.`,
          }),
          variant: "danger" as const,
          confirmText: t("users.bulk_actions.delete", "Eliminar"),
        };
      case "resendVerification":
        return {
          title: t("users.bulk_actions.confirm_resend_title", "Reenviar verificación"),
          description: t("users.bulk_actions.confirm_resend_description", {
            count,
            defaultValue: `¿Deseas reenviar el correo de verificación a ${count} usuario(s)?`,
          }),
          variant: "info" as const,
          confirmText: t("users.bulk_actions.resend_verification", "Enviar"),
        };
      default:
        return { title: "", description: "", variant: "default" as const, confirmText: "" };
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteDialog.data) return;

    deleteDialog.setLoading(true);
    try {
      await usersService.remove(deleteDialog.data.id);

      if (isSuperAdmin) {
        setUsers((prev) =>
          sortUsersByStatus(
            prev.map((u) =>
              u.id === deleteDialog.data?.id ? { ...u, isActive: false } : u
            )
          )
        );
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.data?.id));
      }

      toast.success(t("users.list.delete.success", "Usuario desactivado correctamente"));
      deleteDialog.reset();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(t("users.list.delete.error", "Error al eliminar el usuario"));
      deleteDialog.setLoading(false);
    }
  };

  // Confirm activate
  const handleConfirmActivate = async () => {
    if (!activateDialog.data) return;

    activateDialog.setLoading(true);
    try {
      const updatedUser = await usersService.update(activateDialog.data.id, { isActive: true });

      setUsers((prev) =>
        sortUsersByStatus(
          prev.map((u) =>
            u.id === activateDialog.data?.id ? { ...u, isActive: updatedUser.isActive } : u
          )
        )
      );

      toast.success(t("users.list.toggle_status.activate_success", "Usuario activado correctamente"));
      activateDialog.reset();
    } catch (error) {
      console.error("Error activating user:", error);
      toast.error(t("users.list.toggle_status.error", "Error al activar el usuario"));
      activateDialog.setLoading(false);
    }
  };

  // Confirm resend verification
  const handleConfirmResendVerification = async () => {
    if (!resendVerificationDialog.data) return;

    resendVerificationDialog.setLoading(true);
    try {
      await usersService.resendVerificationEmail(resendVerificationDialog.data.email);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === resendVerificationDialog.data?.id
            ? { ...u, verificationEmailSentAt: new Date().toISOString() }
            : u
        )
      );

      toast.success(t("users.list.resend_verification.success", "Correo de verificación enviado"));
      resendVerificationDialog.reset();
    } catch (error: unknown) {
      console.error("Error resending verification:", error);
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 429) {
        toast.error(t("users.list.resend_verification.throttle", "Debes esperar antes de enviar otro correo"));
      } else {
        toast.error(t("users.list.resend_verification.error", "Error al enviar el correo de verificación"));
      }
      resendVerificationDialog.setLoading(false);
    }
  };

  // Reset password handlers
  const handleSendResetLink = async () => {
    if (!resetPasswordDialog.data) return;

    resetPasswordDialog.setLoading(true);
    try {
      await usersService.adminResetPassword(resetPasswordDialog.data.email);
      toast.success(t("users.list.reset_password.link_success", "Se ha enviado un correo con el enlace de restablecimiento"));
      resetPasswordDialog.reset();
    } catch (error) {
      console.error("Error sending reset password email:", error);
      toast.error(t("users.list.reset_password.error", "Error al enviar el correo de restablecimiento"));
      resetPasswordDialog.setLoading(false);
    }
  };

  const handleSetPassword = async (password: string) => {
    if (!resetPasswordDialog.data) return;

    resetPasswordDialog.setLoading(true);
    try {
      await usersService.adminSetPassword(resetPasswordDialog.data.email, password);
      toast.success(t("users.list.reset_password.password_success", "Contraseña establecida y enviada al usuario"));
      resetPasswordDialog.reset();
    } catch (error) {
      console.error("Error setting password:", error);
      toast.error(t("users.list.reset_password.error", "Error al establecer la contraseña"));
      resetPasswordDialog.setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingState message={t("common.loading", "Cargando...")} />;
  }

  const containerStyle: React.CSSProperties = {
    padding: "var(--space-6)",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <UserPageHeader onCreateUser={handleCreateUser} />

      {/* Filters */}
      <UserFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedVerification={selectedVerification}
        onVerificationChange={setSelectedVerification}
        roles={roles}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onExport={handleExportUsers}
      />

      {/* Bulk Actions Bar */}
      <UserBulkActions
        selectedCount={selectedUsers.size}
        onAction={handleBulkAction}
        onClearSelection={handleClearSelection}
      />

      {/* Table or Empty State */}
      {filteredUsers.length === 0 ? (
        <UserEmptyState hasFilters={hasActiveFilters} onCreateUser={handleCreateUser} />
      ) : (
        <>
          <UserTable
            users={pagination.paginatedItems}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
            onUserClick={handleViewUser}
            onAction={handleAction}
          />
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            pageNumbers={pagination.pageNumbers}
            onPageChange={pagination.setCurrentPage}
            onNextPage={pagination.goToNextPage}
            onPrevPage={pagination.goToPrevPage}
            isFirstPage={pagination.isFirstPage}
            isLastPage={pagination.isLastPage}
            itemLabel={t("users.list.pagination.users", "usuarios")}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={handleConfirmDelete}
        title={t("users.list.delete.title", "Eliminar usuario")}
        description={
          deleteDialog.data
            ? t("users.list.delete.description", {
                name: getFullName(deleteDialog.data) || deleteDialog.data.email,
              })
            : ""
        }
        confirmText={t("users.list.delete.confirm", "Eliminar")}
        cancelText={t("users.list.delete.cancel", "Cancelar")}
        variant="danger"
        isLoading={deleteDialog.isLoading}
      />

      {/* Activate User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={activateDialog.isOpen}
        onClose={activateDialog.close}
        onConfirm={handleConfirmActivate}
        title={t("users.list.toggle_status.activate_title", "Activar usuario")}
        description={
          activateDialog.data
            ? t("users.list.toggle_status.activate_description", {
                name: getFullName(activateDialog.data) || activateDialog.data.email,
              })
            : ""
        }
        confirmText={t("users.list.toggle_status.activate_confirm", "Activar")}
        cancelText={t("users.list.toggle_status.cancel", "Cancelar")}
        variant="success"
        isLoading={activateDialog.isLoading}
      />

      {/* Resend Verification Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resendVerificationDialog.isOpen}
        onClose={resendVerificationDialog.close}
        onConfirm={handleConfirmResendVerification}
        title={t("users.list.resend_verification.title", "Reenviar correo de verificación")}
        description={
          resendVerificationDialog.data
            ? resendVerificationDialog.data.verificationEmailSentAt
              ? t("users.list.resend_verification.description_with_time", {
                  email: resendVerificationDialog.data.email,
                  time: getRelativeTime(resendVerificationDialog.data.verificationEmailSentAt, locale),
                })
              : t("users.list.resend_verification.description", {
                  email: resendVerificationDialog.data.email,
                })
            : ""
        }
        confirmText={t("users.list.resend_verification.confirm", "Enviar correo")}
        cancelText={t("users.list.resend_verification.cancel", "Cancelar")}
        variant="info"
        isLoading={resendVerificationDialog.isLoading}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetPasswordDialog.isOpen}
        onClose={resetPasswordDialog.close}
        userEmail={resetPasswordDialog.data?.email || ""}
        userName={resetPasswordDialog.data ? getFullName(resetPasswordDialog.data) : null}
        onSendResetLink={handleSendResetLink}
        onSetPassword={handleSetPassword}
        isLoading={resetPasswordDialog.isLoading}
      />

      {/* Bulk Action Confirmation Dialog */}
      {(() => {
        const dialogInfo = getBulkActionDialogInfo();
        return (
          <ConfirmDialog
            isOpen={bulkActionDialog.isOpen}
            onClose={bulkActionDialog.close}
            onConfirm={handleConfirmBulkAction}
            title={dialogInfo.title}
            description={dialogInfo.description}
            confirmText={dialogInfo.confirmText}
            cancelText={t("common.cancel", "Cancelar")}
            variant={dialogInfo.variant}
            isLoading={bulkActionDialog.isLoading}
          />
        );
      })()}
    </div>
  );
};

export default UsersView;
