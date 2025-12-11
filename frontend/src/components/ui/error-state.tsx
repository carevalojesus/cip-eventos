import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { spacing, radius, fontSize, semanticColors, red } from "@/lib/styleTokens";
import { Button } from "./button";

type ErrorStateVariant = "inline" | "fullpage";
type ErrorStateSize = "sm" | "md" | "lg";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  variant?: ErrorStateVariant;
  size?: ErrorStateSize;
}

const sizeConfig = {
  sm: {
    padding: `${spacing["3xl"]} ${spacing["2xl"]}`,
    iconSize: 48,
    titleSize: fontSize.sm,
    messageSize: fontSize.xs,
    gap: spacing.md,
    maxWidth: "260px",
  },
  md: {
    padding: `${spacing["5xl"]} ${spacing["3xl"]}`,
    iconSize: 64,
    titleSize: fontSize.base,
    messageSize: fontSize.sm,
    gap: spacing.lg,
    maxWidth: "320px",
  },
  lg: {
    padding: `${spacing["6xl"]} ${spacing["4xl"]}`,
    iconSize: 80,
    titleSize: fontSize.lg,
    messageSize: fontSize.base,
    gap: spacing.xl,
    maxWidth: "380px",
  },
};

/**
 * ErrorState Component - Refactoring UI Design System
 *
 * Componente consistente para mostrar estados de error en toda la aplicación.
 *
 * @example
 * ```tsx
 * // Error básico
 * <ErrorState />
 *
 * // Error con acción de reintento
 * <ErrorState
 *   title="Error al cargar usuarios"
 *   message="No se pudo conectar con el servidor"
 *   onRetry={() => refetch()}
 * />
 *
 * // Error de página completa
 * <ErrorState
 *   variant="fullpage"
 *   size="lg"
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryLabel,
  icon,
  variant = "inline",
  size = "md",
}) => {
  const { t } = useTranslation();
  const config = sizeConfig[size];

  // Valores por defecto con traducciones
  const displayTitle = title ?? t("error.default_title", "Algo salió mal");
  const displayMessage = message ?? t("error.default_message", "Ha ocurrido un error inesperado");
  const displayRetryLabel = retryLabel ?? t("common.retry", "Reintentar");

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: config.padding,
    backgroundColor: semanticColors.bgPrimary,
    borderRadius: radius.xl,
    border: variant === "inline"
      ? `1px solid ${red[100]}`
      : "none",
    textAlign: "center",
    gap: config.gap,
    minHeight: variant === "fullpage" ? "400px" : "auto",
  };

  const iconContainerStyle: React.CSSProperties = {
    width: `${config.iconSize}px`,
    height: `${config.iconSize}px`,
    borderRadius: "50%",
    backgroundColor: red[50],
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: red[500],
    fontSize: `${config.iconSize * 0.5}px`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: config.titleSize,
    fontWeight: 600,
    color: semanticColors.textPrimary,
    margin: 0,
    lineHeight: 1.3,
  };

  const messageStyle: React.CSSProperties = {
    fontSize: config.messageSize,
    color: semanticColors.textSecondary,
    margin: 0,
    maxWidth: config.maxWidth,
    lineHeight: 1.5,
  };

  const textContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.xs,
  };

  // Icono por defecto: X en círculo
  const defaultIcon = (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );

  return (
    <div style={containerStyle} role="alert" aria-live="polite">
      <div style={iconContainerStyle}>
        {icon ?? defaultIcon}
      </div>
      <div style={textContainerStyle}>
        <h3 style={titleStyle}>{displayTitle}</h3>
        <p style={messageStyle}>{displayMessage}</p>
      </div>
      {onRetry && (
        <Button
          variant="primary"
          size={size === "sm" ? "sm" : "md"}
          onClick={onRetry}
        >
          {displayRetryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
