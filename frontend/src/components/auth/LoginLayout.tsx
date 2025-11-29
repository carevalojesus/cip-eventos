import React from "react";
import { useTranslation } from "react-i18next";

interface LoginLayoutProps {
  brandPanel: React.ReactNode;
  children: React.ReactNode;
}

/**
 * LoginLayout Component
 * Two-column layout: 60% branding, 40% form
 * Refactored following Refactoring UI principles
 */
export const LoginLayout: React.FC<LoginLayoutProps> = ({
  brandPanel,
  children,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rui-login-page">
      {/* Left Panel - Brand (60% width) */}
      <div className="rui-branding-panel hidden lg:block">
        {brandPanel}
      </div>

      {/* Right Panel - Form (40% width) */}
      <div className="rui-login-panel">
        <div className="rui-login-container">
          {/* Header - Jerarquía clara */}
          <div className="rui-form-header">
            <h1 className="rui-title-primary">
              {t("login.title")}
            </h1>
            <p className="rui-subtitle-secondary">
              {t("login.subtitle")}
            </p>
          </div>

          {/* Form Content */}
          {children}

          {/* Footer - Texto terciario */}
          <div className="rui-form-footer rui-text-tertiary">
            <p>{t("login.footer.platform")}</p>
            <p>
              {t("login.footer.developed_by")}{" "}
              <a href="#">{t("login.footer.company")}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
