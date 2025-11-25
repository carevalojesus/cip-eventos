import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
// Importamos las nuevas entidades
import { EventType } from './event-type.entity';
import { EventCategory } from './event-category.entity';
import { EventModality } from './event-modality.entity';
import { EventLocation } from './event-location.entity';
import { EventVirtualAccess } from './event-virtual-access.entity';

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({ type: 'text', default: 'America/Lima' })
  timezone: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @ManyToOne(() => EventType, (type) => type.events, { eager: true })
  @JoinColumn({ name: 'typeId' })
  type: EventType;

  @ManyToOne(() => EventCategory, (category) => category.events, {
    eager: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: EventCategory;

  @ManyToOne(() => EventModality, (modality) => modality.events, {
    eager: true,
  })
  @JoinColumn({ name: 'modalityId' })
  modality: EventModality;

  @OneToOne(() => EventLocation, (loc) => loc.event, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  @JoinColumn()
  location: EventLocation;

  // virtualAccess NO tiene eager loading por seguridad
  // Solo se carga explícitamente cuando es necesario
  @OneToOne(() => EventVirtualAccess, (virt) => virt.event, {
    cascade: true,
    eager: false, // Lazy loading por seguridad
    nullable: true,
  })
  @JoinColumn()
  virtualAccess: EventVirtualAccess;

  // -------------------------
  // Auditoría y soft delete

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
