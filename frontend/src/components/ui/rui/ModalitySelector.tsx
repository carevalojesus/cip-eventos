import React from "react";
import { useTranslation } from "react-i18next";
import type { EventModality } from "@/types/event";

interface ModalitySelectorProps {
  modalities: EventModality[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

// Iconos duotone para cada modalidad
const PresencialIcon: React.FC<{ selected?: boolean }> = ({ selected }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
    <g>
      <path
        style={{ fill: selected ? "var(--color-red-100)" : "var(--color-grey-200)" }}
        d="M12 1v6a3 3 0 0 0 0 6v9.31a1 1 0 0 1-.7-.29l-5.66-5.66A9 9 0 0 1 12 1z"
      />
      <path
        style={{ fill: selected ? "var(--color-primary)" : "var(--color-grey-400)" }}
        d="M12 1a9 9 0 0 1 6.36 15.36l-5.65 5.66a1 1 0 0 1-.71.3V13a3 3 0 0 0 0-6V1z"
      />
    </g>
  </svg>
);

const VirtualIcon: React.FC<{ selected?: boolean }> = ({ selected }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
    <path
      style={{ fill: selected ? "var(--color-red-100)" : "var(--color-grey-200)" }}
      d="M13.59 12l6.7-6.7A1 1 0 0 1 22 6v12a1 1 0 0 1-1.7.7L13.58 12z"
    />
    <rect
      width="14"
      height="14"
      x="2"
      y="5"
      style={{ fill: selected ? "var(--color-primary)" : "var(--color-grey-400)" }}
      rx="2"
    />
  </svg>
);

const HibridoIcon: React.FC<{ selected?: boolean }> = ({ selected }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
    <circle
      cx="12"
      cy="12"
      r="10"
      style={{ fill: selected ? "var(--color-primary)" : "var(--color-grey-400)" }}
    />
    <path
      style={{ fill: selected ? "var(--color-red-100)" : "var(--color-grey-200)" }}
      d="M2.05 11A10 10 0 0 1 15 2.46V6a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-1 1.73V12h2a2 2 0 0 1 2 2v1h2a2 2 0 0 1 2 2v2.14A9.97 9.97 0 0 1 12 22v-4h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1-2-2v-1H2.05z"
    />
  </svg>
);

// Map de iconos por nombre de modalidad (case insensitive)
const getIconForModality = (name: string, selected: boolean) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("presencial") || normalized.includes("person") || normalized.includes("in-person")) {
    return <PresencialIcon selected={selected} />;
  }
  if (normalized.includes("virtual") || normalized.includes("online") || normalized.includes("remoto")) {
    return <VirtualIcon selected={selected} />;
  }
  if (normalized.includes("híbrido") || normalized.includes("hibrido") || normalized.includes("hybrid")) {
    return <HibridoIcon selected={selected} />;
  }
  // Default: presencial icon
  return <PresencialIcon selected={selected} />;
};

// Descripción por modalidad
const getDescriptionForModality = (name: string, t: (key: string, fallback?: string) => string): string => {
  const normalized = name.toLowerCase();
  if (normalized.includes("presencial") || normalized.includes("person") || normalized.includes("in-person")) {
    return t("modality.in_person_description", "Los participantes asisten físicamente al evento");
  }
  if (normalized.includes("virtual") || normalized.includes("online") || normalized.includes("remoto")) {
    return t("modality.virtual_description", "El evento se realiza completamente en línea");
  }
  if (normalized.includes("híbrido") || normalized.includes("hibrido") || normalized.includes("hybrid")) {
    return t("modality.hybrid_description", "Combina asistencia presencial y virtual");
  }
  return "";
};

export const ModalitySelector: React.FC<ModalitySelectorProps> = ({
  modalities,
  value,
  onChange,
  error,
  required,
}) => {
  const { t } = useTranslation();

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
  };

  const cardsContainerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: modalities.length <= 3 ? `repeat(${modalities.length}, 1fr)` : "repeat(2, 1fr)",
    gap: "var(--space-3)",
  };

  const getCardStyle = (isSelected: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "var(--space-4)",
    gap: "var(--space-2)",
    backgroundColor: isSelected ? "var(--color-red-050)" : "var(--color-bg-primary)",
    border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-grey-200)"}`,
    borderRadius: "var(--radius-lg)",
    cursor: "pointer",
    transition: "all 150ms ease",
    outline: "none",
    minHeight: "120px",
  });

  const titleStyle = (isSelected: boolean): React.CSSProperties => ({
    fontSize: "var(--font-size-sm)",
    fontWeight: 600,
    color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
    textAlign: "center",
    margin: 0,
  });

  const descriptionStyle = (isSelected: boolean): React.CSSProperties => ({
    fontSize: "var(--font-size-xs)",
    color: isSelected ? "var(--color-text-secondary)" : "var(--color-text-muted)",
    textAlign: "center",
    lineHeight: "var(--line-height-normal)",
    margin: 0,
  });

  const errorStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-primary)",
    marginTop: "var(--space-1)",
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>
        {t("create_event.config.modality", "Modalidad")}
        {required && <span style={{ color: "var(--color-primary)", marginLeft: "2px" }}>*</span>}
      </label>

      <div style={cardsContainerStyle}>
        {modalities.map((modality) => {
          const isSelected = value === modality.id.toString();
          return (
            <button
              key={modality.id}
              type="button"
              onClick={() => onChange(modality.id.toString())}
              style={getCardStyle(isSelected)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "var(--color-grey-300)";
                  e.currentTarget.style.backgroundColor = "var(--color-grey-050)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "var(--color-grey-200)";
                  e.currentTarget.style.backgroundColor = "var(--color-bg-primary)";
                }
              }}
            >
              {getIconForModality(modality.name, isSelected)}
              <span style={titleStyle(isSelected)}>{modality.name}</span>
              <p style={descriptionStyle(isSelected)}>
                {modality.description || getDescriptionForModality(modality.name, t)}
              </p>
            </button>
          );
        })}
      </div>

      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};
