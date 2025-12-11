import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Envelope,
  Lock,
  ShieldCheck,
  ArrowsClockwise,
  Copy,
  Check,
} from "@phosphor-icons/react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form/index";

import { useCreateUser } from "@/hooks/useCreateUser";
import { generatePassword } from "@/lib/userUtils";

interface CreateUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateUserDrawer: React.FC<CreateUserDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { form, roles, submitting, onSubmit } = useCreateUser();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const {
    handleSubmit,
    control,
    setValue,
    reset,
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
    const success = await onSubmit(data);
    if (success) {
      setGeneratedPassword(null);
      onClose();
      onSuccess?.();
    }
  });

  const handleClose = () => {
    reset();
    setGeneratedPassword(null);
    onClose();
  };

  // Role options for select
  const roleOptions = roles.map((role) => ({
    value: role.id.toString(),
    label: role.description || role.name,
  }));

  // Styles
  const sectionStyle: React.CSSProperties = {
    marginBottom: "var(--space-5)",
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
    marginBottom: "var(--space-3)",
  };

  const formFieldsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent width="sm">
        <DrawerHeader>
          <DrawerTitle>{t("users.create_title", "Crear Usuario")}</DrawerTitle>
          <DrawerDescription>
            {t(
              "users.create_subtitle",
              "Complete la información para registrar un nuevo usuario en el sistema."
            )}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <form id="create-user-form" onSubmit={handleFormSubmit}>
        {/* Section 1: Account Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            {t("users.account.title", "Cuenta")}
          </h3>
          <p style={sectionDescStyle}>
            {t(
              "users.account.description",
              "Credenciales de acceso del usuario."
            )}
          </p>
          <div style={formFieldsStyle}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  label={t("users.account.email", "Email")}
                  placeholder={t(
                    "users.account.email_placeholder",
                    "usuario@ejemplo.com"
                  )}
                  error={errors.email?.message}
                  required
                  leftIcon={<Envelope size={16} />}
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
                  label={t("users.account.password", "Contraseña")}
                  placeholder={t(
                    "users.account.password_placeholder",
                    "Mínimo 6 caracteres"
                  )}
                  error={errors.password?.message}
                  required
                  leftIcon={<Lock size={16} />}
                  showPasswordToggle
                  showPasswordLabel={t("common.show", "Mostrar")}
                  hidePasswordLabel={t("common.hide", "Ocultar")}
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
                  showPasswordLabel={t("common.show", "Mostrar")}
                  hidePasswordLabel={t("common.hide", "Ocultar")}
                  autoComplete="new-password"
                />
              )}
            />

            {/* Password Generator */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                padding: "var(--space-3)",
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
                  gap: "var(--space-2)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
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
                    gap: "4px",
                    padding: "4px 8px",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 500,
                    color: "var(--color-primary)",
                    backgroundColor: "var(--color-bg-primary)",
                    border: "1px solid var(--color-grey-300)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-grey-100)";
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-primary)";
                    e.currentTarget.style.borderColor = "var(--color-grey-300)";
                  }}
                >
                  <ArrowsClockwise size={12} />
                  {t("users.account.generate_btn", "Generar")}
                </button>
              </div>

              {generatedPassword && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "var(--space-2)",
                    backgroundColor: "var(--color-bg-primary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-grey-200)",
                  }}
                >
                  <code
                    style={{
                      flex: 1,
                      fontFamily: "monospace",
                      fontSize: "var(--font-size-xs)",
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
                      padding: "4px",
                      backgroundColor: copied
                        ? "var(--color-success-light)"
                        : "transparent",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                    title={t(
                      "users.account.copy_password",
                      "Copiar contraseña"
                    )}
                  >
                    {copied ? (
                      <Check size={14} color="var(--color-success)" />
                    ) : (
                      <Copy size={14} color="var(--color-grey-500)" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Role */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>{t("users.role.title", "Rol")}</h3>
          <p style={sectionDescStyle}>
            {t(
              "users.role.description",
              "Permisos y acceso del usuario en el sistema."
            )}
          </p>
          <div style={formFieldsStyle}>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <FormSelect
                  label={t("users.role.select_label", "Rol del Usuario")}
                  value={field.value}
                  onChange={field.onChange}
                  options={roleOptions}
                  placeholder={t("form.select", "Seleccionar...")}
                  error={errors.roleId?.message}
                  required
                />
              )}
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-3)",
                backgroundColor: "var(--color-info-light)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-info-dark)",
              }}
            >
              <ShieldCheck
                size={14}
                style={{ flexShrink: 0, marginTop: "1px" }}
              />
              <span>
                {t(
                  "users.role.info_short",
                  "El rol determina los permisos del usuario en el sistema."
                )}
              </span>
            </div>
          </div>
        </div>
          </form>
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            {t("form.cancel", "Cancelar")}
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            variant="primary"
            disabled={submitting}
            isLoading={submitting}
            loadingText={t("form.loading", "Guardando...")}
          >
            {t("users.create_btn", "Crear Usuario")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateUserDrawer;
