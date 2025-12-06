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
import { Evaluation } from './evaluation.entity';
import { BlockEnrollment } from './block-enrollment.entity';
import { User } from '../../users/entities/user.entity';

export enum GradeStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DISPUTED = 'DISPUTED',
}

@Entity('participant_grades')
@Index(['enrollment', 'evaluation'], { unique: true })
@Index(['evaluation'])
@Index(['enrollment'])
export class ParticipantGrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nota obtenida
  @Column({ type: 'decimal', precision: 4, scale: 2 })
  grade: number;

  // Nota normalizada (convertida a escala de 0-20 si la evaluación tiene otra escala)
  @Column({ type: 'decimal', precision: 4, scale: 2 })
  normalizedGrade: number;

  // Comentarios del evaluador
  @Column({ type: 'text', nullable: true })
  comments: string | null;

  // Estado de la nota
  @Column({
    type: 'enum',
    enum: GradeStatus,
    default: GradeStatus.DRAFT,
  })
  status: GradeStatus;

  // Fecha en que se publicó al participante
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  // Es nota de recuperación
  @Column({ type: 'boolean', default: false })
  isRetakeGrade: boolean;

  // Número de intento (1 = primera vez, 2 = primer recuperatorio, etc.)
  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  // ========== RELACIONES ==========

  @ManyToOne(() => Evaluation, (evaluation) => evaluation.grades, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'evaluationId' })
  evaluation: Evaluation;

  @ManyToOne(() => BlockEnrollment, (enrollment) => enrollment.grades, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: BlockEnrollment;

  // Quién registró la nota
  @ManyToOne(() => User)
  @JoinColumn({ name: 'gradedById' })
  gradedBy: User;

  // Quién modificó la nota por última vez
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'lastModifiedById' })
  lastModifiedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
