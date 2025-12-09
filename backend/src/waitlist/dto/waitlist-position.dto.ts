export class WaitlistPositionDto {
  position: number; // Posición en la cola (1 = primero)
  totalInQueue: number; // Total de personas en espera
  status: string; // Estado actual
  estimatedWaitTime?: string; // Estimado de tiempo de espera (opcional)
}
