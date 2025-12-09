import React from "react";
import { spacing, radius, fontSize, semanticColors, colors } from "@/lib/styleTokens";
import {
  illustrations,
  type IllustrationType,
  type IllustrationProps,
} from "@/assets/illustrations";

type EmptyStateVariant = "default" | "compact" | "card";
type EmptyStateSize = "sm" | "md" | "lg";

interface EmptyStateBaseProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
}

interface EmptyStateWithIcon extends EmptyStateBaseProps {
  icon: React.ReactNode;
  illustration?: never;
  illustrationProps?: never;
}

interface EmptyStateWithIllustration extends EmptyStateBaseProps {
  icon?: never;
  illustration: IllustrationType;
  illustrationProps?: Omit<IllustrationProps, "width" | "height">;
}

export type EmptyStateProps = EmptyStateWithIcon | EmptyStateWithIllustration;

const sizeConfig = {
  sm: {
    padding: `${spacing["3xl"]} ${spacing["2xl"]}`,
    iconSize: 48,
    illustrationWidth: 140,
    illustrationHeight: 112,
    titleSize: fontSize.sm,
    descSize: fontSize.xs,
    gap: spacing.md,
    maxWidth: "260px",
  },
  md: {
    padding: `${spacing["5xl"]} ${spacing["3xl"]}`,
    iconSize: 64,
    illustrationWidth: 180,
    illustrationHeight: 144,
    titleSize: fontSize.base,
    descSize: fontSize.sm,
    gap: spacing.lg,
    maxWidth: "320px",
  },
  lg: {
    padding: `${spacing["6xl"]} ${spacing["4xl"]}`,
    iconSize: 80,
    illustrationWidth: 220,
    illustrationHeight: 176,
    titleSize: fontSize.lg,
    descSize: fontSize.base,
    gap: spacing.xl,
    maxWidth: "380px",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  illustration,
  illustrationProps,
  title,
  description,
  action,
  variant = "default",
  size = "md",
}) => {
  const config = sizeConfig[size];

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: config.padding,
    backgroundColor: semanticColors.bgPrimary,
    borderRadius: radius.xl,
    border: variant === "card" ? `1px solid ${semanticColors.borderLight}` : `1px dashed ${semanticColors.borderLight}`,
    textAlign: "center",
    gap: config.gap,
  };

  const iconContainerStyle: React.CSSProperties = {
    width: `${config.iconSize}px`,
    height: `${config.iconSize}px`,
    borderRadius: "50%",
    backgroundColor: colors.grey[100],
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const illustrationContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: config.titleSize,
    fontWeight: 600,
    color: semanticColors.textPrimary,
    margin: 0,
    lineHeight: 1.3,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: config.descSize,
    color: semanticColors.textMuted,
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

  // Renderizar icono o ilustración
  const renderVisual = () => {
    if (illustration) {
      const IllustrationComponent = illustrations[illustration];
      return (
        <div style={illustrationContainerStyle} aria-hidden="true">
          <IllustrationComponent
            width={config.illustrationWidth}
            height={config.illustrationHeight}
            {...illustrationProps}
          />
        </div>
      );
    }

    if (icon) {
      return (
        <div style={iconContainerStyle} aria-hidden="true">
          {icon}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={containerStyle} role="status" aria-label={title}>
      {renderVisual()}
      <div style={textContainerStyle}>
        <h3 style={titleStyle}>{title}</h3>
        {description && <p style={descriptionStyle}>{description}</p>}
      </div>
      {action}
    </div>
  );
};

export default EmptyState;
