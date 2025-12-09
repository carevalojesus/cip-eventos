import React, { useState } from "react";
import { type UseFormReturn, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Mail, Lock, ShieldCheck, RefreshCw, Copy, Check } from "lucide-react";

import { Input } from "@/components/ui/rui-input";
import { Button } from "@/components/ui/rui-button";
import { FormSelect } from "@/components/ui/rui/form";

import type { Role } from "@/services/users.service";
import type { CreateUserFormValues } from "@/hooks/useCreateUser";

interface CreateUserFormRuiProps {
    form: UseFormReturn<CreateUserFormValues>;
    roles: Role[];
    onSubmit: (data: CreateUserFormValues) => Promise<boolean>;
    submitting: boolean;
    onCancel: () => void;
}

// Función para generar contraseña segura
const generatePassword = (length: number = 12): string => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%&*";

    const allChars = lowercase + uppercase + numbers + symbols;

    // Asegurar al menos uno de cada tipo
    let password = "";
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Completar el resto
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mezclar caracteres
    return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
};

export const CreateUserFormRui: React.FC<CreateUserFormRuiProps> = ({
    form,
    roles,
    onSubmit,
    submitting,
    onCancel,
}) => {
    const { t } = useTranslation();
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(
        null
    );
    const [copied, setCopied] = useState(false);

    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = form;

    const handleGeneratePassword = () => {
        const newPassword = generatePassword(12);
        setGeneratedPassword(newPassword);
        setValue("password", newPassword);
        setValue("confirmPassword", newPassword);
        setCopied(false);
    };

    const handleCopyPassword = async () => {
        if (generatedPassword) {
            await navigator.clipboard.writeText(generatedPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleFormSubmit = handleSubmit(async (data) => {
        await onSubmit(data);
    });

    // Styles - Two column layout with emphasis on form (Refactoring UI)
    const containerStyle: React.CSSProperties = {
        maxWidth: "700px",
        margin: "0 auto",
        padding: "var(--space-6)",
    };

    const headerStyle: React.CSSProperties = {
        marginBottom: "var(--space-6)",
    };

    const backButtonStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "0",
        marginBottom: "var(--space-3)",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "color 150ms ease",
    };

    const titleStyle: React.CSSProperties = {
        fontSize: "var(--font-size-xl)",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        marginBottom: "var(--space-1)",
    };

    const subtitleStyle: React.CSSProperties = {
        fontSize: "var(--font-size-sm)",
        color: "var(--color-text-muted)",
    };

    // Section row: label column left + card with form right
    const sectionRowStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: "var(--space-6)",
        paddingBottom: "var(--space-6)",
        marginBottom: "var(--space-6)",
        borderBottom: "1px solid var(--color-grey-100)",
    };

    const sectionLabelStyle: React.CSSProperties = {
        paddingTop: "var(--space-4)",
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: "var(--font-size-sm)",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        marginBottom: "var(--space-1)",
    };

    const sectionDescStyle: React.CSSProperties = {
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-muted)",
        lineHeight: 1.5,
    };

    // Card container for form fields
    const formCardStyle: React.CSSProperties = {
        backgroundColor: "var(--color-bg-primary)",
        border: "1px solid var(--color-grey-200)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
    };

    const formFieldsStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
    };

    const actionsStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "var(--space-4)",
        marginTop: "var(--space-6)",
        paddingTop: "var(--space-5)",
        borderTop: "1px solid var(--color-grey-100)",
    };

    const cancelLinkStyle: React.CSSProperties = {
        padding: "0",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "color 150ms ease",
    };

    // Role options for select
    const roleOptions = roles.map((role) => ({
        value: role.id.toString(),
        label: role.description || role.name,
    }));

    return (
        <div style={containerStyle}>
            {/* Header */}
            <header style={headerStyle}>
                <button
                    type="button"
                    style={backButtonStyle}
                    onClick={onCancel}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--color-primary)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.color =
                            "var(--color-text-secondary)")
                    }
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    {t("users.back", "Volver")}
                </button>
                <h1 style={titleStyle}>
                    {t("users.create_title", "Crear Usuario")}
                </h1>
                <p style={subtitleStyle}>
                    {t(
                        "users.create_subtitle",
                        "Complete la información para registrar un nuevo usuario en el sistema."
                    )}
                </p>
            </header>

            <form onSubmit={handleFormSubmit}>
                {/* Section 1: Account Info */}
                <div style={sectionRowStyle}>
                    <div style={sectionLabelStyle}>
                        <h2 style={sectionTitleStyle}>
                            {t("users.account.title", "Cuenta")}
                        </h2>
                        <p style={sectionDescStyle}>
                            {t(
                                "users.account.description",
                                "Credenciales de acceso del usuario."
                            )}
                        </p>
                    </div>
                    <div style={formCardStyle}>
                        <div style={formFieldsStyle}>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="email"
                                        label={t(
                                            "users.account.email",
                                            "Email"
                                        )}
                                        placeholder={t(
                                            "users.account.email_placeholder",
                                            "usuario@ejemplo.com"
                                        )}
                                        error={errors.email?.message}
                                        required
                                        leftIcon={<Mail size={16} />}
                                        autoComplete="off"
                                    />
                                )}
                            />
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="password"
                                        label={t(
                                            "users.account.password",
                                            "Contraseña"
                                        )}
                                        placeholder={t(
                                            "users.account.password_placeholder",
                                            "Mínimo 6 caracteres"
                                        )}
                                        error={errors.password?.message}
                                        required
                                        leftIcon={<Lock size={16} />}
                                        showPasswordToggle
                                        showPasswordLabel={t(
                                            "login.show_password",
                                            "Mostrar"
                                        )}
                                        hidePasswordLabel={t(
                                            "login.hide_password",
                                            "Ocultar"
                                        )}
                                        autoComplete="new-password"
                                    />
                                )}
                            />
                            <Controller
                                name="confirmPassword"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="password"
                                        label={t(
                                            "users.account.confirm_password",
                                            "Confirmar Contraseña"
                                        )}
                                        placeholder={t(
                                            "users.account.confirm_password_placeholder",
                                            "Repite la contraseña"
                                        )}
                                        error={errors.confirmPassword?.message}
                                        required
                                        leftIcon={<Lock size={16} />}
                                        showPasswordToggle
                                        showPasswordLabel={t(
                                            "login.show_password",
                                            "Mostrar"
                                        )}
                                        hidePasswordLabel={t(
                                            "login.hide_password",
                                            "Ocultar"
                                        )}
                                        autoComplete="new-password"
                                    />
                                )}
                            />

                            {/* Password Generator */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "var(--space-3)",
                                    padding: "var(--space-4)",
                                    backgroundColor: "var(--color-grey-050)",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--color-grey-200)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "var(--space-3)",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "var(--font-size-sm)",
                                            fontWeight: 500,
                                            color: "var(--color-text-secondary)",
                                        }}
                                    >
                                        {t(
                                            "users.account.generate_password",
                                            "Generar contraseña segura"
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGeneratePassword}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            fontSize: "var(--font-size-sm)",
                                            fontWeight: 500,
                                            color: "var(--color-primary)",
                                            backgroundColor:
                                                "var(--color-bg-primary)",
                                            border: "1px solid var(--color-grey-300)",
                                            borderRadius: "var(--radius-md)",
                                            cursor: "pointer",
                                            transition: "all 150ms ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                "var(--color-grey-100)";
                                            e.currentTarget.style.borderColor =
                                                "var(--color-primary)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                "var(--color-bg-primary)";
                                            e.currentTarget.style.borderColor =
                                                "var(--color-grey-300)";
                                        }}
                                    >
                                        <RefreshCw size={14} />
                                        {t(
                                            "users.account.generate_btn",
                                            "Generar"
                                        )}
                                    </button>
                                </div>

                                {generatedPassword && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "var(--space-2)",
                                            padding: "var(--space-3)",
                                            backgroundColor:
                                                "var(--color-bg-primary)",
                                            borderRadius: "var(--radius-md)",
                                            border: "1px solid var(--color-grey-200)",
                                        }}
                                    >
                                        <code
                                            style={{
                                                flex: 1,
                                                fontFamily: "monospace",
                                                fontSize: "var(--font-size-sm)",
                                                color: "var(--color-text-primary)",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            {generatedPassword}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={handleCopyPassword}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: "6px",
                                                backgroundColor: copied
                                                    ? "var(--color-success-light)"
                                                    : "transparent",
                                                border: "none",
                                                borderRadius:
                                                    "var(--radius-sm)",
                                                cursor: "pointer",
                                                transition: "all 150ms ease",
                                            }}
                                            title={t(
                                                "users.account.copy_password",
                                                "Copiar contraseña"
                                            )}
                                        >
                                            {copied ? (
                                                <Check
                                                    size={16}
                                                    color="var(--color-success)"
                                                />
                                            ) : (
                                                <Copy
                                                    size={16}
                                                    color="var(--color-grey-500)"
                                                />
                                            )}
                                        </button>
                                    </div>
                                )}

                                <span
                                    style={{
                                        fontSize: "var(--font-size-xs)",
                                        color: "var(--color-text-muted)",
                                    }}
                                >
                                    {t(
                                        "users.account.generate_hint",
                                        "La contraseña generada incluye mayúsculas, minúsculas, números y símbolos."
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Role */}
                <div
                    style={{
                        ...sectionRowStyle,
                        borderBottom: "none",
                        marginBottom: 0,
                        paddingBottom: 0,
                    }}
                >
                    <div style={sectionLabelStyle}>
                        <h2 style={sectionTitleStyle}>
                            {t("users.role.title", "Rol")}
                        </h2>
                        <p style={sectionDescStyle}>
                            {t(
                                "users.role.description",
                                "Permisos y acceso del usuario en el sistema."
                            )}
                        </p>
                    </div>
                    <div style={formCardStyle}>
                        <div style={formFieldsStyle}>
                            <Controller
                                name="roleId"
                                control={control}
                                render={({ field }) => (
                                    <FormSelect
                                        label={t(
                                            "users.role.select_label",
                                            "Rol del Usuario"
                                        )}
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={roleOptions}
                                        placeholder={t(
                                            "form.select",
                                            "Seleccionar..."
                                        )}
                                        error={errors.roleId?.message}
                                        required
                                    />
                                )}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "var(--space-3)",
                                    padding: "var(--space-3)",
                                    backgroundColor: "var(--color-info-light)",
                                    borderRadius: "var(--radius-md)",
                                    fontSize: "var(--font-size-sm)",
                                    color: "var(--color-info-dark)",
                                }}
                            >
                                <ShieldCheck
                                    size={18}
                                    style={{ flexShrink: 0, marginTop: "2px" }}
                                />
                                <span>
                                    {t(
                                        "users.role.info",
                                        "El rol determina qué acciones puede realizar el usuario. Los administradores tienen acceso completo al sistema."
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={actionsStyle}>
                    <button
                        type="button"
                        style={cancelLinkStyle}
                        onClick={onCancel}
                        disabled={submitting}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.color =
                                "var(--color-text-primary)")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.color =
                                "var(--color-text-secondary)")
                        }
                    >
                        {t("form.cancel", "Cancelar")}
                    </button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={submitting}
                        isLoading={submitting}
                        loadingText={t("form.loading", "Guardando...")}
                    >
                        {t("users.create_btn", "Crear Usuario")}
                    </Button>
                </div>
            </form>
        </div>
    );
};
