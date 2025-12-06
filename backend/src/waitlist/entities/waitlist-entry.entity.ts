import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventTicket } from '../../events/entities/event-ticket.entity';
import { Person } from '../../persons/entities/person.entity';
import { WaitlistStatus } from '../enums/waitlist-status.enum';

@Entity('waitlist_entries')
// Índices para queries eficientes
@Index(['eventTicket', 'status']) // Para buscar por ticket y estado
@Index(['eventTicket', 'status', 'priority']) // Para obtener el siguiente en la lista (FIFO)
@Index(['purchaseToken'], { unique: true, where: '"purchaseToken" IS NOT NULL' }) // Token único para compra
@Index(['person', 'eventTicket'], { unique: true }) // Una persona solo puede estar una vez en la lista de espera por ticket
export class WaitlistEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EventTicket, { eager: true })
  @JoinColumn({ name: 'eventTicketId' })
  eventTicket: EventTicket;

  @ManyToOne(() => Person, { eager: true })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column({ type: 'text' })
  email: string; // Email para notificaciones (puede ser diferente al de Person)

  @Column({
    type: 'enum',
    enum: WaitlistStatus,
    default: WaitlistStatus.WAITING,
  })
  status: WaitlistStatus;

  @Column({ type: 'int' })
  priority: number; // Orden en la lista (menor = primero)

  @Column({ type: 'text', unique: true, nullable: true })
  purchaseToken: string | null; // Token único para el link de compra

  @Column({ type: 'timestamptz', nullable: true })
  invitedAt: Date | null; // Cuándo se le envió la invitación

  @Column({ type: 'timestamptz', nullable: true })
  invitationExpiresAt: Date | null; // Cuándo expira la invitación

  @Column({ type: 'timestamptz', nullable: true })
  convertedAt: Date | null; // Cuándo completó la compra

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
