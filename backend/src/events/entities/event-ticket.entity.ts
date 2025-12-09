import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
  VersionColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { Registration } from '../../registrations/entities/registration.entity';

@Entity('event_tickets')
export class EventTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string; // Ej: "General", "Colegiado Habilitado", "Estudiante"

  @Column({
    type: 'enum',
    enum: ['EVENT', 'DAY', 'SESSION', 'BLOCK'],
    default: 'EVENT',
  })
  scope: 'EVENT' | 'DAY' | 'SESSION' | 'BLOCK';

  // Referencia opcional (día/sesión/bloque) según alcance
  @Column({ type: 'text', nullable: true })
  scopeReferenceId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 100 })
  stock: number; // Cupos para este tipo de entrada

  @Column({ type: 'boolean', default: false })
  requiresCipValidation: boolean; // 👈 Regla de negocio clave

  @Column({ type: 'text', nullable: true })
  description: string; // Descripción del ticket (ej: "Incluye coffee break")

  @Column({ type: 'timestamptz', nullable: true })
  salesStartAt: Date; // Fecha inicio de ventas

  @Column({ type: 'timestamptz', nullable: true })
  salesEndAt: Date; // Fecha fin de ventas

  @Column({ type: 'int', default: 10 })
  maxPerOrder: number; // Máximo por pedido

  @Column({ type: 'boolean', default: true })
  isVisible: boolean; // Visibilidad del ticket

  // Políticas de transferencia y lista de espera
  @Column({ type: 'boolean', default: false })
  allowsTransfer: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  transferDeadline: Date | null;

  @Column({ type: 'boolean', default: false })
  allowsWaitlist: boolean;

  @Column({ type: 'int', default: 24 })
  waitlistInvitationHours: number; // Horas válidas para link de compra desde lista de espera

  // Soft delete para prevenir pérdida de datos de registraciones
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Control optimista de concurrencia para prevenir race conditions en stock
  @VersionColumn()
  version: number;

  @ManyToOne(() => Event, (event) => event.tickets)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @OneToMany(() => Registration, (registration) => registration.eventTicket)
  registrations: Registration[];
}
