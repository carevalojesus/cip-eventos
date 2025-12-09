import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Registration } from '../../registrations/entities/registration.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { Person } from '../../persons/entities/person.entity';
import { User } from '../../users/entities/user.entity';
import { TransferStatus } from '../enums/transfer-status.enum';

@Entity('ticket_transfers')
@Index(['registration'])
@Index(['status'])
@Index(['transferToken'])
export class TicketTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Registration, { eager: true })
  @JoinColumn({ name: 'registrationId' })
  registration: Registration;

  @ManyToOne(() => Attendee, { eager: true })
  @JoinColumn({ name: 'fromAttendeeId' })
  fromAttendee: Attendee;

  @ManyToOne(() => Attendee, { eager: true })
  @JoinColumn({ name: 'toAttendeeId' })
  toAttendee: Attendee;

  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn({ name: 'fromPersonId' })
  fromPerson: Person | null;

  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn({ name: 'toPersonId' })
  toPerson: Person | null;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status: TransferStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null; // Motivo de la transferencia

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'initiatedById' })
  initiatedBy: User | null; // Usuario que inició (puede ser null si invitado)

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User | null; // Admin que aprobó (si requiere aprobación)

  @Column({ type: 'text', nullable: true })
  transferToken: string | null; // Token para confirmar (si se requiere)

  @Column({ type: 'timestamptz', nullable: true })
  tokenExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
