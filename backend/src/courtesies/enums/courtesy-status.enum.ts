export enum CourtesyStatus {
  ACTIVE = 'ACTIVE', // Cortesía activa
  USED = 'USED', // Ya se usó (tiene registration/enrollments)
  CANCELLED = 'CANCELLED', // Cancelada por el organizador
  EXPIRED = 'EXPIRED', // Expiró sin ser usada
}
