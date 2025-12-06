export enum PurchaseOrderStatus {
  PENDING = 'PENDING', // Pendiente de pago
  PAID = 'PAID', // Pagado exitosamente
  EXPIRED = 'EXPIRED', // Expiró sin pagar - cupos liberados
  CANCELLED = 'CANCELLED', // Cancelado por el usuario
}
