import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";

// UI Components - shadcn
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// Logic
import axios from "axios";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { AUTH_ROUTES } from "@/constants/auth";
import { getCurrentLocale, routes } from "@/lib/routes";

/**
 * Creates a login schema with translated validation messages
 */
const createLoginSchema = (t: any) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t("login.validation.email_required") })
      .email({ message: t("login.validation.email_invalid") }),
    password: z
      .string()
      .min(1, { message: t("login.validation.password_required") })
      .min(6, { message: t("login.validation.password_min") }),
  });

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

interface LoginFormProps {
  onSuccess?: () => void;
}

/**
 * LoginForm Component
 * Refactored following Refactoring UI principles
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  const loginSchema = createLoginSchema(t);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    try {
      const response = await api.post("/auth/login", data);
      login(response.data.access_token, response.data.user);

      if (onSuccess) {
        onSuccess();
      } else {
        const locale = getCurrentLocale();
        window.location.href = routes[locale].home;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || t("errors.network");
        setGlobalError(Array.isArray(msg) ? msg[0] : msg);
      } else if (err instanceof Error) {
        setGlobalError(err.message);
      } else {
        setGlobalError(t("errors.unknown"));
      }
    }
  };

  const { errors } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem className="rui-form-group">
              <label className="rui-label">{t("login.email")}</label>
              <FormControl>
                <input
                  type="email"
                  className={`rui-input ${fieldState.error ? 'rui-input-error' : ''}`}
                  placeholder={t("login.email_placeholder")}
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage className="rui-field-error" />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem className="rui-form-group">
              <label className="rui-label">{t("login.password")}</label>
              <FormControl>
                <input
                  type="password"
                  className={`rui-input ${fieldState.error ? 'rui-input-error' : ''}`}
                  placeholder={t("login.password_placeholder")}
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage className="rui-field-error" />
            </FormItem>
          )}
        />

        {/* Global Error Message */}
        {globalError && (
          <div className="rui-error-message animate-in fade-in slide-in-from-top-2">
            <AlertCircle />
            <span>{globalError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="rui-form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rui-btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                {t("login.btn_loading")}
              </>
            ) : (
              t("login.btn")
            )}
          </button>
        </div>

      </form>
    </Form>
  );
};
