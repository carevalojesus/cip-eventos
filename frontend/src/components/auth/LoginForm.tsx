import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Logic
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { AUTH_ROUTES } from "@/constants/auth";

/**
 * Creates a login schema with translated validation messages
 */
const createLoginSchema = (t: (key: string) => string) =>
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
 * Handles user authentication with email and password
 * Features:
 * - Form validation with Zod
 * - i18n support
 * - Loading states
 * - Error handling
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  // Create schema with current translations
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

      // Call onSuccess callback if provided, otherwise redirect
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || t("errors.network");
      setGlobalError(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("login.email")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("login.email_placeholder")}
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("login.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("login.password_placeholder")}
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Global Error Message */}
          {globalError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{globalError}</span>
            </div>
          )}

          <Button
            disabled={isSubmitting}
            type="submit"
            className="w-full font-bold"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("login.btn_loading")}
              </>
            ) : (
              t("login.btn")
            )}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-right">
            <a
              href={AUTH_ROUTES.forgotPassword}
              className="text-sm text-primary hover:underline font-medium"
            >
              {t("login.forgot_password")}
            </a>
          </div>

          {/* Access Problems Section */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("login.access_problems")}
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground space-y-4">
            <p>
              {t("login.contact_support")}{" "}
              <strong className="text-foreground">{t("login.support_it")}</strong>{" "}
              {t("login.support_message")}
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
};
