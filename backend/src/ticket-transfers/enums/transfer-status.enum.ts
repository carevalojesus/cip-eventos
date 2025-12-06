export enum TransferStatus {
  PENDING = 'PENDING', // Esperando confirmación
  COMPLETED = 'COMPLETED', // Transferencia completada
  CANCELLED = 'CANCELLED', // Cancelada por el usuario
  REJECTED = 'REJECTED', // Rechazada (deadline pasado, ya asistió, etc.)
}
