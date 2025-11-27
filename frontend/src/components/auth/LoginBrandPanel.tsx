import React from "react";
import { useTranslation } from "react-i18next";
import { AUTH_ASSETS } from "@/constants/auth";
import { QuoteCarousel } from "./QuoteCarousel";

/**
 * LoginBrandPanel Component
 * Displays institutional branding, logo, and quote on the left side of the login page
 */
export const LoginBrandPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-left"
        style={{
          backgroundImage: `url("${AUTH_ASSETS.background}")`,
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-neutral-900/80" />

      {/* Logo and Brand */}
      <div className="relative z-20 flex items-center gap-4">
        <img
          src={AUTH_ASSETS.logo}
          alt="Logo CIP"
          className="h-16 w-auto drop-shadow-2xl"
        />
        {/* Vertical Separator */}
        <div className="h-12 w-px bg-white/80" />

        <div
          className="flex flex-col justify-center text-white tracking-widest uppercase"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          <span className="text-lg font-semibold leading-none drop-shadow-md">
            {t("login.brand.council")}
          </span>
          <span className="text-lg font-semibold leading-none mt-1 text-primary-foreground drop-shadow-md">
            {t("login.brand.region")}
          </span>
        </div>
      </div>

      {/* Institutional Quote Carousel */}
      <QuoteCarousel interval={8000} />
    </div>
  );
};
