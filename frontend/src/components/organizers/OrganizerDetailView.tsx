import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    ArrowLeft,
    ShieldWarning,
    Globe,
    EnvelopeSimple,
    Receipt,
    FloppyDisk,
    PencilSimple,
    X,
    Trash,
} from "@phosphor-icons/react";

// Components
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizerAvatar, OrganizerStatusBadge } from "./components";
import {
    OrganizerInfoTab,
    OrganizerFiscalTab,
    OrganizerLegalTab,
} from "./tabs";

// Hooks
import { useDialog } from "@/hooks/useDialog";

// Services
import {
    organizersService,
    type Organizer,
} from "@/services/organizers.service";
import { formatEventDate, getLocaleFromLang } from "@/lib/dateUtils";

// Styles
import "./OrganizerDetailView.css";

type TabId = "info" | "fiscal" | "legal";

interface OrganizerDetailViewProps {
    organizerId: string;
    onNavigate: (path: string) => void;
}

export const OrganizerDetailView: React.FC<OrganizerDetailViewProps> = ({
    organizerId,
    onNavigate,
}) => {
    const { t, i18n } = useTranslation();
    const isEnglish = i18n.language?.startsWith("en");
    const locale = getLocaleFromLang(isEnglish ? "en" : "es");
    const queryClient = useQueryClient();

    // Check if we should start in edit mode (from URL query param)
    const shouldStartEditing = typeof window !== "undefined" 
        ? new URLSearchParams(window.location.search).get("edit") === "true"
        : false;

    // State
    const [activeTab, setActiveTab] = useState<TabId>("info");
    const [isEditing, setIsEditing] = useState(shouldStartEditing);
    const [hasChanges, setHasChanges] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        website: "",
        logoUrl: "",
        ruc: "",
        businessName: "",
        fiscalAddress: "",
        baseCurrency: "PEN",
        emitsFiscalDocuments: false,
        termsText: "",
        privacyText: "",
    });

    // Form errors
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Dialogs
    const deleteDialog = useDialog();
    const activateDialog = useDialog();

    // Query
    const {
        data: organizer,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["organizer", organizerId],
        queryFn: () => organizersService.findById(organizerId),
    });

    // Initialize form data
    useEffect(() => {
        if (organizer) {
            setFormData({
                name: organizer.name || "",
                email: organizer.email || "",
                website: organizer.website || "",
                logoUrl: organizer.logoUrl || "",
                ruc: organizer.ruc || "",
                businessName: organizer.businessName || "",
                fiscalAddress: organizer.fiscalAddress || "",
                baseCurrency: organizer.baseCurrency || "PEN",
                emitsFiscalDocuments: organizer.emitsFiscalDocuments || false,
                termsText: organizer.termsText || "",
                privacyText: organizer.privacyText || "",
            });
        }
    }, [organizer]);

    // Validation
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = t(
                "validation.name_required",
                "El nombre es requerido"
            );
        } else if (formData.name.trim().length < 2) {
            errors.name = t("validation.min_length", {
                count: 2,
                defaultValue: "Mínimo 2 caracteres",
            });
        }

        if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            errors.email = t("validation.email_invalid", "Email inválido");
        }

        if (formData.ruc && !/^\d{11}$/.test(formData.ruc)) {
            errors.ruc = t(
                "validation.ruc_invalid",
                "El RUC debe tener 11 dígitos"
            );
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Mutations
    const updateMutation = useMutation({
        mutationFn: async () => {
            await organizersService.update(organizerId, {
                name: formData.name,
                email: formData.email || undefined,
                website: formData.website || undefined,
                logoUrl: formData.logoUrl || undefined,
                ruc: formData.ruc || undefined,
                businessName: formData.businessName || undefined,
                fiscalAddress: formData.fiscalAddress || undefined,
                baseCurrency: formData.baseCurrency,
                emitsFiscalDocuments: formData.emitsFiscalDocuments,
                termsText: formData.termsText || undefined,
                privacyText: formData.privacyText || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["organizer", organizerId],
            });
            toast.success(
                t(
                    "organizers.detail.update_success",
                    "Organizador actualizado correctamente"
                )
            );
            setIsEditing(false);
            setHasChanges(false);
        },
        onError: () => {
            toast.error(
                t(
                    "organizers.detail.update_error",
                    "Error al actualizar el organizador"
                )
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => organizersService.remove(organizerId),
        onSuccess: () => {
            toast.success(
                t(
                    "organizers.detail.deleted",
                    "Organizador desactivado correctamente"
                )
            );
            handleBack();
        },
        onError: () => {
            toast.error(
                t("organizers.detail.delete_error", "Error al eliminar")
            );
            deleteDialog.setLoading(false);
        },
    });

    const activateMutation = useMutation({
        mutationFn: () =>
            organizersService.update(organizerId, { isActive: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["organizer", organizerId],
            });
            toast.success(
                t(
                    "organizers.detail.activated",
                    "Organizador activado correctamente"
                )
            );
            activateDialog.reset();
        },
        onError: () => {
            toast.error(
                t("organizers.detail.activate_error", "Error al activar")
            );
            activateDialog.setLoading(false);
        },
    });

    // Handlers
    const handleBack = () =>
        onNavigate(isEnglish ? "/en/organizers" : "/organizadores");

    const handleFormChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
        if (formErrors[field]) {
            setFormErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setHasChanges(false);
        setFormErrors({});
        if (organizer) {
            setFormData({
                name: organizer.name || "",
                email: organizer.email || "",
                website: organizer.website || "",
                logoUrl: organizer.logoUrl || "",
                ruc: organizer.ruc || "",
                businessName: organizer.businessName || "",
                fiscalAddress: organizer.fiscalAddress || "",
                baseCurrency: organizer.baseCurrency || "PEN",
                emitsFiscalDocuments: organizer.emitsFiscalDocuments || false,
                termsText: organizer.termsText || "",
                privacyText: organizer.privacyText || "",
            });
        }
    };

    // Loading
    if (isLoading) {
        return (
            <div className="organizer-detail">
                <div style={{ marginBottom: "var(--space-4)" }}>
                    <Skeleton width={200} height={16} />
                </div>
                <div style={{ marginBottom: "var(--space-6)" }}>
                    <Skeleton
                        width={140}
                        height={36}
                        style={{ borderRadius: "var(--radius-md)" }}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "var(--space-6)",
                    }}
                >
                    <Skeleton width={180} height={28} />
                    <div style={{ display: "flex", gap: "var(--space-3)" }}>
                        <Skeleton
                            width={100}
                            height={36}
                            style={{ borderRadius: "var(--radius-md)" }}
                        />
                    </div>
                </div>
                <div
                    style={{
                        backgroundColor: "var(--color-bg-primary)",
                        border: "1px solid var(--color-grey-200)",
                        borderRadius: "var(--radius-lg)",
                        padding: "var(--space-6)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-4)",
                        }}
                    >
                        <Skeleton
                            width={80}
                            height={80}
                            style={{ borderRadius: "var(--radius-md)" }}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "var(--space-2)",
                            }}
                        >
                            <Skeleton width={200} height={24} />
                            <Skeleton width={150} height={16} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error
    if (error || !organizer) {
        return (
            <div className="organizer-detail__error">
                <ShieldWarning size={48} color="var(--color-red-400)" />
                <p className="organizer-detail__error-text">
                    {t(
                        "organizers.detail.error",
                        "Error al cargar el organizador"
                    )}
                </p>
                <Button variant="secondary" onClick={handleBack}>
                    {t("common.back", "Volver")}
                </Button>
            </div>
        );
    }

    return (
        <div className="organizer-detail">
            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    {
                        label: t("organizers.list.title", "Organizadores"),
                        href: isEnglish ? "/en/organizers" : "/organizadores",
                    },
                    { label: organizer.name },
                ]}
            />

            {/* Back button */}
            <button
                type="button"
                className="organizer-detail__back"
                onClick={handleBack}
            >
                <ArrowLeft size={16} />
                {t("organizers.detail.back_to_list", "Volver a la lista")}
            </button>

            {/* Page Header */}
            <div className="organizer-detail__header">
                <div className="organizer-detail__header-title">
                    <h1 className="organizer-detail__title">
                        {t(
                            "organizers.detail.title",
                            "Detalles del Organizador"
                        )}
                    </h1>
                    <p className="organizer-detail__subtitle">
                        {t(
                            "organizers.detail.subtitle",
                            "Visualiza y edita la información del organizador"
                        )}{" "}
                        {formData.name}.
                    </p>
                </div>
                <div className="organizer-detail__header-actions">
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                size="md"
                                onClick={handleCancelEdit}
                            >
                                <X size={18} />
                                {t("common.cancel", "Cancelar")}
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => {
                                    if (validateForm()) {
                                        updateMutation.mutate();
                                    }
                                }}
                                isLoading={updateMutation.isPending}
                                disabled={!hasChanges}
                            >
                                <FloppyDisk size={18} />
                                {t(
                                    "organizers.detail.save_changes",
                                    "Guardar Cambios"
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            {!organizer.isActive ? (
                                <Button
                                    variant="secondary"
                                    size="md"
                                    onClick={() => activateDialog.open()}
                                >
                                    {t("organizers.detail.activate", "Activar")}
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={() => deleteDialog.open()}
                                    style={{ color: "var(--color-red-600)" }}
                                >
                                    <Trash size={18} />
                                    {t(
                                        "organizers.detail.deactivate",
                                        "Desactivar"
                                    )}
                                </Button>
                            )}
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
                </div>
            </div>

            {/* Organizer Card */}
            <div className="organizer-detail__org-card">
                <div className="organizer-detail__org-info">
                    <OrganizerAvatar organizer={organizer} size="xl" />
                    <div className="organizer-detail__org-details">
                        <div className="organizer-detail__org-name">
                            <span className="organizer-detail__org-name-text">
                                {organizer.name}
                            </span>
                            <OrganizerStatusBadge
                                isActive={organizer.isActive}
                                size="sm"
                            />
                        </div>
                        <div className="organizer-detail__org-meta">
                            {organizer.email && (
                                <div className="organizer-detail__org-meta-item">
                                    <EnvelopeSimple size={14} />
                                    {organizer.email}
                                </div>
                            )}
                            {organizer.website && (
                                <div className="organizer-detail__org-meta-item">
                                    <Globe size={14} />
                                    <a
                                        href={organizer.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {organizer.website.replace(
                                            /^https?:\/\//,
                                            ""
                                        )}
                                    </a>
                                </div>
                            )}
                            {organizer.emitsFiscalDocuments && (
                                <div className="organizer-detail__org-meta-item organizer-detail__org-meta-item--fiscal">
                                    <Receipt size={14} />
                                    {t(
                                        "organizers.emits_fiscal",
                                        "Emite comprobantes"
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="organizer-detail__org-extra">
                    <div className="organizer-detail__org-extra-item">
                        <span className="organizer-detail__org-extra-label">
                            {t("organizers.detail.currency_label", "Moneda")}
                        </span>
                        <span className="organizer-detail__org-extra-value">
                            {organizer.baseCurrency}
                        </span>
                    </div>
                    {organizer.ruc && (
                        <div className="organizer-detail__org-extra-item">
                            <span className="organizer-detail__org-extra-label">
                                RUC
                            </span>
                            <span className="organizer-detail__org-extra-value">
                                {organizer.ruc}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div
                className="organizer-detail__tabs"
                role="tablist"
                aria-label={t(
                    "organizers.detail.tabs",
                    "Secciones del organizador"
                )}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "info"}
                    className={`organizer-detail__tab ${
                        activeTab === "info"
                            ? "organizer-detail__tab--active"
                            : ""
                    }`}
                    onClick={() => setActiveTab("info")}
                >
                    {t("organizers.detail.tab_info", "Información General")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "fiscal"}
                    className={`organizer-detail__tab ${
                        activeTab === "fiscal"
                            ? "organizer-detail__tab--active"
                            : ""
                    }`}
                    onClick={() => setActiveTab("fiscal")}
                >
                    {t("organizers.detail.tab_fiscal", "Datos Fiscales")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "legal"}
                    className={`organizer-detail__tab ${
                        activeTab === "legal"
                            ? "organizer-detail__tab--active"
                            : ""
                    }`}
                    onClick={() => setActiveTab("legal")}
                >
                    {t("organizers.detail.tab_legal", "Términos y Políticas")}
                </button>
            </div>

            {/* Main Layout */}
            <div className="organizer-detail__layout">
                <div className="organizer-detail__main">
                    {activeTab === "info" && (
                        <OrganizerInfoTab
                            formData={formData}
                            isEditing={isEditing}
                            onFormChange={handleFormChange}
                            errors={formErrors}
                        />
                    )}
                    {activeTab === "fiscal" && (
                        <OrganizerFiscalTab
                            formData={formData}
                            isEditing={isEditing}
                            onFormChange={handleFormChange}
                            errors={formErrors}
                        />
                    )}
                    {activeTab === "legal" && (
                        <OrganizerLegalTab
                            formData={formData}
                            isEditing={isEditing}
                            onFormChange={handleFormChange}
                        />
                    )}
                </div>

                {/* Sidebar */}
                <aside className="organizer-detail__sidebar">
                    <div className="organizer-detail__sidebar-card">
                        <h4 className="organizer-detail__sidebar-title">
                            {t("organizers.detail.metadata", "Metadatos")}
                        </h4>
                        <div className="organizer-detail__metadata-row">
                            <span className="organizer-detail__metadata-label">
                                {t(
                                    "organizers.detail.org_id",
                                    "ID Organizador"
                                )}
                            </span>
                            <span className="organizer-detail__metadata-value organizer-detail__metadata-value--mono">
                                ORG-{organizer.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                        <div className="organizer-detail__metadata-row">
                            <span className="organizer-detail__metadata-label">
                                {t("organizers.detail.created", "Creado")}
                            </span>
                            <span className="organizer-detail__metadata-value">
                                {formatEventDate(organizer.createdAt, locale)}
                            </span>
                        </div>
                        <div className="organizer-detail__metadata-row">
                            <span className="organizer-detail__metadata-label">
                                {t("organizers.detail.updated", "Actualizado")}
                            </span>
                            <span className="organizer-detail__metadata-value">
                                {formatEventDate(organizer.updatedAt, locale)}
                            </span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Dialogs */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={deleteDialog.close}
                onConfirm={() => {
                    deleteDialog.setLoading(true);
                    deleteMutation.mutate();
                }}
                title={t(
                    "organizers.detail.delete_title",
                    "Desactivar organizador"
                )}
                description={t("organizers.detail.delete_desc", {
                    name: organizer.name,
                    defaultValue: `¿Estás seguro de desactivar "${organizer.name}"? Los eventos asociados no se verán afectados.`,
                })}
                confirmText={t(
                    "organizers.detail.delete_confirm",
                    "Desactivar"
                )}
                cancelText={t("common.cancel", "Cancelar")}
                variant="danger"
                isLoading={deleteDialog.isLoading}
            />

            <ConfirmDialog
                isOpen={activateDialog.isOpen}
                onClose={activateDialog.close}
                onConfirm={() => {
                    activateDialog.setLoading(true);
                    activateMutation.mutate();
                }}
                title={t(
                    "organizers.detail.activate_title",
                    "Activar organizador"
                )}
                description={t("organizers.detail.activate_desc", {
                    name: organizer.name,
                    defaultValue: `¿Deseas activar "${organizer.name}"?`,
                })}
                confirmText={t("organizers.detail.activate_confirm", "Activar")}
                cancelText={t("common.cancel", "Cancelar")}
                variant="success"
                isLoading={activateDialog.isLoading}
            />
        </div>
    );
};

export default OrganizerDetailView;
