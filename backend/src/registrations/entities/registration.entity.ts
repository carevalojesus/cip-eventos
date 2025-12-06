import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { Event } from '../../events/entities/event.entity';
import { EventTicket } from '../../events/entities/event-ticket.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';

export enum RegistrationStatus {
  PENDING = 'PENDING', // Reserva pendiente de pago
  CONFIRMED = 'CONFIRMED', // Pago confirmado
  CANCELLED = 'CANCELLED', // Cancelado por usuario
  ATTENDED = 'ATTENDED', // Asistió al evento
  EXPIRED = 'EXPIRED', // Expiró sin pagar
  REFUNDED = 'REFUNDED', // Reembolsado
  IN_DISPUTE = 'IN_DISPUTE', // En disputa por contracargo
  CANCELLED_BY_CHARGEBACK = 'CANCELLED_BY_CHARGEBACK', // Cancelado por contracargo confirmado
}

export enum RegistrationOrigin {
  PURCHASE = 'PURCHASE', // Compra normal
  COURTESY = 'COURTESY', // Cortesía
  TRANSFER = 'TRANSFER', // Transferencia
}

@Entity('registrations')
// Evita duplicados: Un Attendee no puede registrarse 2 veces al mismo Evento
@Index(['attendee', 'event'], { unique: true })
@Index(['status']) // Índice para filtrar por estado
@Index(['ticketCode']) // Índice para búsqueda rápida de tickets
@Index(['attended']) // Índice para filtrar asistencia
@Index(['status', 'expiresAt']) // Índice para el cron de expiración
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.CONFIRMED,
  })
  status: RegistrationStatus;

  @Column({ type: 'text', unique: true })
  ticketCode: string; // UUID para el QR

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number; // Precio congelado al momento de la compra

  // Precio original antes de descuentos (para tracking de cupones)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number | null;

  // Descuento aplicado
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  // Fecha límite de pago
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ default: false })
  attended: boolean;

  @Column({ type: 'timestamp', nullable: true })
  attendedAt: Date;

  @ManyToOne(() => Attendee, (attendee: Attendee) => attendee.registrations, {
    eager: true,
  })
  @JoinColumn({ name: 'attendeeId' })
  attendee: Attendee;

  @ManyToOne(() => EventTicket, (ticket: EventTicket) => ticket.registrations, {
    eager: true,
  })
  @JoinColumn({ name: 'eventTicketId' })
  eventTicket: EventTicket;

  @ManyToOne(() => Event, { eager: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  // Relacion con PurchaseOrder (pedido de compra)
  // Nullable para mantener compatibilidad con registros antiguos
  @ManyToOne(() => PurchaseOrder, (order) => order.registrations, {
    nullable: true,
  })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder | null;

  @OneToOne(() => Payment, (payment) => payment.registration)
  payment: Payment;

  // Origen de la inscripción
  @Column({
    type: 'enum',
    enum: RegistrationOrigin,
    default: RegistrationOrigin.PURCHASE,
  })
  origin: RegistrationOrigin;

  // Relación con cortesía (si el origen es COURTESY)
  @ManyToOne('Courtesy', (courtesy: any) => courtesy.registration, {
    nullable: true,
  })
  @JoinColumn({ name: 'courtesyId' })
  courtesy: any | null;

  @CreateDateColumn()
  registeredAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
