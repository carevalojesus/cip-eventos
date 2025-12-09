import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { User } from '../../users/entities/user.entity';
import { CreditNote } from '../../fiscal-documents/entities/credit-note.entity';

export enum RefundStatus {
  REQUESTED = 'REQUESTED', // Solicitado por el usuario
  PENDING_REVIEW = 'PENDING_REVIEW', // En revisión por admin
  APPROVED = 'APPROVED', // Aprobado, pendiente de procesar
  PROCESSING = 'PROCESSING', // En proceso de devolución
  COMPLETED = 'COMPLETED', // Reembolso completado
  REJECTED = 'REJECTED', // Rechazado
  CANCELLED = 'CANCELLED', // Cancelado por el usuario
}

export enum RefundReason {
  USER_REQUEST = 'USER_REQUEST', // Solicitud del usuario
  EVENT_CANCELLED = 'EVENT_CANCELLED', // Evento cancelado
  EVENT_RESCHEDULED = 'EVENT_RESCHEDULED', // Evento reprogramado
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT', // Pago duplicado
  OVERCHARGE = 'OVERCHARGE', // Cobro excesivo
  SERVICE_NOT_PROVIDED = 'SERVICE_NOT_PROVIDED', // Servicio no prestado
  OTHER = 'OTHER', // Otro motivo
}

export enum RefundMethod {
  SAME_METHOD = 'SAME_METHOD', // Mismo método de pago original
  BANK_TRANSFER = 'BANK_TRANSFER', // Transferencia bancaria
  CREDIT = 'CREDIT', // Crédito para futuros eventos
}

@Entity('refunds')
@Index(['status'])
@Index(['payment'])
@Index(['requestedAt'])
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.REQUESTED,
  })
  status: RefundStatus;

  @Column({
    type: 'enum',
    enum: RefundReason,
  })
  reason: RefundReason;

  @Column({ type: 'text', nullable: true })
  reasonDetails: string;

  // Montos
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalAmount: number; // Monto original del pago

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  refundAmount: number; // Monto a devolver

  @Column({ type: 'int' })
  refundPercentage: number; // Porcentaje aplicado

  @Column({ type: 'varchar', length: 3, default: 'PEN' })
  currency: string;

  // Método de reembolso
  @Column({
    type: 'enum',
    enum: RefundMethod,
    default: RefundMethod.SAME_METHOD,
  })
  refundMethod: RefundMethod;

  // Datos bancarios (si refundMethod = BANK_TRANSFER)
  @Column({ type: 'jsonb', nullable: true })
  bankDetails: {
    bankName?: string;
    accountNumber?: string;
    accountType?: string; // 'SAVINGS' | 'CHECKING'
    accountHolder?: string;
    cci?: string; // Código de cuenta interbancaria
  } | null;

  // Referencia a la transacción de reembolso
  @Column({ type: 'text', nullable: true })
  refundTransactionId: string | null;

  // Relaciones
  @ManyToOne(() => Payment)
  payment: Payment;

  @ManyToOne(() => Registration)
  registration: Registration;

  @ManyToOne(() => CreditNote, { nullable: true })
  creditNote: CreditNote | null;

  // Auditoría
  @ManyToOne(() => User)
  requestedBy: User;

  @ManyToOne(() => User, { nullable: true })
  reviewedBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  processedBy: User | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  // Fechas
  @Column({ type: 'timestamptz' })
  requestedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
