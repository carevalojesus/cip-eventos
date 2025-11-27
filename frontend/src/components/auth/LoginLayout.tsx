import React from "react";
import { useTranslation } from "react-i18next";

interface LoginLayoutProps {
  brandPanel: React.ReactNode;
  children: React.ReactNode;
}

/**
 * LoginLayout Component
 * Two-column layout for the login page
 * - Left: Brand panel with institutional information
 * - Right: Login form and footer
 */
export const LoginLayout: React.FC<LoginLayoutProps> = ({
  brandPanel,
  children,
}) => {
  const { t } = useTranslation();

  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-[3fr_2fr] lg:px-0">
      {/* Left Panel - Brand (60% width) */}
      {brandPanel}

      {/* Right Panel - Form (40% width) */}
      <div className="relative flex h-full items-center p-4 lg:p-8 bg-background">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("login.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("login.subtitle")}
            </p>
          </div>

          {/* Form Content */}
          {children}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
          <p>
            {t("login.footer.platform")}{" "}
            <span className="font-semibold text-foreground">
              {t("login.footer.council")}
            </span>
          </p>
          <p className="mt-2">
            {t("login.footer.developed_by")}{" "}
            <span className="font-bold text-primary">
              {t("login.footer.company")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
