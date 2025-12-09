export enum WaitlistStatus {
  WAITING = 'WAITING', // En espera en la cola
  INVITED = 'INVITED', // Invitado a comprar (link enviado)
  CONVERTED = 'CONVERTED', // Convirtió en inscripción exitosa
  EXPIRED = 'EXPIRED', // Invitación venció sin comprar
  CANCELLED = 'CANCELLED', // Usuario se salió de la lista
}
