import React, { useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    MagnifyingGlass,
    CaretLeft,
    CaretRight,
    DotsThree,
    PencilSimple,
    Trash,
    UserGear,
    CheckCircle,
    XCircle,
    Key,
    Plus,
    EnvelopeSimple,
    UserPlus,
    Power,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/rui-button";
import { ConfirmDialog } from "@/components/ui/rui-confirm-dialog";
import {
    usersService,
    rolesService,
    type User,
    type Role,
} from "@/services/users.service";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/constants/roles";

interface UsersViewProps {
    onNavigate: (path: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const UsersView: React.FC<UsersViewProps> = ({ onNavigate }) => {
    const { t, i18n } = useTranslation();
    const isEnglish = i18n.language?.startsWith("en");

    // Get current user from auth store
    const currentUser = useAuthStore((state) => state.user);
    const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

    // Data state
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        user: User | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        user: null,
        isLoading: false,
    });

    // Toggle status dialog state
    const [toggleStatusDialog, setToggleStatusDialog] = useState<{
        isOpen: boolean;
        user: User | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        user: null,
        isLoading: false,
    });

    // Resend verification dialog state
    const [resendVerificationDialog, setResendVerificationDialog] = useState<{
        isOpen: boolean;
        user: User | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        user: null,
        isLoading: false,
    });

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [usersData, rolesData] = await Promise.all([
                    // SUPER_ADMIN puede ver usuarios inactivos
                    usersService.findAll(isSuperAdmin),
                    rolesService.findAll(),
                ]);
                setUsers(usersData);
                setRoles(rolesData.filter((r) => r.isActive));
            } catch (err) {
                console.error("Error fetching data:", err);
                toast.error(
                    t("users.list.error_loading", "Error al cargar usuarios")
                );
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [t, isSuperAdmin]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to get full name from user
    const getFullName = (user: User): string | null => {
        if (user.profile?.firstName || user.profile?.lastName) {
            return `${user.profile.firstName || ""} ${
                user.profile.lastName || ""
            }`.trim();
        }
        return user.name || null;
    };

    // Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            // Search filter - search in email, name, and profile names
            const fullName = getFullName(user);
            const matchesSearch =
                searchQuery === "" ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (fullName &&
                    fullName.toLowerCase().includes(searchQuery.toLowerCase()));

            // Role filter
            const matchesRole =
                selectedRole === "all" ||
                user.role?.id?.toString() === selectedRole;

            // Status filter
            const matchesStatus =
                selectedStatus === "all" ||
                (selectedStatus === "active" && user.isActive) ||
                (selectedStatus === "inactive" && !user.isActive);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, selectedRole, selectedStatus]);

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRole, selectedStatus]);

    const handleCreateUser = () => {
        const path = isEnglish ? "/en/users/new" : "/usuarios/nuevo";
        onNavigate(path);
    };

    const handleEditUser = (userId: string) => {
        setOpenDropdown(null);
        // TODO: Navigate to edit user
        toast.info(t("sections.coming_soon", "Próximamente"));
    };

    const handleDeleteUser = (user: User) => {
        setOpenDropdown(null);
        setDeleteDialog({
            isOpen: true,
            user,
            isLoading: false,
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.user) return;

        setDeleteDialog((prev) => ({ ...prev, isLoading: true }));

        try {
            await usersService.remove(deleteDialog.user.id);

            // Si es SUPER_ADMIN, actualizar el estado a inactivo (soft delete visible)
            // Si no, remover de la lista
            if (isSuperAdmin) {
                setUsers((prevUsers) =>
                    prevUsers.map((u) =>
                        u.id === deleteDialog.user?.id
                            ? { ...u, isActive: false }
                            : u
                    )
                );
            } else {
                setUsers((prevUsers) =>
                    prevUsers.filter((u) => u.id !== deleteDialog.user?.id)
                );
            }

            toast.success(
                t(
                    "users.list.delete.success",
                    "Usuario desactivado correctamente"
                )
            );

            setDeleteDialog({ isOpen: false, user: null, isLoading: false });
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error(
                t("users.list.delete.error", "Error al eliminar el usuario")
            );
            setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
        }
    };

    const handleCloseDeleteDialog = () => {
        if (!deleteDialog.isLoading) {
            setDeleteDialog({ isOpen: false, user: null, isLoading: false });
        }
    };

    const handleToggleStatus = (user: User) => {
        setOpenDropdown(null);
        setToggleStatusDialog({
            isOpen: true,
            user,
            isLoading: false,
        });
    };

    const handleConfirmToggleStatus = async () => {
        if (!toggleStatusDialog.user) return;

        setToggleStatusDialog((prev) => ({ ...prev, isLoading: true }));

        try {
            const updatedUser = await usersService.update(
                toggleStatusDialog.user.id,
                { isActive: true }
            );

            // Update user in local state
            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === toggleStatusDialog.user?.id
                        ? { ...u, isActive: updatedUser.isActive }
                        : u
                )
            );

            toast.success(
                t(
                    "users.list.toggle_status.activate_success",
                    "Usuario activado correctamente"
                )
            );

            setToggleStatusDialog({
                isOpen: false,
                user: null,
                isLoading: false,
            });
        } catch (error) {
            console.error("Error activating user:", error);
            toast.error(
                t(
                    "users.list.toggle_status.error",
                    "Error al activar el usuario"
                )
            );
            setToggleStatusDialog((prev) => ({ ...prev, isLoading: false }));
        }
    };

    const handleCloseToggleStatusDialog = () => {
        if (!toggleStatusDialog.isLoading) {
            setToggleStatusDialog({
                isOpen: false,
                user: null,
                isLoading: false,
            });
        }
    };

    const handleResetPassword = (userId: string) => {
        setOpenDropdown(null);
        // TODO: Implement reset password with confirmation
        toast.info(t("sections.coming_soon", "Próximamente"));
    };

    const handleResendVerification = (user: User) => {
        setOpenDropdown(null);
        setResendVerificationDialog({
            isOpen: true,
            user,
            isLoading: false,
        });
    };

    const handleConfirmResendVerification = async () => {
        if (!resendVerificationDialog.user) return;

        setResendVerificationDialog((prev) => ({ ...prev, isLoading: true }));

        try {
            await usersService.resendVerificationEmail(resendVerificationDialog.user.email);

            // Update local state with new sent time
            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === resendVerificationDialog.user?.id
                        ? { ...u, verificationEmailSentAt: new Date().toISOString() }
                        : u
                )
            );

            toast.success(
                t(
                    "users.list.resend_verification.success",
                    "Correo de verificación enviado"
                )
            );

            setResendVerificationDialog({ isOpen: false, user: null, isLoading: false });
        } catch (error: unknown) {
            console.error("Error resending verification:", error);
            const axiosError = error as { response?: { status?: number } };
            if (axiosError.response?.status === 429) {
                toast.error(
                    t(
                        "users.list.resend_verification.throttle",
                        "Debes esperar antes de enviar otro correo"
                    )
                );
            } else {
                toast.error(
                    t(
                        "users.list.resend_verification.error",
                        "Error al enviar el correo de verificación"
                    )
                );
            }
            setResendVerificationDialog((prev) => ({ ...prev, isLoading: false }));
        }
    };

    const handleCloseResendVerificationDialog = () => {
        if (!resendVerificationDialog.isLoading) {
            setResendVerificationDialog({ isOpen: false, user: null, isLoading: false });
        }
    };

    // Check if verification email was sent recently (within 5 minutes)
    const isVerificationEmailSentRecently = (sentAt: string | null): boolean => {
        if (!sentAt) return false;
        const sentTime = new Date(sentAt).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        return now - sentTime < fiveMinutes;
    };

    // Format time ago for display
    const formatTimeAgo = (dateString: string | null): string => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t("common.time.just_now", "hace un momento");
        if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
        if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
        return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(
            isEnglish ? "en-US" : "es-PE",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
            }
        );
    };

    const getInitials = (user: User): string => {
        // Try profile first
        if (user.profile?.firstName && user.profile?.lastName) {
            return (
                user.profile.firstName[0] + user.profile.lastName[0]
            ).toUpperCase();
        }
        if (user.profile?.firstName) {
            return user.profile.firstName[0].toUpperCase();
        }
        // Fall back to name field
        if (user.name) {
            const parts = user.name.trim().split(" ").filter(Boolean);
            if (parts.length >= 2)
                return (parts[0][0] + parts[1][0]).toUpperCase();
            if (parts.length === 1) return parts[0][0].toUpperCase();
        }
        // Fall back to email
        return user.email[0].toUpperCase();
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString(isEnglish ? "en-US" : "es-PE", {
            timeZone: "America/Lima",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Styles
    const containerStyle: React.CSSProperties = {
        padding: "var(--space-6)",
        maxWidth: "1200px",
        margin: "0 auto",
    };

    const headerStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "var(--space-6)",
        gap: "var(--space-4)",
        flexWrap: "wrap",
    };

    const titleContainerStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
    };

    const titleStyle: React.CSSProperties = {
        fontSize: "var(--font-size-xl)",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        margin: 0,
    };

    const subtitleStyle: React.CSSProperties = {
        fontSize: "var(--font-size-sm)",
        color: "var(--color-text-muted)",
        margin: 0,
    };

    const filtersContainerStyle: React.CSSProperties = {
        display: "flex",
        gap: "var(--space-3)",
        marginBottom: "var(--space-4)",
        flexWrap: "wrap",
        alignItems: "center",
    };

    const searchContainerStyle: React.CSSProperties = {
        position: "relative",
        flex: "1 1 300px",
        maxWidth: "400px",
    };

    const searchInputStyle: React.CSSProperties = {
        width: "100%",
        height: "40px",
        padding: "0 var(--space-4) 0 40px",
        fontSize: "var(--font-size-sm)",
        border: "1px solid var(--color-grey-300)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-bg-primary)",
        outline: "none",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
    };

    const searchIconStyle: React.CSSProperties = {
        position: "absolute",
        left: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--color-grey-400)",
        pointerEvents: "none",
    };

    const selectStyle: React.CSSProperties = {
        height: "40px",
        padding: "0 var(--space-8) 0 var(--space-3)",
        fontSize: "var(--font-size-sm)",
        border: "1px solid var(--color-grey-300)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-bg-primary)",
        cursor: "pointer",
        outline: "none",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
    };

    const tableContainerStyle: React.CSSProperties = {
        backgroundColor: "var(--color-bg-primary)",
        border: "1px solid var(--color-grey-200)",
        borderRadius: "var(--radius-lg)",
        overflow: "visible",
    };

    const tableStyle: React.CSSProperties = {
        width: "100%",
        borderCollapse: "collapse",
    };

    const thStyle: React.CSSProperties = {
        padding: "var(--space-3) var(--space-4)",
        textAlign: "left",
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        color: "var(--color-text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        backgroundColor: "var(--color-grey-050)",
        borderBottom: "1px solid var(--color-grey-200)",
    };

    const tdStyle: React.CSSProperties = {
        padding: "var(--space-4)",
        fontSize: "var(--font-size-sm)",
        color: "var(--color-text-primary)",
        borderBottom: "1px solid var(--color-grey-100)",
    };

    const avatarStyle: React.CSSProperties = {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: "var(--color-info)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        color: "var(--color-text-inverse)",
    };

    const statusBadgeStyle = (isActive: boolean): React.CSSProperties => ({
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        fontSize: "var(--font-size-xs)",
        fontWeight: 500,
        borderRadius: "9999px",
        backgroundColor: isActive
            ? "var(--color-success-light)"
            : "var(--color-grey-100)",
        color: isActive ? "var(--color-success)" : "var(--color-grey-600)",
    });

    const actionButtonStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        padding: 0,
        background: "transparent",
        border: "none",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        transition: "background-color 150ms ease",
    };

    const dropdownMenuStyle: React.CSSProperties = {
        position: "absolute",
        right: 0,
        top: "100%",
        marginTop: "4px",
        minWidth: "160px",
        backgroundColor: "var(--color-bg-primary)",
        border: "1px solid var(--color-grey-200)",
        borderRadius: "var(--radius-md)",
        boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        zIndex: 1000,
        overflow: "hidden",
    };

    const dropdownItemStyle = (
        isDanger: boolean = false
    ): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        width: "100%",
        padding: "var(--space-2) var(--space-3)",
        fontSize: "var(--font-size-sm)",
        color: isDanger ? "var(--color-danger)" : "var(--color-text-primary)",
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 150ms ease",
    });

    const paginationContainerStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--space-4)",
        borderTop: "1px solid var(--color-grey-100)",
        backgroundColor: "var(--color-grey-050)",
    };

    const paginationInfoStyle: React.CSSProperties = {
        fontSize: "var(--font-size-sm)",
        color: "var(--color-text-muted)",
    };

    const paginationButtonsStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
    };

    const pageButtonStyle = (
        isActive: boolean = false,
        isDisabled: boolean = false
    ): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "32px",
        height: "32px",
        padding: "0 var(--space-2)",
        fontSize: "var(--font-size-sm)",
        fontWeight: isActive ? 600 : 400,
        color: isDisabled
            ? "var(--color-grey-400)"
            : isActive
            ? "var(--color-primary)"
            : "var(--color-text-primary)",
        backgroundColor: isActive ? "var(--color-red-050)" : "transparent",
        border: "1px solid transparent",
        borderRadius: "var(--radius-md)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 150ms ease",
    });

    const emptyStateStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-12)",
        backgroundColor: "var(--color-bg-primary)",
        border: "1px dashed var(--color-grey-200)",
        borderRadius: "var(--radius-lg)",
        textAlign: "center",
        gap: "var(--space-4)",
    };

    const emptyIconStyle: React.CSSProperties = {
        width: "64px",
        height: "64px",
        backgroundColor: "var(--color-grey-100)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };

    if (loading) {
        return <LoadingState message={t("common.loading", "Cargando...")} />;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(
        currentPage * ITEMS_PER_PAGE,
        filteredUsers.length
    );

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={titleContainerStyle}>
                    <h1 style={titleStyle}>
                        {t("users.list.title", "Usuarios")}
                    </h1>
                    <p style={subtitleStyle}>
                        {t(
                            "users.list.subtitle",
                            "Gestiona los usuarios del sistema."
                        )}
                    </p>
                </div>
                <Button variant="primary" size="md" onClick={handleCreateUser}>
                    <Plus size={16} weight="bold" />
                    {t("users.list.new_user", "Nuevo Usuario")}
                </Button>
            </div>

            {/* Filters */}
            <div style={filtersContainerStyle}>
                <div style={searchContainerStyle}>
                    <MagnifyingGlass size={18} style={searchIconStyle} />
                    <input
                        type="text"
                        placeholder={t(
                            "users.list.search_placeholder",
                            "Buscar usuario..."
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={searchInputStyle}
                        onFocus={(e) => {
                            e.target.style.borderColor =
                                "var(--color-grey-400)";
                            e.target.style.boxShadow =
                                "0 0 0 3px rgba(184, 178, 167, 0.25)";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor =
                                "var(--color-grey-300)";
                            e.target.style.boxShadow = "none";
                        }}
                    />
                </div>

                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={selectStyle}
                >
                    <option value="all">
                        {t("users.list.filter.all_roles", "Todos los roles")}
                    </option>
                    {roles.map((role) => (
                        <option key={role.id} value={role.id.toString()}>
                            {role.description || role.name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={selectStyle}
                >
                    <option value="all">
                        {t("users.list.filter.all_status", "Todos los estados")}
                    </option>
                    <option value="active">
                        {t("users.list.status.active", "Activo")}
                    </option>
                    <option value="inactive">
                        {t("users.list.status.inactive", "Inactivo")}
                    </option>
                </select>
            </div>

            {/* Table or Empty State */}
            {filteredUsers.length === 0 ? (
                <div style={emptyStateStyle}>
                    <div style={emptyIconStyle}>
                        <UserPlus size={28} color="var(--color-grey-400)" />
                    </div>
                    <h2
                        style={{
                            fontSize: "var(--font-size-lg)",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                            margin: 0,
                        }}
                    >
                        {searchQuery ||
                        selectedRole !== "all" ||
                        selectedStatus !== "all"
                            ? t(
                                  "users.list.empty.no_results",
                                  "No se encontraron usuarios"
                              )
                            : t("users.list.empty.title", "No hay usuarios")}
                    </h2>
                    <p
                        style={{
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-muted)",
                            margin: 0,
                            maxWidth: "300px",
                        }}
                    >
                        {searchQuery ||
                        selectedRole !== "all" ||
                        selectedStatus !== "all"
                            ? t(
                                  "users.list.empty.try_different",
                                  "Intenta con otros filtros de búsqueda."
                              )
                            : t(
                                  "users.list.empty.description",
                                  "Crea tu primer usuario para comenzar."
                              )}
                    </p>
                    {!searchQuery &&
                        selectedRole === "all" &&
                        selectedStatus === "all" && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleCreateUser}
                            >
                                <Plus size={16} weight="bold" />
                                {t("users.list.new_user", "Nuevo Usuario")}
                            </Button>
                        )}
                </div>
            ) : (
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        ...thStyle,
                                        borderTopLeftRadius: "var(--radius-lg)",
                                    }}
                                >
                                    {t("users.list.table.user", "Usuario")}
                                </th>
                                <th style={thStyle}>
                                    {t("users.list.table.role", "Rol")}
                                </th>
                                <th style={{ ...thStyle, textAlign: "center" }}>
                                    {t(
                                        "users.list.table.verified",
                                        "Verificado"
                                    )}
                                </th>
                                <th style={thStyle}>
                                    {t("users.list.table.status", "Estado")}
                                </th>
                                <th style={thStyle}>
                                    {t(
                                        "users.list.table.last_access",
                                        "Último acceso"
                                    )}
                                </th>
                                <th
                                    style={{
                                        ...thStyle,
                                        width: "60px",
                                        textAlign: "center",
                                        borderTopRightRadius:
                                            "var(--radius-lg)",
                                    }}
                                >
                                    {t("users.list.table.actions", "Acciones")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user) => {
                                const fullName = getFullName(user);
                                return (
                                    <tr key={user.id}>
                                        <td style={tdStyle}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "var(--space-3)",
                                                }}
                                            >
                                                <div style={avatarStyle}>
                                                    {getInitials(user)}
                                                </div>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {fullName || user.email}
                                                    </div>
                                                    {fullName && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "var(--font-size-xs)",
                                                                color: "var(--color-text-muted)",
                                                            }}
                                                        >
                                                            {user.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span
                                                style={{
                                                    color: "var(--color-text-secondary)",
                                                }}
                                            >
                                                {user.role?.description ||
                                                    user.role?.name ||
                                                    "-"}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                ...tdStyle,
                                                textAlign: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {user.isVerified ? (
                                                    <CheckCircle
                                                        size={18}
                                                        weight="fill"
                                                        color="var(--color-success)"
                                                    />
                                                ) : (
                                                    <XCircle
                                                        size={18}
                                                        weight="fill"
                                                        color="var(--color-danger)"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span
                                                style={statusBadgeStyle(
                                                    user.isActive
                                                )}
                                            >
                                                <span
                                                    style={{
                                                        width: "6px",
                                                        height: "6px",
                                                        borderRadius: "50%",
                                                        backgroundColor:
                                                            user.isActive
                                                                ? "var(--color-success)"
                                                                : "var(--color-grey-400)",
                                                    }}
                                                />
                                                {user.isActive
                                                    ? t(
                                                          "users.list.status.active",
                                                          "Activo"
                                                      )
                                                    : t(
                                                          "users.list.status.inactive",
                                                          "Inactivo"
                                                      )}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span
                                                style={{
                                                    fontSize:
                                                        "var(--font-size-xs)",
                                                    color: "var(--color-text-muted)",
                                                }}
                                            >
                                                {formatDateTime(
                                                    user.lastLoginAt
                                                )}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                ...tdStyle,
                                                textAlign: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "relative",
                                                    display: "inline-block",
                                                }}
                                                ref={
                                                    openDropdown === user.id
                                                        ? dropdownRef
                                                        : null
                                                }
                                            >
                                                <button
                                                    style={actionButtonStyle}
                                                    onClick={() =>
                                                        setOpenDropdown(
                                                            openDropdown ===
                                                                user.id
                                                                ? null
                                                                : user.id
                                                        )
                                                    }
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.backgroundColor =
                                                            "var(--color-grey-100)")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.backgroundColor =
                                                            "transparent")
                                                    }
                                                >
                                                    <DotsThree
                                                        size={18}
                                                        weight="bold"
                                                        color="var(--color-grey-500)"
                                                    />
                                                </button>

                                                {openDropdown === user.id && (
                                                    <div
                                                        style={
                                                            dropdownMenuStyle
                                                        }
                                                    >
                                                        {/* Usuario INACTIVO: Solo mostrar opción de activar */}
                                                        {!user.isActive ? (
                                                            <button
                                                                style={{
                                                                    ...dropdownItemStyle(),
                                                                    color: "var(--color-success)",
                                                                }}
                                                                onClick={() =>
                                                                    handleToggleStatus(
                                                                        user
                                                                    )
                                                                }
                                                                onMouseEnter={(
                                                                    e
                                                                ) =>
                                                                    (e.currentTarget.style.backgroundColor =
                                                                        "var(--color-green-050)")
                                                                }
                                                                onMouseLeave={(
                                                                    e
                                                                ) =>
                                                                    (e.currentTarget.style.backgroundColor =
                                                                        "transparent")
                                                                }
                                                            >
                                                                <Power
                                                                    size={16}
                                                                    weight="regular"
                                                                />
                                                                {t(
                                                                    "users.list.actions.activate",
                                                                    "Activar usuario"
                                                                )}
                                                            </button>
                                                        ) : (
                                                            /* Usuario ACTIVO: Mostrar todas las opciones */
                                                            <>
                                                                <button
                                                                    style={dropdownItemStyle()}
                                                                    onClick={() =>
                                                                        handleEditUser(
                                                                            user.id
                                                                        )
                                                                    }
                                                                    onMouseEnter={(e) =>
                                                                        (e.currentTarget.style.backgroundColor =
                                                                            "var(--color-grey-050)")
                                                                    }
                                                                    onMouseLeave={(e) =>
                                                                        (e.currentTarget.style.backgroundColor =
                                                                            "transparent")
                                                                    }
                                                                >
                                                                    <PencilSimple
                                                                        size={16}
                                                                        weight="regular"
                                                                    />
                                                                    {t(
                                                                        "users.list.actions.edit",
                                                                        "Editar"
                                                                    )}
                                                                </button>
                                                                <button
                                                                    style={dropdownItemStyle()}
                                                                    onClick={() =>
                                                                        handleEditUser(
                                                                            user.id
                                                                        )
                                                                    }
                                                                    onMouseEnter={(
                                                                        e
                                                                    ) =>
                                                                        (e.currentTarget.style.backgroundColor =
                                                                            "var(--color-grey-050)")
                                                                    }
                                                                    onMouseLeave={(
                                                                        e
                                                                    ) =>
                                                                        (e.currentTarget.style.backgroundColor =
                                                                            "transparent")
                                                                    }
                                                                >
                                                                    <UserGear
                                                                        size={16}
                                                                        weight="regular"
                                                                    />
                                                                    {t(
                                                                        "users.list.actions.change_role",
                                                                        "Cambiar rol"
                                                                    )}
                                                                </button>
                                                                <button
                                                                    style={dropdownItemStyle()}
                                                                    onClick={() =>
                                                                        handleResetPassword(
                                                                            user.id
                                                                        )
                                                                    }
                                                                    onMouseEnter={(e) =>
                                                                        (e.currentTarget.style.backgroundColor =
                                                                            "var(--color-grey-050)")
                                                                    }
                                                                    onMouseLeave={(e) =>
                                                                        (e.currentTarget.style.backgroundColor =
                                                                            "transparent")
                                                                    }
                                                                >
                                                                    <Key
                                                                        size={16}
                                                                        weight="regular"
                                                                    />
                                                                    {t(
                                                                        "users.list.actions.reset_password",
                                                                        "Restablecer contraseña"
                                                                    )}
                                                                </button>
                                                                {!user.isVerified && (
                                                                    <button
                                                                        style={{
                                                                            ...dropdownItemStyle(),
                                                                            opacity: isVerificationEmailSentRecently(user.verificationEmailSentAt) ? 0.5 : 1,
                                                                            cursor: isVerificationEmailSentRecently(user.verificationEmailSentAt) ? "not-allowed" : "pointer",
                                                                        }}
                                                                        onClick={() =>
                                                                            !isVerificationEmailSentRecently(user.verificationEmailSentAt) &&
                                                                            handleResendVerification(user)
                                                                        }
                                                                        onMouseEnter={(
                                                                            e
                                                                        ) => {
                                                                            if (!isVerificationEmailSentRecently(user.verificationEmailSentAt)) {
                                                                                e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(
                                                                            e
                                                                        ) =>
                                                                            (e.currentTarget.style.backgroundColor =
                                                                                "transparent")
                                                                        }
                                                                        title={
                                                                            isVerificationEmailSentRecently(user.verificationEmailSentAt)
                                                                                ? t("users.list.actions.resend_verification_wait", "Espera 5 minutos antes de reenviar")
                                                                                : undefined
                                                                        }
                                                                    >
                                                                        <EnvelopeSimple
                                                                            size={16}
                                                                            weight="regular"
                                                                        />
                                                                        {t(
                                                                            "users.list.actions.resend_verification",
                                                                            "Reenviar verificación"
                                                                        )}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    style={dropdownItemStyle(
                                                                        true
                                                                    )}
                                                                    onClick={() =>
                                                                        handleDeleteUser(
                                                                            user
                                                                        )
                                                                    }
                                                                    onMouseEnter={(e) =>
                                                                        (e.currentTarget.style.backgroundColor =
                                                                            "var(--color-red-050)")
                                                                    }
                                                                    onMouseLeave={(e) =>
                                                                        (e.currentTarget.style.backgroundColor =
                                                                            "transparent")
                                                                    }
                                                                >
                                                                    <Trash
                                                                        size={16}
                                                                        weight="regular"
                                                                    />
                                                                    {t(
                                                                        "users.list.actions.delete",
                                                                        "Eliminar"
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={paginationContainerStyle}>
                            <div style={paginationInfoStyle}>
                                {t(
                                    "users.list.pagination.showing",
                                    "Mostrando"
                                )}{" "}
                                {startIndex}-{endIndex}{" "}
                                {t("users.list.pagination.of", "de")}{" "}
                                {filteredUsers.length}{" "}
                                {t("users.list.pagination.users", "usuarios")}
                            </div>
                            <div style={paginationButtonsStyle}>
                                <button
                                    style={pageButtonStyle(
                                        false,
                                        currentPage === 1
                                    )}
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                >
                                    <CaretLeft size={18} />
                                </button>

                                {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (
                                            currentPage >=
                                            totalPages - 2
                                        ) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                style={pageButtonStyle(
                                                    currentPage === pageNum
                                                )}
                                                onClick={() =>
                                                    setCurrentPage(pageNum)
                                                }
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                )}

                                <button
                                    style={pageButtonStyle(
                                        false,
                                        currentPage === totalPages
                                    )}
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    <CaretRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleConfirmDelete}
                title={t("users.list.delete.title", "Eliminar usuario")}
                description={
                    deleteDialog.user
                        ? t("users.list.delete.description", {
                              name:
                                  getFullName(deleteDialog.user) ||
                                  deleteDialog.user.email,
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
                isOpen={toggleStatusDialog.isOpen}
                onClose={handleCloseToggleStatusDialog}
                onConfirm={handleConfirmToggleStatus}
                title={t(
                    "users.list.toggle_status.activate_title",
                    "Activar usuario"
                )}
                description={
                    toggleStatusDialog.user
                        ? t("users.list.toggle_status.activate_description", {
                              name:
                                  getFullName(toggleStatusDialog.user) ||
                                  toggleStatusDialog.user.email,
                          })
                        : ""
                }
                confirmText={t(
                    "users.list.toggle_status.activate_confirm",
                    "Activar"
                )}
                cancelText={t("users.list.toggle_status.cancel", "Cancelar")}
                variant="success"
                isLoading={toggleStatusDialog.isLoading}
            />

            {/* Resend Verification Confirmation Dialog */}
            <ConfirmDialog
                isOpen={resendVerificationDialog.isOpen}
                onClose={handleCloseResendVerificationDialog}
                onConfirm={handleConfirmResendVerification}
                title={t(
                    "users.list.resend_verification.title",
                    "Reenviar correo de verificación"
                )}
                description={
                    resendVerificationDialog.user
                        ? resendVerificationDialog.user.verificationEmailSentAt
                            ? `${t("users.list.resend_verification.description_with_time", "Se enviará un nuevo correo de verificación a {{email}}. Último envío: {{time}}.", { email: resendVerificationDialog.user.email, time: formatTimeAgo(resendVerificationDialog.user.verificationEmailSentAt) })}`
                            : `${t("users.list.resend_verification.description", "Se enviará un correo de verificación a {{email}}.", { email: resendVerificationDialog.user.email })}`
                        : ""
                }
                confirmText={t(
                    "users.list.resend_verification.confirm",
                    "Enviar correo"
                )}
                cancelText={t("users.list.resend_verification.cancel", "Cancelar")}
                variant="info"
                isLoading={resendVerificationDialog.isLoading}
            />
        </div>
    );
};
