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

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 100 })
  stock: number; // Cupos para este tipo de entrada

  @Column({ type: 'boolean', default: false })
  requiresCipValidation: boolean; // 👈 Regla de negocio clave

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
