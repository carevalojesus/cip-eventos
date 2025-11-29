import React from "react";
import { useTranslation } from "react-i18next";
import { AUTH_ASSETS } from "@/constants/auth";
import { QuoteCarousel } from "./QuoteCarousel";

/**
 * LoginBrandPanel Component
 * Panel izquierdo con branding institucional
 * Refactored following Refactoring UI principles
 */
export const LoginBrandPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative h-full w-full">
      {/* Background Image */}
      <div
        className="rui-branding-background"
        style={{
          backgroundImage: `url("${AUTH_ASSETS.background}")`,
        }}
      />

      {/* Gradient Overlay - "Text needs consistent contrast" */}
      <div className="rui-branding-overlay" />

      {/* Content */}
      <div className="rui-branding-content">
        {/* Header con Logo */}
        <header className="rui-brand-header">
          <img
            src={AUTH_ASSETS.logo}
            alt="Logo CIP"
            className="rui-brand-logo drop-shadow-2xl"
          />
          <div className="rui-brand-text">
            <span className="rui-brand-title">
              {t("login.brand.council")}
            </span>
            <span className="rui-brand-subtitle">
              {t("login.brand.region")}
            </span>
          </div>
        </header>

        {/* Quote Carousel */}
        <QuoteCarousel interval={8000} />
      </div>
    </div>
  );
};
