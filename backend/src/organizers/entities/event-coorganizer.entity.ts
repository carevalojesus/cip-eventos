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
import { Event } from '../../events/entities/event.entity';
import { Organizer } from './organizer.entity';
import { CoorganizerRole } from '../enums/coorganizer-role.enum';

@Entity('event_coorganizers')
@Index(['event', 'organizer'], { unique: true })
@Index(['event'])
@Index(['organizer'])
@Index(['role'])
export class EventCoorganizer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, (event) => event.coorganizers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => Organizer, (organizer) => organizer.coorganizations, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizerId' })
  organizer: Organizer;

  @Column({
    type: 'enum',
    enum: CoorganizerRole,
    default: CoorganizerRole.OTHER,
  })
  role: CoorganizerRole;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'boolean', default: true })
  showInCertificate: boolean;

  @Column({ type: 'boolean', default: true })
  showInPublicPage: boolean;

  @Column({ type: 'text', nullable: true })
  customRole: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
