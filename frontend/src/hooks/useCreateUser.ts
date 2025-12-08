import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { usersService, rolesService, type Role } from "@/services/users.service";
import { logger } from "@/utils/logger";

// Schema definition wrapper
export const createUserSchema = (t: (key: string, fallback?: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t("form.required", "Campo requerido"))
      .email(t("form.invalid_email", "Email inválido")),
    password: z
      .string()
      .min(6, t("form.min_length", "Mínimo {{count}} caracteres").replace("{{count}}", "6")),
    confirmPassword: z.string().min(1, t("form.required", "Campo requerido")),
    roleId: z.string().min(1, t("form.required", "Campo requerido")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("form.passwords_not_match", "Las contraseñas no coinciden"),
    path: ["confirmPassword"],
  });

export type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>;

export const useCreateUser = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema(t)),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      roleId: "",
    },
  });

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const rolesData = await rolesService.findAll();
        // Filtrar solo roles activos
        setRoles(rolesData.filter((role) => role.isActive));
      } catch (error) {
        logger.error("Error loading roles:", error);
        toast.error(t("users.toast.error_loading_roles", "Error al cargar roles"));
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [t]);

  const onSubmit = async (data: CreateUserFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        email: data.email,
        password: data.password,
        roleId: parseInt(data.roleId),
      };

      await usersService.create(payload);

      toast.success(t("users.toast.create_success", "Usuario creado"), {
        description: t(
          "users.toast.create_description",
          "El usuario ha sido creado exitosamente. Recibirá un email para verificar su cuenta."
        ),
      });

      // Reset form after success
      form.reset();

      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error("Backend error:", JSON.stringify(error.response.data, null, 2));

        const message = error.response.data.message;
        if (message?.includes("already exists") || message?.includes("ya existe")) {
          toast.error(t("users.toast.email_exists", "El email ya está registrado"), {
            description: t(
              "users.toast.email_exists_description",
              "Por favor, utiliza otro email."
            ),
          });
        } else {
          toast.error(t("users.toast.create_error", "Error al crear usuario"), {
            description:
              message || t("users.toast.error_description", "Revisa los datos e intenta nuevamente."),
          });
        }
      } else {
        logger.error("Error creating user:", error);
        toast.error(t("users.toast.create_error", "Error al crear usuario"), {
          description: t("users.toast.error_unexpected", "Ocurrió un error inesperado."),
        });
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    roles,
    loading,
    submitting,
    onSubmit,
  };
};
