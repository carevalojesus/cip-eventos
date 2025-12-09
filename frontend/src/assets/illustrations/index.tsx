/**
 * Ilustraciones SVG personalizadas para estados vacíos
 * Estilo inspirado en unDraw, usando los colores del sistema CIP
 *
 * Colores utilizados:
 * - Primary: #BA2525 (Red CIP)
 * - Secondary: #E8E6E1 (Grey 100)
 * - Accent: #0E7C86 (Cyan 700)
 * - Light: #FAF9F7 (Grey 50)
 */

import React from "react";

interface IllustrationProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

const defaultColors = {
  primary: "#BA2525",
  secondary: "#E8E6E1",
  accent: "#0E7C86",
  light: "#FAF9F7",
  skin: "#FFD5C2",
  dark: "#504A40",
};

/**
 * Ilustración para estado sin datos genérico
 */
export const IllustrationNoData: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  primaryColor = defaultColors.primary,
  secondaryColor = defaultColors.secondary,
  accentColor = defaultColors.accent,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Fondo decorativo */}
    <ellipse cx="100" cy="145" rx="70" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Caja/Folder vacío */}
    <path
      d="M40 50 L40 120 Q40 130 50 130 L150 130 Q160 130 160 120 L160 50"
      fill={defaultColors.light}
      stroke={secondaryColor}
      strokeWidth="2"
    />
    <path
      d="M40 50 L40 45 Q40 35 50 35 L80 35 L90 45 L150 45 Q160 45 160 55 L160 50"
      fill={secondaryColor}
      stroke={secondaryColor}
      strokeWidth="1"
    />

    {/* Líneas decorativas dentro de la caja */}
    <line x1="60" y1="70" x2="140" y2="70" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />
    <line x1="60" y1="85" x2="120" y2="85" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />
    <line x1="60" y1="100" x2="100" y2="100" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />

    {/* Círculo con signo de interrogación */}
    <circle cx="145" cy="40" r="22" fill={primaryColor} />
    <text x="145" y="48" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">?</text>
  </svg>
);

/**
 * Ilustración para estado sin usuarios
 */
export const IllustrationNoUsers: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  primaryColor = defaultColors.primary,
  secondaryColor = defaultColors.secondary,
  accentColor = defaultColors.accent,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Sombra */}
    <ellipse cx="100" cy="145" rx="60" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Usuario principal (centro) - silueta */}
    <circle cx="100" cy="55" r="25" fill={secondaryColor} />
    <path
      d="M55 130 Q55 95 100 95 Q145 95 145 130"
      fill={secondaryColor}
    />

    {/* Usuario izquierdo (más pequeño, desvanecido) */}
    <circle cx="45" cy="65" r="15" fill={secondaryColor} opacity="0.5" />
    <path
      d="M20 115 Q20 90 45 90 Q70 90 70 115"
      fill={secondaryColor}
      opacity="0.5"
    />

    {/* Usuario derecho (más pequeño, desvanecido) */}
    <circle cx="155" cy="65" r="15" fill={secondaryColor} opacity="0.5" />
    <path
      d="M130 115 Q130 90 155 90 Q180 90 180 115"
      fill={secondaryColor}
      opacity="0.5"
    />

    {/* Icono de añadir usuario */}
    <circle cx="160" cy="35" r="20" fill={primaryColor} />
    <line x1="150" y1="35" x2="170" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <line x1="160" y1="25" x2="160" y2="45" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/**
 * Ilustración para estado sin eventos
 */
export const IllustrationNoEvents: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  primaryColor = defaultColors.primary,
  secondaryColor = defaultColors.secondary,
  accentColor = defaultColors.accent,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Sombra */}
    <ellipse cx="100" cy="145" rx="65" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Calendario base */}
    <rect x="35" y="35" width="130" height="100" rx="8" fill={defaultColors.light} stroke={secondaryColor} strokeWidth="2" />

    {/* Header del calendario */}
    <rect x="35" y="35" width="130" height="25" rx="8" fill={primaryColor} />
    <rect x="35" y="52" width="130" height="8" fill={primaryColor} />

    {/* Agujeros del calendario */}
    <rect x="55" y="28" width="8" height="20" rx="2" fill={secondaryColor} />
    <rect x="95" y="28" width="8" height="20" rx="2" fill={secondaryColor} />
    <rect x="135" y="28" width="8" height="20" rx="2" fill={secondaryColor} />

    {/* Días del calendario (grid) */}
    <g fill={secondaryColor} opacity="0.6">
      <rect x="50" y="75" width="20" height="15" rx="2" />
      <rect x="80" y="75" width="20" height="15" rx="2" />
      <rect x="110" y="75" width="20" height="15" rx="2" />
      <rect x="140" y="75" width="15" height="15" rx="2" />

      <rect x="50" y="100" width="20" height="15" rx="2" />
      <rect x="80" y="100" width="20" height="15" rx="2" />
      <rect x="110" y="100" width="20" height="15" rx="2" />
      <rect x="140" y="100" width="15" height="15" rx="2" />
    </g>

    {/* Badge de "vacío" */}
    <circle cx="165" cy="35" r="18" fill={accentColor} />
    <line x1="155" y1="35" x2="175" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/**
 * Ilustración para estado sin resultados de búsqueda
 */
export const IllustrationNoResults: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  primaryColor = defaultColors.primary,
  secondaryColor = defaultColors.secondary,
  accentColor = defaultColors.accent,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Sombra */}
    <ellipse cx="100" cy="145" rx="60" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Lupa */}
    <circle cx="85" cy="70" r="40" fill="none" stroke={secondaryColor} strokeWidth="8" />
    <circle cx="85" cy="70" r="30" fill={defaultColors.light} />
    <line x1="115" y1="100" x2="145" y2="130" stroke={secondaryColor} strokeWidth="10" strokeLinecap="round" />

    {/* X dentro de la lupa */}
    <line x1="70" y1="55" x2="100" y2="85" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" />
    <line x1="100" y1="55" x2="70" y2="85" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" />

    {/* Documentos detrás */}
    <rect x="130" y="40" width="35" height="45" rx="3" fill={secondaryColor} opacity="0.4" transform="rotate(10 130 40)" />
    <rect x="140" y="35" width="35" height="45" rx="3" fill={secondaryColor} opacity="0.6" transform="rotate(-5 140 35)" />
  </svg>
);

/**
 * Ilustración para estado de error
 */
export const IllustrationError: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  primaryColor = defaultColors.primary,
  secondaryColor = defaultColors.secondary,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Sombra */}
    <ellipse cx="100" cy="145" rx="55" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Triángulo de advertencia */}
    <path
      d="M100 25 L165 125 L35 125 Z"
      fill={defaultColors.light}
      stroke={primaryColor}
      strokeWidth="3"
    />

    {/* Signo de exclamación */}
    <line x1="100" y1="55" x2="100" y2="90" stroke={primaryColor} strokeWidth="6" strokeLinecap="round" />
    <circle cx="100" cy="108" r="5" fill={primaryColor} />

    {/* Pequeños rayos decorativos */}
    <line x1="45" y1="55" x2="30" y2="45" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
    <line x1="40" y1="75" x2="22" y2="75" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
    <line x1="155" y1="55" x2="170" y2="45" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
    <line x1="160" y1="75" x2="178" y2="75" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/**
 * Ilustración para estado de éxito
 */
export const IllustrationSuccess: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  secondaryColor = defaultColors.secondary,
  accentColor = defaultColors.accent,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Sombra */}
    <ellipse cx="100" cy="145" rx="55" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Círculo de fondo */}
    <circle cx="100" cy="75" r="55" fill={defaultColors.light} stroke={secondaryColor} strokeWidth="2" />

    {/* Círculo de éxito */}
    <circle cx="100" cy="75" r="40" fill="#22C55E" />

    {/* Checkmark */}
    <path
      d="M75 75 L90 90 L125 55"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Estrellas decorativas */}
    <circle cx="45" cy="40" r="4" fill={accentColor} />
    <circle cx="155" cy="45" r="3" fill={accentColor} />
    <circle cx="160" cy="110" r="5" fill={accentColor} />
    <circle cx="35" cy="100" r="3" fill={accentColor} />
  </svg>
);

/**
 * Ilustración para estado sin certificados
 */
export const IllustrationNoCertificates: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  primaryColor = defaultColors.primary,
  secondaryColor = defaultColors.secondary,
  accentColor = defaultColors.accent,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Sombra */}
    <ellipse cx="100" cy="145" rx="65" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Certificado base */}
    <rect x="40" y="25" width="120" height="95" rx="4" fill={defaultColors.light} stroke={secondaryColor} strokeWidth="2" />

    {/* Borde decorativo del certificado */}
    <rect x="48" y="33" width="104" height="79" rx="2" fill="none" stroke={secondaryColor} strokeWidth="1" strokeDasharray="4 2" />

    {/* Líneas de texto */}
    <line x1="60" y1="50" x2="140" y2="50" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />
    <line x1="70" y1="65" x2="130" y2="65" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />
    <line x1="65" y1="80" x2="135" y2="80" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />

    {/* Sello/Medallón */}
    <circle cx="100" cy="105" r="18" fill={primaryColor} opacity="0.2" />
    <circle cx="100" cy="105" r="12" fill={primaryColor} />

    {/* Cintas del sello */}
    <path d="M92 115 L88 135 L100 128 L112 135 L108 115" fill={primaryColor} />

    {/* Badge de vacío */}
    <circle cx="155" cy="30" r="16" fill={accentColor} />
    <line x1="147" y1="30" x2="163" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/**
 * Ilustración para estado sin inscripciones
 */
export const IllustrationNoRegistrations: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  primaryColor = defaultColors.primary,
  secondaryColor = defaultColors.secondary,
  accentColor = defaultColors.accent,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Sombra */}
    <ellipse cx="100" cy="145" rx="65" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Clipboard */}
    <rect x="50" y="30" width="100" height="110" rx="6" fill={defaultColors.light} stroke={secondaryColor} strokeWidth="2" />

    {/* Clip del clipboard */}
    <rect x="75" y="22" width="50" height="20" rx="3" fill={secondaryColor} />
    <rect x="85" y="28" width="30" height="10" rx="2" fill={defaultColors.light} />

    {/* Checkboxes vacíos */}
    <rect x="65" y="55" width="16" height="16" rx="3" fill="none" stroke={secondaryColor} strokeWidth="2" />
    <line x1="90" y1="63" x2="130" y2="63" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />

    <rect x="65" y="80" width="16" height="16" rx="3" fill="none" stroke={secondaryColor} strokeWidth="2" />
    <line x1="90" y1="88" x2="125" y2="88" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />

    <rect x="65" y="105" width="16" height="16" rx="3" fill="none" stroke={secondaryColor} strokeWidth="2" />
    <line x1="90" y1="113" x2="120" y2="113" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />

    {/* Badge de añadir */}
    <circle cx="150" cy="35" r="18" fill={primaryColor} />
    <line x1="141" y1="35" x2="159" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <line x1="150" y1="26" x2="150" y2="44" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/**
 * Ilustración para estado sin notificaciones
 */
export const IllustrationNoNotifications: React.FC<IllustrationProps> = ({
  width = 200,
  height = 160,
  primaryColor = defaultColors.primary,
  secondaryColor = defaultColors.secondary,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Sombra */}
    <ellipse cx="100" cy="145" rx="55" ry="8" fill={secondaryColor} opacity="0.5" />

    {/* Campana */}
    <path
      d="M100 25 C100 25 70 35 70 75 L70 95 L60 105 L140 105 L130 95 L130 75 C130 35 100 25 100 25"
      fill={defaultColors.light}
      stroke={secondaryColor}
      strokeWidth="3"
    />

    {/* Base de la campana */}
    <ellipse cx="100" cy="105" rx="40" ry="8" fill={secondaryColor} />

    {/* Badajo */}
    <path d="M90 105 Q100 125 110 105" fill={secondaryColor} />

    {/* Aro superior */}
    <circle cx="100" cy="25" r="6" fill={secondaryColor} />

    {/* Z's de sueño/silencio */}
    <text x="140" y="45" fill={primaryColor} fontSize="20" fontWeight="bold">Z</text>
    <text x="155" y="60" fill={primaryColor} fontSize="16" fontWeight="bold" opacity="0.7">z</text>
    <text x="165" y="72" fill={primaryColor} fontSize="12" fontWeight="bold" opacity="0.5">z</text>
  </svg>
);

// Exportar mapa de ilustraciones para uso dinámico
export const illustrations = {
  "no-data": IllustrationNoData,
  "no-users": IllustrationNoUsers,
  "no-events": IllustrationNoEvents,
  "no-results": IllustrationNoResults,
  "no-certificates": IllustrationNoCertificates,
  "no-registrations": IllustrationNoRegistrations,
  "no-notifications": IllustrationNoNotifications,
  error: IllustrationError,
  success: IllustrationSuccess,
} as const;

export type IllustrationType = keyof typeof illustrations;
