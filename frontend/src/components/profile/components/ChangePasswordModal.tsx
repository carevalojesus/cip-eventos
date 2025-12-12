/**
 * ChangePasswordModal Component
 *
 * Modal para cambiar contraseña del usuario.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Key, Lock, X, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validate = (): string | null => {
        if (!currentPassword) {
            return t(
                "change_password.validation.current_required",
                "Ingresa tu contraseña actual"
            );
        }
        if (!newPassword) {
            return t(
                "change_password.validation.new_required",
                "Ingresa la nueva contraseña"
            );
        }
        if (newPassword.length < 8) {
            return t(
                "change_password.validation.min_length",
                "La contraseña debe tener al menos 8 caracteres"
            );
        }
        if (!/[A-Z]/.test(newPassword)) {
            return t(
                "change_password.validation.uppercase",
                "La contraseña debe contener al menos una mayúscula"
            );
        }
        if (!/[0-9]/.test(newPassword)) {
            return t(
                "change_password.validation.number",
                "La contraseña debe contener al menos un número"
            );
        }
        if (newPassword !== confirmPassword) {
            return t(
                "change_password.validation.mismatch",
                "Las contraseñas no coinciden"
            );
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.post("/auth/change-password", {
                currentPassword,
                newPassword,
            });
            toast.success(
                t(
                    "profile.password_changed",
                    "Contraseña cambiada exitosamente"
                )
            );
            handleClose();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                t("errors.unknown", "Error desconocido");
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="profile__modal-overlay" onClick={handleClose}>
            <div
                className="profile__modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="profile__modal-header">
                    <div className="profile__modal-icon">
                        <Key size={20} weight="duotone" />
                    </div>
                    <h2 className="profile__modal-title">
                        {t("profile.change_password", "Cambiar Contraseña")}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        style={{ marginLeft: "auto" }}
                    >
                        <X size={18} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="profile__modal-content">
                        <div className="profile__modal-form">
                            <Input
                                label={t(
                                    "change_password.current",
                                    "Contraseña actual"
                                )}
                                type="password"
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                }
                                placeholder={t(
                                    "change_password.current_placeholder",
                                    "Ingresa tu contraseña actual"
                                )}
                                leftIcon={<Lock size={16} />}
                                showPasswordToggle
                            />

                            <Input
                                label={t(
                                    "change_password.new",
                                    "Nueva contraseña"
                                )}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t(
                                    "change_password.new_placeholder",
                                    "Ingresa la nueva contraseña"
                                )}
                                leftIcon={<Lock size={16} />}
                                showPasswordToggle
                            />

                            <Input
                                label={t(
                                    "change_password.confirm",
                                    "Confirmar contraseña"
                                )}
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder={t(
                                    "change_password.confirm_placeholder",
                                    "Confirma la nueva contraseña"
                                )}
                                leftIcon={<Lock size={16} />}
                                showPasswordToggle
                            />

                            {error && (
                                <div className="profile__modal-message profile__modal-message--error">
                                    <Warning size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile__modal-footer">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            {t("common.cancel", "Cancelar")}
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                        >
                            {t(
                                "profile.change_password_submit",
                                "Cambiar Contraseña"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
