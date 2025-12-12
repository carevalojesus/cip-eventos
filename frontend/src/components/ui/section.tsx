/**
 * Section Component - Refactoring UI Design System
 *
 * Componente para secciones de formularios con header icónico.
 * Unifica el patrón repetido en ProfileView, SettingsView, UserDetailView.
 *
 * @example
 * <Section>
 *   <Section.Header
 *     icon={<User />}
 *     iconVariant="account"
 *     title="Información Personal"
 *     subtitle="Datos básicos del usuario"
 *   />
 *   <Section.Content>
 *     {form fields}
 *   </Section.Content>
 * </Section>
 */
import React from "react";
import "./section.css";

// ============================================
// Types
// ============================================

type IconVariant =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "account"
    | "contact"
    | "nominal"
    | "integrations"
    | "email"
    | "security";

interface SectionProps {
    className?: string;
    children: React.ReactNode;
}

interface SectionHeaderProps {
    icon?: React.ReactNode;
    iconVariant?: IconVariant;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}

interface SectionContentProps {
    className?: string;
    children: React.ReactNode;
}

// ============================================
// Section Component
// ============================================

export const Section: React.FC<SectionProps> & {
    Header: React.FC<SectionHeaderProps>;
    Content: React.FC<SectionContentProps>;
} = ({ className = "", children }) => {
    return (
        <section className={`rui-section ${className}`}>{children}</section>
    );
};

// ============================================
// Section.Header
// ============================================

const SectionHeader: React.FC<SectionHeaderProps> = ({
    icon,
    iconVariant = "neutral",
    title,
    subtitle,
    action,
    className = "",
}) => {
    return (
        <div className={`rui-section__header ${className}`}>
            {icon && (
                <div
                    className={`rui-section__header-icon rui-section__header-icon--${iconVariant}`}
                >
                    {icon}
                </div>
            )}
            <div className="rui-section__header-content">
                <h3 className="rui-section__header-title">{title}</h3>
                {subtitle && (
                    <p className="rui-section__header-subtitle">{subtitle}</p>
                )}
            </div>
            {action && <div className="rui-section__header-action">{action}</div>}
        </div>
    );
};

Section.Header = SectionHeader;

// ============================================
// Section.Content
// ============================================

const SectionContent: React.FC<SectionContentProps> = ({
    className = "",
    children,
}) => {
    return <div className={`rui-section__content ${className}`}>{children}</div>;
};

Section.Content = SectionContent;

export default Section;
