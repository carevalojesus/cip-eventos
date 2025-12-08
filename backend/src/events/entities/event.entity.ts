import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
// Importamos las nuevas entidades
import { EventType } from './event-type.entity';
import { EventCategory } from './event-category.entity';
import { EventModality } from './event-modality.entity';
import { EventLocation } from './event-location.entity';
import { EventVirtualAccess } from './event-virtual-access.entity';
import { Speaker } from '../../speakers/entities/speaker.entity';
import { Organizer } from '../../organizers/entities/organizer.entity';
import { EventTicket } from './event-ticket.entity';
import { EventSession } from './event-session.entity';
import { Signer } from '../../signers/entities/signer.entity';
import { EventCoorganizer } from '../../organizers/entities/event-coorganizer.entity';

export enum EventStatus {
  DRAFT = 'DRAFT', // Borrador, no visible al público
  PUBLISHED = 'PUBLISHED', // Publicado, visible y abierto a inscripciones
  COMPLETED = 'COMPLETED', // Evento finalizado
  CANCELLED = 'CANCELLED', // Evento cancelado
  ARCHIVED = 'ARCHIVED', // Archivado, oculto pero preservado
}

@Entity('events')
@Index(['status']) // Índice para filtrar por estado
@Index(['isActive']) // Índice para soft delete
@Index(['startAt']) // Índice para ordenar/filtrar por fecha
@Index(['status', 'isActive']) // Índice compuesto para queries comunes
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

  @Column({ type: 'timestamptz', nullable: true })
  checkInStartAt: Date; // Hora de inicio del check-in/admisión

  @Column({ nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadataSnapshot: {
    eventTitle: string;
    signers: { name: string; title: string }[];
  };

  @ManyToOne(() => EventType, (type) => type.events, { eager: true })
  @JoinColumn({ name: 'typeId' })
  type: EventType;

  @ManyToOne(() => EventCategory, (category) => category.events, {
    eager: false, // Removed eager to improve performance - load via QueryBuilder when needed
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: EventCategory;

  @ManyToOne(() => EventModality, (modality) => modality.events, {
    eager: true,
  })
  @JoinColumn({ name: 'modalityId' })
  modality: EventModality;

  @ManyToOne(() => EventLocation, (loc) => loc.events, {
    cascade: ['insert', 'update'],
    eager: false, // Removed eager to improve performance - load via QueryBuilder when needed
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

  @ManyToMany(() => Speaker, (speaker) => speaker.events, {
    eager: false, // Lazy loading para mejor performance
    cascade: true, // Permite insertar/actualizar
  })
  @JoinTable({
    name: 'event_speakers', // Nombre personalizado para la tabla intermedia
    joinColumn: { name: 'eventId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'speakerId', referencedColumnName: 'id' },
  })
  speakers: Speaker[];

  @OneToMany(() => EventTicket, (ticket) => ticket.event, {
    cascade: true,
    eager: false, // Removed eager - major performance issue when loading event lists
  })
  tickets: EventTicket[];

  @ManyToMany(() => Organizer, (organizer) => organizer.events, {
    eager: false,
    cascade: true,
  })
  @JoinTable({
    name: 'event_organizers',
    joinColumn: { name: 'eventId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'organizerId', referencedColumnName: 'id' },
  })
  organizers: Organizer[];

  @OneToMany(() => EventSession, (session) => session.event, {
    cascade: true,
    eager: false, // Removed eager - major performance issue when loading event lists
  })
  sessions: EventSession[];

  @ManyToMany(() => Signer)
  @JoinTable({ name: 'event_signers' })
  signers: Signer[];

  // 👇 Coorganizadores con roles
  @OneToMany(() => EventCoorganizer, (coorg) => coorg.event, {
    cascade: true,
    eager: false,
  })
  coorganizers: EventCoorganizer[];

  // 👇 Configuración del Certificado
  @Column({ type: 'boolean', default: false })
  hasCertificate: boolean;

  @Column({ type: 'int', default: 0 })
  certificateHours: number;

  @Column({ type: 'boolean', default: false })
  allowsSessionCertificates: boolean; // Permite certificados por sesión individual

  @Column({ type: 'int', default: 70 })
  minAttendancePercentage: number; // % mínimo de asistencia para certificado

  // -------------------------
  // Auditoría y soft delete

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { eager: false }) // Removed eager - load only when needed
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
