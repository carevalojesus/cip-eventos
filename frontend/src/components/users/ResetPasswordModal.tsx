import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    Key,
    Eye,
    EyeSlash,
    Copy,
    ArrowsClockwise,
    Check,
    EnvelopeSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { generatePassword } from "@/lib/userUtils";

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    userName: string | null;
    onSendResetLink: () => Promise<void>;
    onSetPassword: (password: string) => Promise<void>;
    isLoading: boolean;
}

type ResetMode = "link" | "password";

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
    isOpen,
    onClose,
    userEmail,
    userName,
    onSendResetLink,
    onSetPassword,
    isLoading,
}) => {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDivElement>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [mode, setMode] = useState<ResetMode>("link");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode("link");
            setPassword("");
            setShowPassword(false);
            setCopied(false);
        }
    }, [isOpen]);

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

    const handleGeneratePassword = () => {
        const newPassword = generatePassword(12);
        setPassword(newPassword);
        setShowPassword(true);
    };

    const handleCopyPassword = async () => {
        if (password) {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = async () => {
        if (mode === "link") {
            await onSendResetLink();
        } else {
            if (password.length >= 8) {
                await onSetPassword(password);
            }
        }
    };

    if (!isOpen && !isClosing) return null;

    const displayName = userName || userEmail;

    const getInitials = (): string => {
        if (userName) {
            const parts = userName.split(" ").filter(Boolean);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            if (parts.length === 1) return parts[0][0].toUpperCase();
        }
        return userEmail[0].toUpperCase();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="rui-reset-password-backdrop"
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
                className="rui-reset-password-container"
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
                    className="rui-reset-password-panel"
                    style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "28rem",
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
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reset-password-title"
                >
                    {/* Content Area */}
                    <div
                        className="rui-reset-password-content"
                        style={{
                            backgroundColor: "var(--color-bg-primary)",
                            padding: "var(--space-5) var(--space-4) var(--space-4)",
                        }}
                    >
                        {/* Header */}
                        <h3
                            id="reset-password-title"
                            style={{
                                fontSize: "var(--font-size-lg)",
                                fontWeight: "var(--font-weight-semibold)" as unknown as number,
                                color: "var(--color-text-primary)",
                                margin: 0,
                                lineHeight: "var(--line-height-tight)",
                                textAlign: "center",
                            }}
                        >
                            {t("users.list.reset_password.modal_title", "Restablecer contraseña")}
                        </h3>

                        {/* User info */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-3)",
                                padding: "var(--space-3)",
                                backgroundColor: "var(--color-bg-secondary)",
                                borderRadius: "var(--radius-md)",
                                marginTop: "var(--space-4)",
                            }}
                        >
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "var(--radius-full)",
                                    backgroundColor: "var(--color-info)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "var(--font-size-sm)",
                                    fontWeight: 600,
                                    color: "var(--color-text-inverse)",
                                    flexShrink: 0,
                                }}
                            >
                                {getInitials()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 500,
                                        color: "var(--color-text-primary)",
                                        fontSize: "var(--font-size-sm)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {displayName}
                                </div>
                                {userName && (
                                    <div
                                        style={{
                                            fontSize: "var(--font-size-xs)",
                                            color: "var(--color-text-muted)",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {userEmail}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mode tabs */}
                        <div
                            style={{
                                display: "flex",
                                gap: "var(--space-2)",
                                marginTop: "var(--space-4)",
                            }}
                        >
                            <button
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "var(--space-2)",
                                    padding: "var(--space-2) var(--space-3)",
                                    fontSize: "var(--font-size-sm)",
                                    fontWeight: 500,
                                    color: mode === "link" ? "var(--color-primary)" : "var(--color-text-muted)",
                                    backgroundColor: mode === "link" ? "var(--color-red-050)" : "transparent",
                                    border: mode === "link" ? "1px solid var(--color-primary)" : "1px solid var(--color-grey-300)",
                                    borderRadius: "var(--radius-md)",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    transition: "all 150ms ease",
                                }}
                                onClick={() => !isLoading && setMode("link")}
                                disabled={isLoading}
                            >
                                <EnvelopeSimple size={16} weight={mode === "link" ? "fill" : "regular"} />
                                {t("users.list.reset_password.send_link", "Enviar enlace")}
                            </button>
                            <button
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "var(--space-2)",
                                    padding: "var(--space-2) var(--space-3)",
                                    fontSize: "var(--font-size-sm)",
                                    fontWeight: 500,
                                    color: mode === "password" ? "var(--color-primary)" : "var(--color-text-muted)",
                                    backgroundColor: mode === "password" ? "var(--color-red-050)" : "transparent",
                                    border: mode === "password" ? "1px solid var(--color-primary)" : "1px solid var(--color-grey-300)",
                                    borderRadius: "var(--radius-md)",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    transition: "all 150ms ease",
                                }}
                                onClick={() => !isLoading && setMode("password")}
                                disabled={isLoading}
                            >
                                <Key size={16} weight={mode === "password" ? "fill" : "regular"} />
                                {t("users.list.reset_password.set_password", "Crear contraseña")}
                            </button>
                        </div>

                        {/* Mode content */}
                        <div style={{ marginTop: "var(--space-4)" }}>
                            {mode === "link" ? (
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "var(--font-size-sm)",
                                        color: "var(--color-text-muted)",
                                        lineHeight: "var(--line-height-normal)",
                                        textAlign: "center",
                                    }}
                                >
                                    {t(
                                        "users.list.reset_password.link_description",
                                        "Se enviará un correo al usuario con un enlace para que pueda crear su propia contraseña. El enlace será válido por 24 horas."
                                    )}
                                </p>
                            ) : (
                                <>
                                    <p
                                        style={{
                                            margin: "0 0 var(--space-3) 0",
                                            fontSize: "var(--font-size-sm)",
                                            color: "var(--color-text-muted)",
                                            lineHeight: "var(--line-height-normal)",
                                            textAlign: "center",
                                        }}
                                    >
                                        {t(
                                            "users.list.reset_password.password_description",
                                            "Genera o escribe una contraseña. Se enviará por correo al usuario."
                                        )}
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "var(--space-2)",
                                        }}
                                    >
                                        <div style={{ position: "relative", flex: 1 }}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t(
                                                    "users.list.reset_password.password_placeholder",
                                                    "Mínimo 8 caracteres"
                                                )}
                                                style={{
                                                    width: "100%",
                                                    height: "40px",
                                                    padding: "0 var(--space-10) 0 var(--space-3)",
                                                    fontSize: "var(--font-size-sm)",
                                                    fontFamily: "monospace",
                                                    border: "1px solid var(--color-grey-300)",
                                                    borderRadius: "var(--radius-md)",
                                                    backgroundColor: "var(--color-bg-primary)",
                                                    outline: "none",
                                                    boxSizing: "border-box",
                                                }}
                                                disabled={isLoading}
                                            />
                                            <button
                                                style={{
                                                    position: "absolute",
                                                    right: "8px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "28px",
                                                    height: "28px",
                                                    padding: 0,
                                                    background: "transparent",
                                                    border: "none",
                                                    borderRadius: "var(--radius-sm)",
                                                    cursor: "pointer",
                                                    color: "var(--color-grey-500)",
                                                }}
                                                onClick={() => setShowPassword(!showPassword)}
                                                title={
                                                    showPassword
                                                        ? t("common.hide", "Ocultar")
                                                        : t("common.show", "Mostrar")
                                                }
                                            >
                                                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="md"
                                            onClick={handleGeneratePassword}
                                            disabled={isLoading}
                                            style={{ flexShrink: 0 }}
                                        >
                                            <ArrowsClockwise size={16} />
                                            {t("users.list.reset_password.generate", "Generar")}
                                        </Button>
                                    </div>
                                    {password && (
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginTop: "var(--space-2)",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "var(--font-size-xs)",
                                                    color:
                                                        password.length >= 8
                                                            ? "var(--color-success)"
                                                            : "var(--color-danger)",
                                                }}
                                            >
                                                {password.length >= 8
                                                    ? t(
                                                          "users.list.reset_password.valid_password",
                                                          "Contraseña válida"
                                                      )
                                                    : t(
                                                          "users.list.reset_password.invalid_password",
                                                          "Mínimo 8 caracteres"
                                                      )}
                                            </span>
                                            <button
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    padding: "4px 8px",
                                                    fontSize: "var(--font-size-xs)",
                                                    color: copied
                                                        ? "var(--color-success)"
                                                        : "var(--color-text-muted)",
                                                    background: "transparent",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    borderRadius: "var(--radius-sm)",
                                                }}
                                                onClick={handleCopyPassword}
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check size={14} />
                                                        {t("common.copied", "Copiado")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={14} />
                                                        {t("common.copy", "Copiar")}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="rui-reset-password-footer"
                        style={{
                            backgroundColor: "var(--color-bg-secondary)",
                            padding: "var(--space-3) var(--space-4)",
                            display: "flex",
                            flexDirection: "column-reverse",
                            gap: "var(--space-3)",
                        }}
                    >
                        {/* Confirm Button */}
                        <div className="rui-reset-password-btn">
                            <Button
                                variant="primary"
                                size="md"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={isLoading || (mode === "password" && password.length < 8)}
                                isLoading={isLoading}
                                loadingText={t("common.sending", "Enviando...")}
                            >
                                {mode === "link"
                                    ? t("users.list.reset_password.send_link_button", "Enviar enlace")
                                    : t("users.list.reset_password.set_password_button", "Establecer y enviar")}
                            </Button>
                        </div>

                        {/* Cancel Button */}
                        <div className="rui-reset-password-btn">
                            <Button
                                variant="secondary"
                                size="md"
                                fullWidth
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancelar")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responsive styles */}
            <style>{`
                @media (min-width: 640px) {
                    .rui-reset-password-container {
                        align-items: center !important;
                        padding: 0 !important;
                    }
                    .rui-reset-password-panel {
                        margin: var(--space-8);
                    }
                    .rui-reset-password-content {
                        padding: var(--space-6) var(--space-6) var(--space-4) !important;
                    }
                    .rui-reset-password-footer {
                        flex-direction: row-reverse !important;
                        padding: var(--space-3) var(--space-6) !important;
                    }
                    .rui-reset-password-btn {
                        width: auto !important;
                    }
                    .rui-reset-password-btn button {
                        width: auto !important;
                    }
                }
            `}</style>
        </>
    );
};
