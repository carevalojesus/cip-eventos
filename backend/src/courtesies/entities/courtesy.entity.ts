import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Person } from '../../persons/entities/person.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { Speaker } from '../../speakers/entities/speaker.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { BlockEnrollment } from '../../evaluations/entities/block-enrollment.entity';
import { EvaluableBlock } from '../../evaluations/entities/evaluable-block.entity';
import { User } from '../../users/entities/user.entity';
import { CourtesyType } from '../enums/courtesy-type.enum';
import { CourtesyScope } from '../enums/courtesy-scope.enum';
import { CourtesyStatus } from '../enums/courtesy-status.enum';

@Entity('courtesies')
@Index(['event', 'person'], { unique: true })
@Index(['status'])
@Index(['event'])
export class Courtesy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el evento
  @ManyToOne(() => Event, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  // Relación con la persona (modelo unificado de identidad)
  @ManyToOne(() => Person, { eager: true })
  @JoinColumn({ name: 'personId' })
  person: Person;

  // Relación con el attendee (puede no existir aún al crear la cortesía)
  @ManyToOne(() => Attendee, { nullable: true, eager: true })
  @JoinColumn({ name: 'attendeeId' })
  attendee: Attendee | null;

  // Tipo de cortesía
  @Column({
    type: 'enum',
    enum: CourtesyType,
    default: CourtesyType.OTHER,
  })
  type: CourtesyType;

  // Alcance de la cortesía
  @Column({
    type: 'enum',
    enum: CourtesyScope,
    default: CourtesyScope.FULL_EVENT,
  })
  scope: CourtesyScope;

  // Estado de la cortesía
  @Column({
    type: 'enum',
    enum: CourtesyStatus,
    default: CourtesyStatus.ACTIVE,
  })
  status: CourtesyStatus;

  // Motivo de la cortesía
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  // Notas internas del organizador
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Para alcance SPECIFIC_BLOCKS
  @ManyToMany(() => EvaluableBlock, { eager: false })
  @JoinTable({
    name: 'courtesy_blocks',
    joinColumn: { name: 'courtesyId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'blockId', referencedColumnName: 'id' },
  })
  specificBlocks: EvaluableBlock[];

  // Para alcance ASSIGNED_SESSIONS_ONLY (se calcula desde Speaker-Session)
  @ManyToOne(() => Speaker, { nullable: true, eager: true })
  @JoinColumn({ name: 'speakerId' })
  speaker: Speaker | null;

  // Registration generada por la cortesía
  @OneToOne(() => Registration, (registration) => registration.courtesy, {
    nullable: true,
  })
  registration: Registration | null;

  // Enrollments generados (para bloques)
  @OneToMany(() => BlockEnrollment, (enrollment) => enrollment.courtesy, {
    nullable: true,
  })
  blockEnrollments: BlockEnrollment[];

  // Fecha de expiración de la cortesía
  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  // Usuario que otorgó la cortesía
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'grantedById' })
  grantedBy: User;

  @Column({ type: 'timestamptz' })
  grantedAt: Date;

  // Usuario que canceló la cortesía
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelledById' })
  cancelledBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
