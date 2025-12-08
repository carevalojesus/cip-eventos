/**
 * Configuración de navegación simplificada basada en roles
 * SIGE-Eventos - Sistema de Gestión de Eventos
 *
 * Estructura reducida para mejor UX:
 * - "Mi Perfil" se mueve al dropdown del header
 * - Secciones consolidadas para menos items visibles
 * - Reportes integrados en sus secciones principales
 */

import { UserRole } from '@/constants/roles'
import type { DuotoneIconProps } from '@/components/icons/DuotoneIcons'
import {
  IconDashboard,
  IconCalendar,
  IconSurvey,
  IconIdentification,
  IconCertificate,
  IconWallet,
  IconChart,
  IconUser,
  IconCog,
  IconOffice,
  IconQrCode,
} from '@/components/icons/DuotoneIcons'

export interface NavItem {
  id: string
  labelKey: string // key para i18n
  icon: React.ComponentType<DuotoneIconProps>
  roles: UserRole[] // roles que pueden ver este item
  badge?: string // opcional: badge de notificación
}

export interface NavSection {
  id: string
  titleKey?: string // key para i18n (opcional para secciones sin título)
  items: NavItem[]
}

/**
 * Configuración simplificada de navegación
 * Items reducidos por rol para mejor experiencia de usuario
 */
export const navigationConfig: NavSection[] = [
  // ═══════════════════════════════════════════════════════════════
  // GENERAL - Dashboard visible para todos
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'general',
    items: [
      {
        id: 'dashboard',
        labelKey: 'dashboard.nav.dashboard',
        icon: IconDashboard,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ORG_ADMIN,
          UserRole.ORG_STAFF_ACCESO,
          UserRole.ORG_STAFF_ACADEMICO,
          UserRole.ORG_FINANZAS,
          UserRole.PONENTE,
          UserRole.PARTICIPANTE,
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PLATAFORMA - Solo SUPER_ADMIN
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'platform',
    titleKey: 'dashboard.nav.platform_management',
    items: [
      {
        id: 'organizadores',
        labelKey: 'dashboard.nav.organizers',
        icon: IconOffice,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        id: 'metricas-globales',
        labelKey: 'dashboard.nav.global_metrics',
        icon: IconChart,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EVENTOS - Gestión de eventos (Admin/Super)
  // Ponentes, Entradas, Cortesías se acceden desde dentro de cada evento
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'events_management',
    titleKey: 'dashboard.nav.events_management',
    items: [
      {
        id: 'eventos',
        labelKey: 'dashboard.nav.my_events',
        icon: IconCalendar,
        roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
      },
      {
        id: 'inscripciones',
        labelKey: 'dashboard.nav.registrations',
        icon: IconSurvey,
        roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
      },
      {
        id: 'certificados',
        labelKey: 'dashboard.nav.certificates',
        icon: IconCertificate,
        roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // MIS SESIONES - PONENTE (solo 2 items)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'speaker_section',
    titleKey: 'dashboard.nav.my_sessions',
    items: [
      {
        id: 'mis-sesiones',
        labelKey: 'dashboard.nav.assigned_sessions',
        icon: IconCalendar,
        roles: [UserRole.PONENTE],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // MIS EVENTOS - PARTICIPANTE (reducido a 2 items esenciales)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'participant_section',
    titleKey: 'dashboard.nav.my_events_participant',
    items: [
      {
        id: 'mis-inscripciones',
        labelKey: 'dashboard.nav.my_registrations',
        icon: IconCalendar,
        roles: [UserRole.PARTICIPANTE],
      },
      {
        id: 'mis-certificados',
        labelKey: 'dashboard.nav.my_certificates',
        icon: IconCertificate,
        roles: [UserRole.PARTICIPANTE],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // OPERACIONES - Staff (items específicos por rol)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'operations',
    titleKey: 'dashboard.nav.operations',
    items: [
      {
        id: 'control-acceso',
        labelKey: 'dashboard.nav.access_control',
        icon: IconQrCode,
        roles: [UserRole.ORG_STAFF_ACCESO],
      },
      {
        id: 'asistencias',
        labelKey: 'dashboard.nav.attendance',
        icon: IconIdentification,
        roles: [UserRole.ORG_STAFF_ACADEMICO],
      },
      {
        id: 'evaluaciones',
        labelKey: 'dashboard.nav.evaluations',
        icon: IconSurvey,
        roles: [UserRole.ORG_STAFF_ACADEMICO],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // FINANZAS - Consolidado (3 items en vez de 5)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'finance',
    titleKey: 'dashboard.nav.finance',
    items: [
      {
        id: 'ingresos',
        labelKey: 'dashboard.nav.income',
        icon: IconWallet,
        roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ORG_FINANZAS],
      },
      {
        id: 'pagos',
        labelKey: 'dashboard.nav.payments',
        icon: IconChart,
        roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ORG_FINANZAS],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ADMINISTRACIÓN - Simplificado (2 items esenciales)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'administration',
    titleKey: 'dashboard.nav.administration',
    items: [
      {
        id: 'usuarios',
        labelKey: 'dashboard.nav.users',
        icon: IconUser,
        roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
      },
      {
        id: 'configuracion',
        labelKey: 'dashboard.nav.settings',
        icon: IconCog,
        roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
      },
    ],
  },
]

/**
 * Filtra la navegación según el rol del usuario
 */
export function getNavigationForRole(userRole: UserRole): NavSection[] {
  return navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((section) => section.items.length > 0)
}

/**
 * Obtiene todos los IDs de navegación permitidos para un rol
 */
export function getAllowedNavIds(userRole: UserRole): string[] {
  return navigationConfig
    .flatMap((section) => section.items)
    .filter((item) => item.roles.includes(userRole))
    .map((item) => item.id)
}

/**
 * Verifica si un usuario puede acceder a una ruta específica
 */
export function canAccessNav(userRole: UserRole, navId: string): boolean {
  const allowedIds = getAllowedNavIds(userRole)
  return allowedIds.includes(navId)
}

/**
 * Obtiene la ruta por defecto para un rol
 */
export function getDefaultNavForRole(userRole: UserRole): string {
  switch (userRole) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ORG_ADMIN:
      return 'dashboard'
    case UserRole.ORG_STAFF_ACCESO:
      return 'control-acceso'
    case UserRole.ORG_STAFF_ACADEMICO:
      return 'asistencias'
    case UserRole.ORG_FINANZAS:
      return 'ingresos'
    case UserRole.PONENTE:
      return 'mis-sesiones'
    case UserRole.PARTICIPANTE:
      return 'mis-inscripciones'
    default:
      return 'dashboard'
  }
}
