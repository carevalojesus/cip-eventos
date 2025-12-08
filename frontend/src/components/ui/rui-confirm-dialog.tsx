import React, { useEffect, useRef, useState } from "react";
import {
    Warning,
    WarningCircle,
    Info,
    CheckCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/rui-button";

export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    isLoading = false,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [isClosing, setIsClosing] = useState(false);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isLoading) {
                handleClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, isLoading]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Focus management
    useEffect(() => {
        if (isOpen && dialogRef.current) {
            setTimeout(() => {
                dialogRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (isLoading) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            handleClose();
        }
    };

    if (!isOpen && !isClosing) return null;

    const getIconConfig = () => {
        switch (variant) {
            case "danger":
                return {
                    icon: WarningCircle,
                    iconColor: "var(--color-red-600)",
                    iconBgColor: "var(--color-red-100)",
                };
            case "warning":
                return {
                    icon: Warning,
                    iconColor: "var(--color-yellow-600)",
                    iconBgColor: "var(--color-yellow-100)",
                };
            case "info":
                return {
                    icon: Info,
                    iconColor: "var(--color-cyan-600)",
                    iconBgColor: "var(--color-cyan-100)",
                };
            case "success":
                return {
                    icon: CheckCircle,
                    iconColor: "var(--color-green-600)",
                    iconBgColor: "var(--color-green-100)",
                };
            default:
                return {
                    icon: WarningCircle,
                    iconColor: "var(--color-red-600)",
                    iconBgColor: "var(--color-red-100)",
                };
        }
    };

    const iconConfig = getIconConfig();
    const IconComponent = iconConfig.icon;

    return (
        <>
            {/* Backdrop - usando --color-overlay */}
            <div
                className="rui-confirm-backdrop"
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "var(--color-overlay)",
                    zIndex: "var(--z-modal-backdrop)" as unknown as number,
                    transition: "opacity var(--transition-normal)",
                    opacity: isClosing ? 0 : 1,
                }}
                onClick={handleBackdropClick}
                role="presentation"
            />

            {/* Container */}
            <div
                className="rui-confirm-dialog-container"
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: "var(--z-modal)" as unknown as number,
                    overflowY: "auto",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    padding: "var(--space-4)",
                    pointerEvents: isClosing ? "none" : "auto",
                }}
                onClick={handleBackdropClick}
                role="presentation"
            >
                {/* Dialog Panel */}
                <div
                    ref={dialogRef}
                    className="rui-confirm-dialog-panel"
                    style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "32rem",
                        backgroundColor: "var(--color-bg-primary)",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-modal)",
                        transform: isClosing
                            ? "translateY(1rem) scale(0.95)"
                            : "translateY(0) scale(1)",
                        opacity: isClosing ? 0 : 1,
                        transition: "all var(--transition-normal)",
                        outline: "none",
                        overflow: "hidden",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={-1}
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="confirm-dialog-title"
                    aria-describedby="confirm-dialog-description"
                >
                    {/* Content Area */}
                    <div
                        className="rui-confirm-dialog-content"
                        style={{
                            backgroundColor: "var(--color-bg-primary)",
                            padding:
                                "var(--space-5) var(--space-4) var(--space-4)",
                        }}
                    >
                        <div
                            className="rui-confirm-dialog-header"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            {/* Icon */}
                            <div
                                className="rui-confirm-dialog-icon"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "3rem",
                                    height: "3rem",
                                    backgroundColor: iconConfig.iconBgColor,
                                    borderRadius: "var(--radius-full)",
                                    flexShrink: 0,
                                }}
                            >
                                <IconComponent
                                    size={24}
                                    weight="regular"
                                    color={iconConfig.iconColor}
                                />
                            </div>

                            {/* Text */}
                            <div
                                className="rui-confirm-dialog-text"
                                style={{
                                    marginTop: "var(--space-3)",
                                    textAlign: "center",
                                }}
                            >
                                <h3
                                    id="confirm-dialog-title"
                                    style={{
                                        fontSize: "var(--font-size-base)",
                                        fontWeight:
                                            "var(--font-weight-semibold)" as unknown as number,
                                        color: "var(--color-text-primary)",
                                        margin: 0,
                                        lineHeight: "var(--line-height-tight)",
                                    }}
                                >
                                    {title}
                                </h3>
                                <p
                                    id="confirm-dialog-description"
                                    style={{
                                        fontSize: "var(--font-size-sm)",
                                        color: "var(--color-text-muted)",
                                        margin: 0,
                                        marginTop: "var(--space-2)",
                                        lineHeight: "var(--line-height-normal)",
                                    }}
                                >
                                    {description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - fondo secundario */}
                    <div
                        className="rui-confirm-dialog-footer"
                        style={{
                            backgroundColor: "var(--color-bg-secondary)",
                            padding: "var(--space-3) var(--space-4)",
                            display: "flex",
                            flexDirection: "column-reverse",
                            gap: "var(--space-3)",
                        }}
                    >
                        {/* Confirm Button */}
                        <div className="rui-confirm-dialog-btn">
                            <Button
                                variant="primary"
                                size="md"
                                fullWidth
                                onClick={onConfirm}
                                disabled={isLoading}
                                isLoading={isLoading}
                                loadingText="Procesando..."
                            >
                                {confirmText}
                            </Button>
                        </div>

                        {/* Cancel Button */}
                        <div className="rui-confirm-dialog-btn">
                            <Button
                                variant="secondary"
                                size="md"
                                fullWidth
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                {cancelText}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responsive styles */}
            <style>{`
                @media (min-width: 640px) {
                    .rui-confirm-dialog-container {
                        align-items: center !important;
                        padding: 0 !important;
                    }
                    .rui-confirm-dialog-panel {
                        margin: var(--space-8);
                    }
                    .rui-confirm-dialog-content {
                        padding: var(--space-6) var(--space-6) var(--space-4) !important;
                    }
                    .rui-confirm-dialog-header {
                        flex-direction: row !important;
                        align-items: flex-start !important;
                    }
                    .rui-confirm-dialog-icon {
                        width: 2.5rem !important;
                        height: 2.5rem !important;
                    }
                    .rui-confirm-dialog-text {
                        margin-top: 0 !important;
                        margin-left: var(--space-4) !important;
                        text-align: left !important;
                    }
                    .rui-confirm-dialog-footer {
                        flex-direction: row-reverse !important;
                        padding: var(--space-3) var(--space-6) !important;
                    }
                    .rui-confirm-dialog-btn {
                        width: auto !important;
                    }
                    .rui-confirm-dialog-btn button {
                        width: auto !important;
                    }
                }
            `}</style>
        </>
    );
};

export default ConfirmDialog;
