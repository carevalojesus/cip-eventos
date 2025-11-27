import React from "react";
import { LoginLayout } from "./LoginLayout";
import { LoginBrandPanel } from "./LoginBrandPanel";
import { LoginForm } from "./LoginForm";

/**
 * LoginPage Component
 * Main login page that composes all login-related components
 *
 * Architecture:
 * - LoginLayout: Provides the two-column layout structure
 * - LoginBrandPanel: Left panel with branding and institutional info
 * - LoginForm: Right panel with authentication form
 *
 * Features:
 * - Fully componentized and reusable
 * - i18n support throughout
 * - Environment-based asset URLs
 * - Clean separation of concerns
 */
export const LoginPage: React.FC = () => {
  return (
    <LoginLayout brandPanel={<LoginBrandPanel />}>
      <LoginForm />
    </LoginLayout>
  );
};
