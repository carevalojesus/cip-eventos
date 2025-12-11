import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  /** Ancho máximo del contenedor */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  /** Padding interno */
  padding?: "none" | "sm" | "md" | "lg";
  /** Clase CSS adicional */
  className?: string;
}

const maxWidthMap = {
  sm: "800px",
  md: "1000px",
  lg: "1200px",
  xl: "1400px",
  full: "100%",
};

const paddingMap = {
  none: "0",
  sm: "var(--space-4)",
  md: "var(--space-6)",
  lg: "var(--space-8)",
};

/**
 * PageContainer
 * 
 * Contenedor estándar para páginas del dashboard.
 * Proporciona un ancho máximo consistente y padding uniforme.
 * 
 * @example
 * <PageContainer maxWidth="lg" padding="md">
 *   <PageHeader title="Usuarios" />
 *   <UserTable />
 * </PageContainer>
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = "lg",
  padding = "md",
  className,
}) => {
  const containerStyle: React.CSSProperties = {
    maxWidth: maxWidthMap[maxWidth],
    margin: "0 auto",
    padding: paddingMap[padding],
    width: "100%",
  };

  return (
    <div style={containerStyle} className={className}>
      {children}
    </div>
  );
};

export default PageContainer;
