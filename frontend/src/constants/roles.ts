/**
 * Roles del sistema SIGE-Eventos
 * Basado en la especificación funcional v6.1
 */

export enum UserRole {
  /** Administrador de la plataforma completa */
  SUPER_ADMIN = 'SUPER_ADMIN',

  /** Administrador de un organizador específico (ej: Ana) */
  ORG_ADMIN = 'ORG_ADMIN',

  /** Staff de puerta/acreditación - escanea QR, marca asistencia */
  ORG_STAFF_ACCESO = 'ORG_STAFF_ACCESO',

  /** Staff académico - gestiona asistencias y notas */
  ORG_STAFF_ACADEMICO = 'ORG_STAFF_ACADEMICO',

  /** Staff de finanzas - pagos, comprobantes, reembolsos */
  ORG_FINANZAS = 'ORG_FINANZAS',

  /** Ponente - ve sus sesiones, sube material */
  PONENTE = 'PONENTE',

  /** Participante con cuenta - ve su historial, certificados */
  PARTICIPANTE = 'PARTICIPANTE',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrador',
  [UserRole.ORG_ADMIN]: 'Administrador',
  [UserRole.ORG_STAFF_ACCESO]: 'Staff de Acceso',
  [UserRole.ORG_STAFF_ACADEMICO]: 'Staff Académico',
  [UserRole.ORG_FINANZAS]: 'Finanzas',
  [UserRole.PONENTE]: 'Ponente',
  [UserRole.PARTICIPANTE]: 'Participante',
}

export const ROLE_LABELS_EN: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrator',
  [UserRole.ORG_ADMIN]: 'Administrator',
  [UserRole.ORG_STAFF_ACCESO]: 'Access Staff',
  [UserRole.ORG_STAFF_ACADEMICO]: 'Academic Staff',
  [UserRole.ORG_FINANZAS]: 'Finance',
  [UserRole.PONENTE]: 'Speaker',
  [UserRole.PARTICIPANTE]: 'Participant',
}

/** Verifica si un rol tiene permisos de administración */
export const isAdminRole = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN].includes(role)
}

/** Verifica si un rol es de staff */
export const isStaffRole = (role: UserRole): boolean => {
  return [
    UserRole.ORG_STAFF_ACCESO,
    UserRole.ORG_STAFF_ACADEMICO,
    UserRole.ORG_FINANZAS,
  ].includes(role)
}

/** Verifica si un rol puede ver información financiera */
export const canViewFinance = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ORG_FINANZAS].includes(role)
}

/** Verifica si un rol puede gestionar eventos */
export const canManageEvents = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN].includes(role)
}

/** Verifica si un rol puede gestionar notas y asistencias académicas */
export const canManageAcademics = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ORG_STAFF_ACADEMICO].includes(role)
}

/** Verifica si un rol puede escanear QR y controlar acceso */
export const canControlAccess = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ORG_STAFF_ACCESO].includes(role)
}
