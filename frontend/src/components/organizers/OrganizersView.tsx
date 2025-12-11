import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Hooks
import { useDialog } from "@/hooks/useDialog";
import { usePagination } from "@/hooks/usePagination";

// Components
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TablePagination, PageContainer } from "@/components/ui/rui";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrganizerDrawer } from "./CreateOrganizerDrawer";
import {
    OrganizerPageHeader,
    OrganizerFilters,
    OrganizerTable,
    OrganizerEmptyState,
    type OrganizerAction,
} from "./components";

// Services
import {
    organizersService,
    type Organizer,
} from "@/services/organizers.service";

interface OrganizersViewProps {
    onNavigate: (path: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const OrganizersView: React.FC<OrganizersViewProps> = ({ onNavigate }) => {
    const { t, i18n } = useTranslation();
    const isEnglish = i18n.language?.startsWith("en");

    // Data state
    const [organizers, setOrganizers] = useState<Organizer[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");

    // Dialog states
    const deleteDialog = useDialog<Organizer>();
    const activateDialog = useDialog<Organizer>();

    // Create drawer state
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await organizersService.findAll(true);
                setOrganizers(data);
            } catch (err) {
                console.error("Error fetching organizers:", err);
                toast.error(
                    t("organizers.list.error_loading", "Error al cargar organizadores")
                );
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [t]);

    // Filtered organizers
    const filteredOrganizers = useMemo(() => {
        return organizers.filter((org) => {
            const matchesSearch =
                searchQuery === "" ||
                org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.ruc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                selectedStatus === "all" ||
                (selectedStatus === "active" && org.isActive) ||
                (selectedStatus === "inactive" && !org.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [organizers, searchQuery, selectedStatus]);

    // Pagination
    const pagination = usePagination({
        items: filteredOrganizers,
        itemsPerPage: ITEMS_PER_PAGE,
    });

    // Reset page when filters change
    useEffect(() => {
        pagination.setCurrentPage(1);
    }, [searchQuery, selectedStatus]);

    // Check if filters are active
    const hasActiveFilters = searchQuery !== "" || selectedStatus !== "all";

    // Clear filters
    const handleClearFilters = useCallback(() => {
        setSearchQuery("");
        setSelectedStatus("all");
    }, []);

    // Navigation handlers
    const handleCreateOrganizer = useCallback(() => {
        setIsCreateDrawerOpen(true);
    }, []);

    const handleOrganizerCreated = useCallback(async () => {
        try {
            const data = await organizersService.findAll(true);
            setOrganizers(data);
        } catch (err) {
            console.error("Error refetching organizers:", err);
        }
    }, []);

    const handleViewOrganizer = useCallback(
        (organizerId: string) => {
            const path = isEnglish
                ? `/en/organizers/${organizerId}`
                : `/organizadores/${organizerId}`;
            onNavigate(path);
        },
        [isEnglish, onNavigate]
    );

    // Action handlers
    const handleAction = useCallback(
        (action: OrganizerAction, organizer: Organizer) => {
            switch (action) {
                case "edit":
                    handleViewOrganizer(organizer.id);
                    break;
                case "delete":
                    deleteDialog.open(organizer);
                    break;
                case "activate":
                    activateDialog.open(organizer);
                    break;
            }
        },
        [deleteDialog, activateDialog, handleViewOrganizer]
    );

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!deleteDialog.data) return;

        deleteDialog.setLoading(true);
        try {
            await organizersService.remove(deleteDialog.data.id);
            setOrganizers((prev) =>
                prev.map((o) =>
                    o.id === deleteDialog.data?.id ? { ...o, isActive: false } : o
                )
            );
            toast.success(
                t("organizers.list.delete.success", "Organizador desactivado correctamente")
            );
            deleteDialog.reset();
        } catch (error) {
            console.error("Error deleting organizer:", error);
            toast.error(
                t("organizers.list.delete.error", "Error al eliminar el organizador")
            );
            deleteDialog.setLoading(false);
        }
    };

    // Confirm activate
    const handleConfirmActivate = async () => {
        if (!activateDialog.data) return;

        activateDialog.setLoading(true);
        try {
            const updated = await organizersService.update(activateDialog.data.id, {
                isActive: true,
            });
            setOrganizers((prev) =>
                prev.map((o) =>
                    o.id === activateDialog.data?.id ? { ...o, isActive: updated.isActive } : o
                )
            );
            toast.success(
                t("organizers.list.activate.success", "Organizador activado correctamente")
            );
            activateDialog.reset();
        } catch (error) {
            console.error("Error activating organizer:", error);
            toast.error(
                t("organizers.list.activate.error", "Error al activar el organizador")
            );
            activateDialog.setLoading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <PageContainer maxWidth="lg" padding="md">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "var(--space-6)",
                    }}
                >
                    <Skeleton width={200} height={32} />
                    <Skeleton
                        width={160}
                        height={40}
                        style={{ borderRadius: "var(--radius-md)" }}
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "var(--space-4)",
                        marginBottom: "var(--space-6)",
                        flexWrap: "wrap",
                    }}
                >
                    <Skeleton
                        width={280}
                        height={40}
                        style={{ borderRadius: "var(--radius-md)" }}
                    />
                    <Skeleton
                        width={120}
                        height={40}
                        style={{ borderRadius: "var(--radius-md)" }}
                    />
                </div>

                <div
                    style={{
                        backgroundColor: "var(--color-bg-primary)",
                        border: "1px solid var(--color-grey-200)",
                        borderRadius: "var(--radius-lg)",
                        overflow: "hidden",
                    }}
                >
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 80px 100px 60px",
                                gap: "var(--space-4)",
                                padding: "var(--space-4)",
                                alignItems: "center",
                                borderBottom:
                                    index < 4 ? "1px solid var(--color-grey-100)" : "none",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "var(--space-3)",
                                }}
                            >
                                <Skeleton
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: "var(--radius-md)" }}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "var(--space-1)",
                                    }}
                                >
                                    <Skeleton width={140} height={14} />
                                    <Skeleton width={100} height={12} />
                                </div>
                            </div>
                            <Skeleton width={120} height={14} />
                            <Skeleton width={50} height={14} />
                            <Skeleton
                                width={70}
                                height={24}
                                style={{ borderRadius: "var(--radius-full)" }}
                            />
                            <Skeleton
                                width={28}
                                height={28}
                                style={{
                                    borderRadius: "var(--radius-md)",
                                    marginLeft: "auto",
                                }}
                            />
                        </div>
                    ))}
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer maxWidth="lg" padding="md">
            {/* Header */}
            <OrganizerPageHeader
                onCreateOrganizer={handleCreateOrganizer}
                showCreateButton={organizers.length > 0}
            />

            {/* Filters */}
            <OrganizerFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
            />

            {/* Table or Empty State */}
            {filteredOrganizers.length === 0 ? (
                <OrganizerEmptyState
                    hasFilters={hasActiveFilters}
                    onCreateOrganizer={handleCreateOrganizer}
                />
            ) : (
                <>
                    <OrganizerTable
                        organizers={pagination.paginatedItems}
                        onOrganizerClick={handleViewOrganizer}
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
                        itemLabel={t("organizers.list.pagination.organizers", "organizadores")}
                    />
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={deleteDialog.close}
                onConfirm={handleConfirmDelete}
                title={t("organizers.list.delete.title", "Desactivar organizador")}
                description={
                    deleteDialog.data
                        ? t("organizers.list.delete.description", {
                              name: deleteDialog.data.name,
                              defaultValue: `¿Estás seguro de que deseas desactivar "${deleteDialog.data.name}"? Los eventos asociados no se verán afectados.`,
                          })
                        : ""
                }
                confirmText={t("organizers.list.delete.confirm", "Desactivar")}
                cancelText={t("common.cancel", "Cancelar")}
                variant="danger"
                isLoading={deleteDialog.isLoading}
            />

            {/* Activate Confirmation Dialog */}
            <ConfirmDialog
                isOpen={activateDialog.isOpen}
                onClose={activateDialog.close}
                onConfirm={handleConfirmActivate}
                title={t("organizers.list.activate.title", "Activar organizador")}
                description={
                    activateDialog.data
                        ? t("organizers.list.activate.description", {
                              name: activateDialog.data.name,
                              defaultValue: `¿Deseas activar "${activateDialog.data.name}"?`,
                          })
                        : ""
                }
                confirmText={t("organizers.list.activate.confirm", "Activar")}
                cancelText={t("common.cancel", "Cancelar")}
                variant="success"
                isLoading={activateDialog.isLoading}
            />

            {/* Create Organizer Drawer */}
            <CreateOrganizerDrawer
                isOpen={isCreateDrawerOpen}
                onClose={() => setIsCreateDrawerOpen(false)}
                onSuccess={handleOrganizerCreated}
            />
        </PageContainer>
    );
};

export default OrganizersView;
