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

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
}

@Entity('registrations')
// Evita duplicados: Un Attendee no puede registrarse 2 veces al mismo Evento
@Index(['attendee', 'event'], { unique: true })
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

  @OneToOne(() => Payment, (payment) => payment.registration)
  payment: Payment;

  @CreateDateColumn()
  registeredAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
