import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EvaluableBlock } from './evaluable-block.entity';

// Tipo de evaluación
export enum EvaluationType {
  EXAM = 'EXAM', // Examen
  QUIZ = 'QUIZ', // Cuestionario
  ASSIGNMENT = 'ASSIGNMENT', // Trabajo/Tarea
  PROJECT = 'PROJECT', // Proyecto
  PARTICIPATION = 'PARTICIPATION', // Participación
  RETAKE = 'RETAKE', // Examen de recuperación
}

@Entity('evaluations')
@Index(['block'])
@Index(['type'])
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string; // Ej: "Examen Final", "Trabajo Práctico 1"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: EvaluationType,
    default: EvaluationType.EXAM,
  })
  type: EvaluationType;

  // Peso de esta evaluación en el cálculo final (porcentaje)
  // Ej: 30 = 30% del total
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  weight: number;

  // Nota máxima para esta evaluación específica
  @Column({ type: 'decimal', precision: 4, scale: 2, default: 20 })
  maxGrade: number;

  // Es evaluación de recuperación
  @Column({ type: 'boolean', default: false })
  isRetake: boolean;

  // Si es recuperación, ¿qué evaluación reemplaza?
  @ManyToOne(() => Evaluation, { nullable: true })
  @JoinColumn({ name: 'replacesEvaluationId' })
  replacesEvaluation: Evaluation | null;

  // Orden de aparición en la lista
  @Column({ type: 'int', default: 0 })
  order: number;

  // Fechas de la evaluación
  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null; // Fecha límite de entrega

  @Column({ type: 'timestamptz', nullable: true })
  availableFrom: Date | null; // Disponible desde

  @Column({ type: 'timestamptz', nullable: true })
  availableUntil: Date | null; // Disponible hasta

  // ========== RELACIONES ==========

  @ManyToOne(() => EvaluableBlock, (block) => block.evaluations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blockId' })
  block: EvaluableBlock;

  // Notas de participantes
  @OneToMany('ParticipantGrade', 'evaluation')
  grades: any[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
