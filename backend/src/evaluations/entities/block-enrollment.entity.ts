import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EvaluableBlock } from './evaluable-block.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { Payment } from '../../payments/entities/payment.entity';

// Estado de la inscripción al bloque
export enum BlockEnrollmentStatus {
  PENDING = 'PENDING', // Pendiente de pago
  ENROLLED = 'ENROLLED', // Inscrito y activo
  IN_PROGRESS = 'IN_PROGRESS', // Cursando
  APPROVED = 'APPROVED', // Aprobado
  FAILED = 'FAILED', // Reprobado
  WITHDRAWN = 'WITHDRAWN', // Retirado
  CANCELLED = 'CANCELLED', // Cancelado
}

@Entity('block_enrollments')
@Index(['block', 'attendee'], { unique: true })
@Index(['status'])
@Index(['block'])
export class BlockEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BlockEnrollmentStatus,
    default: BlockEnrollmentStatus.PENDING,
  })
  status: BlockEnrollmentStatus;

  // ========== PRECIOS ==========

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number;

  // ========== ASISTENCIA ==========

  // Porcentaje de asistencia calculado
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendancePercentage: number;

  // Número de sesiones asistidas
  @Column({ type: 'int', default: 0 })
  sessionsAttended: number;

  // Total de sesiones del bloque
  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  // Cumple requisito de asistencia
  @Column({ type: 'boolean', default: false })
  meetsAttendanceRequirement: boolean;

  // ========== CALIFICACIONES ==========

  // Nota final calculada
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  finalGrade: number | null;

  // Nota final después de recuperación (si aplica)
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  finalGradeAfterRetake: number | null;

  // Número de intentos de recuperación usados
  @Column({ type: 'int', default: 0 })
  retakeAttemptsUsed: number;

  // Aprobado (cumple nota mínima + asistencia)
  @Column({ type: 'boolean', default: false })
  passed: boolean;

  // Fecha de aprobación/reprobación
  @Column({ type: 'timestamptz', nullable: true })
  gradedAt: Date | null;

  // ========== CERTIFICADO ==========

  // ID del certificado emitido (si aplica)
  @Column({ type: 'uuid', nullable: true })
  certificateId: string | null;

  // Fecha de emisión del certificado
  @Column({ type: 'timestamptz', nullable: true })
  certificateIssuedAt: Date | null;

  // ========== RELACIONES ==========

  @ManyToOne(() => EvaluableBlock, (block) => block.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blockId' })
  block: EvaluableBlock;

  @ManyToOne(() => Attendee)
  @JoinColumn({ name: 'attendeeId' })
  attendee: Attendee;

  // Registro del evento (si el bloque requiere inscripción al evento)
  @ManyToOne(() => Registration, { nullable: true })
  @JoinColumn({ name: 'registrationId' })
  registration: Registration | null;

  // Pago asociado (si el bloque tiene costo)
  @OneToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment | null;

  // Notas individuales
  @OneToMany('ParticipantGrade', 'enrollment')
  grades: any[];

  // Registros de asistencia
  @OneToMany('SessionAttendance', 'enrollment')
  attendances: any[];

  // Relación con cortesía (si el enrollment es gratuito por cortesía)
  @ManyToOne('Courtesy', (courtesy: any) => courtesy.blockEnrollments, {
    nullable: true,
  })
  @JoinColumn({ name: 'courtesyId' })
  courtesy: any | null;

  // Fecha de retiro (si aplica)
  @Column({ type: 'timestamptz', nullable: true })
  withdrawnAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  enrolledAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
