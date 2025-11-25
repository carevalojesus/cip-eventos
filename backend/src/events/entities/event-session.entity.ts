import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { Speaker } from '../../speakers/entities/speaker.entity';

@Entity('event_sessions')
export class EventSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string; // Ej: "Keynote: El Futuro de la IA"

  @Column({ type: 'text', nullable: true })
  description: string;

  // Fechas específicas de ESTA sesión (dentro del rango del evento padre)
  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  // Ubicación específica (Ej: "Sala 1", "Auditorio B")
  @Column({ type: 'text', nullable: true })
  room: string;

  // Enlace específico (si esta sesión es virtual y distinta al link general)
  @Column({ type: 'text', nullable: true })
  meetingUrl: string;

  // --- RELACIONES ---

  // 1. Pertenece a un Evento Padre
  @ManyToOne(() => Event, (event) => event.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  // 2. Tiene sus propios Ponentes (Subconjunto de los ponentes del evento)
  @ManyToMany(() => Speaker)
  @JoinTable({ name: 'session_speakers' })
  speakers: Speaker[];
}
