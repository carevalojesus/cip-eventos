export enum PaymentAttemptStatus {
  INITIATED = 'INITIATED', // Intento iniciado
  APPROVED = 'APPROVED', // Aprobado por la pasarela
  REJECTED = 'REJECTED', // Rechazado por la pasarela
  ERROR = 'ERROR', // Error técnico
  EXPIRED = 'EXPIRED', // Expiró sin completarse
}
