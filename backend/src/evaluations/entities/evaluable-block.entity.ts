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
import { EventSession } from '../../events/entities/event-session.entity';
import { EventTicket } from '../../events/entities/event-ticket.entity';
import { Speaker } from '../../speakers/entities/speaker.entity';

// Tipo de bloque evaluable
export enum BlockType {
  WORKSHOP = 'WORKSHOP', // Taller
  COURSE = 'COURSE', // Curso
  MODULE = 'MODULE', // Módulo
  SEMINAR = 'SEMINAR', // Seminario
  DIPLOMA = 'DIPLOMA', // Diplomado
}

// Estado del bloque
export enum BlockStatus {
  DRAFT = 'DRAFT', // En configuración
  OPEN = 'OPEN', // Abierto para inscripciones
  IN_PROGRESS = 'IN_PROGRESS', // En curso
  GRADING = 'GRADING', // En proceso de calificación
  COMPLETED = 'COMPLETED', // Finalizado
  CANCELLED = 'CANCELLED', // Cancelado
}

@Entity('evaluable_blocks')
@Index(['event'])
@Index(['status'])
export class EvaluableBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string; // Ej: "Taller de Ciberseguridad"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: BlockType,
    default: BlockType.WORKSHOP,
  })
  type: BlockType;

  @Column({
    type: 'enum',
    enum: BlockStatus,
    default: BlockStatus.DRAFT,
  })
  status: BlockStatus;

  // Horas académicas del bloque
  @Column({ type: 'int', default: 0 })
  hours: number;

  // ========== CONFIGURACIÓN DE EVALUACIÓN ==========

  // Esquema de evaluación
  @Column({
    type: 'enum',
    enum: ['SIMPLE', 'COMPOSITE'],
    default: 'SIMPLE',
  })
  evaluationScheme: 'SIMPLE' | 'COMPOSITE';

  // Nota mínima para aprobar (escala de 0-20 típica en Perú)
  @Column({ type: 'decimal', precision: 4, scale: 2, default: 14 })
  minPassingGrade: number;

  // Nota máxima posible
  @Column({ type: 'decimal', precision: 4, scale: 2, default: 20 })
  maxGrade: number;

  // Porcentaje mínimo de asistencia para aprobar
  @Column({ type: 'int', default: 70 })
  minAttendancePercentage: number;

  // Fórmula de cálculo (para UI/documentación)
  @Column({ type: 'text', nullable: true })
  gradingFormula: string; // Ej: "Trabajo (30%) + Examen Final (70%)"

  // Permite examen de recuperación
  @Column({ type: 'boolean', default: false })
  allowsRetake: boolean;

  // Número máximo de intentos de recuperación
  @Column({ type: 'int', default: 1 })
  maxRetakeAttempts: number;

  // ========== CONFIGURACIÓN DE INSCRIPCIÓN ==========

  // Cupo máximo de participantes
  @Column({ type: 'int', nullable: true })
  maxParticipants: number | null;

  // Precio del bloque (puede ser independiente del evento)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  // Requiere inscripción previa al evento
  @Column({ type: 'boolean', default: true })
  requiresEventRegistration: boolean;

  // ========== FECHAS ==========

  @Column({ type: 'timestamptz', nullable: true })
  enrollmentStartAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  enrollmentEndAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  startAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endAt: Date | null;

  // ========== RELACIONES ==========

  // Evento padre
  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  // Sesiones que componen este bloque
  @ManyToMany(() => EventSession)
  @JoinTable({
    name: 'block_sessions',
    joinColumn: { name: 'blockId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'sessionId', referencedColumnName: 'id' },
  })
  sessions: EventSession[];

  // Ticket asociado (si el bloque se vende como entrada separada)
  @ManyToOne(() => EventTicket, { nullable: true })
  @JoinColumn({ name: 'ticketId' })
  ticket: EventTicket | null;

  // Instructores/Ponentes del bloque
  @ManyToMany(() => Speaker)
  @JoinTable({
    name: 'block_instructors',
    joinColumn: { name: 'blockId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'speakerId', referencedColumnName: 'id' },
  })
  instructors: Speaker[];

  // Evaluaciones definidas para este bloque
  @OneToMany('Evaluation', 'block')
  evaluations: any[]; // Se define la relación completa en Evaluation

  // Inscripciones al bloque
  @OneToMany('BlockEnrollment', 'block')
  enrollments: any[]; // Se define la relación completa en BlockEnrollment

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
