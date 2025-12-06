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
import { EventSession } from '../../events/entities/event-session.entity';
import { BlockEnrollment } from './block-enrollment.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { User } from '../../users/entities/user.entity';

// Modalidad de asistencia
export enum AttendanceModality {
  IN_PERSON = 'IN_PERSON', // Presencial
  VIRTUAL = 'VIRTUAL', // Virtual
  HYBRID = 'HYBRID', // Híbrido (parte presencial, parte virtual)
}

// Estado de asistencia
export enum AttendanceStatus {
  PRESENT = 'PRESENT', // Presente (asistencia completa)
  PARTIAL = 'PARTIAL', // Asistencia parcial
  ABSENT = 'ABSENT', // Ausente
  LATE = 'LATE', // Tardanza
  EXCUSED = 'EXCUSED', // Falta justificada
}

@Entity('session_attendances')
@Index(['session', 'attendee'], { unique: true })
@Index(['session'])
@Index(['enrollment'])
export class SessionAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status: AttendanceStatus;

  @Column({
    type: 'enum',
    enum: AttendanceModality,
    default: AttendanceModality.IN_PERSON,
  })
  modality: AttendanceModality;

  // ========== TIEMPOS ==========

  // Hora de entrada
  @Column({ type: 'timestamptz', nullable: true })
  checkInAt: Date | null;

  // Hora de salida
  @Column({ type: 'timestamptz', nullable: true })
  checkOutAt: Date | null;

  // Minutos asistidos (calculado)
  @Column({ type: 'int', default: 0 })
  minutesAttended: number;

  // Duración total de la sesión en minutos
  @Column({ type: 'int', default: 0 })
  sessionDurationMinutes: number;

  // Porcentaje de asistencia a esta sesión
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendancePercentage: number;

  // ========== VIRTUAL ==========

  // Token de acceso al streaming (para validar asistencia virtual)
  @Column({ type: 'text', nullable: true })
  streamingToken: string | null;

  // Conexiones virtuales registradas
  @Column({ type: 'jsonb', nullable: true })
  virtualConnections: {
    connectedAt: string;
    disconnectedAt?: string;
    duration: number;
    ip?: string;
  }[] | null;

  // ========== JUSTIFICACIÓN ==========

  // Motivo de falta justificada
  @Column({ type: 'text', nullable: true })
  excuseReason: string | null;

  // Documento de justificación (URL)
  @Column({ type: 'text', nullable: true })
  excuseDocumentUrl: string | null;

  // ========== RELACIONES ==========

  @ManyToOne(() => EventSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: EventSession;

  @ManyToOne(() => Attendee)
  @JoinColumn({ name: 'attendeeId' })
  attendee: Attendee;

  // Inscripción al bloque (si la sesión pertenece a un bloque)
  @ManyToOne(() => BlockEnrollment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: BlockEnrollment | null;

  // Quién registró la asistencia
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'registeredById' })
  registeredBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
