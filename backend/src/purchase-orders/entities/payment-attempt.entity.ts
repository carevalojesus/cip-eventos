import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { PaymentAttemptStatus } from '../enums/payment-attempt-status.enum';

// Enum local para evitar problemas de importación circular con TypeORM
export enum PaymentAttemptProvider {
  STRIPE = 'STRIPE',
  NIUBIZ = 'NIUBIZ',
  PAYPAL = 'PAYPAL',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  SIMULATED = 'SIMULATED',
}

@Entity('payment_attempts')
@Index(['purchaseOrder']) // Indice para buscar por pedido
@Index(['status']) // Indice para filtrar por estado
@Index(['provider']) // Indice para filtrar por proveedor
@Index(['transactionId']) // Indice para buscar por ID de transaccion
export class PaymentAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relacion con PurchaseOrder
  @ManyToOne(() => PurchaseOrder, (order) => order.paymentAttempts, {
    eager: true,
  })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column({
    type: 'enum',
    enum: PaymentAttemptStatus,
    default: PaymentAttemptStatus.INITIATED,
  })
  status: PaymentAttemptStatus;

  @Column({
    type: 'enum',
    enum: PaymentAttemptProvider,
  })
  provider: PaymentAttemptProvider;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // ID de transaccion de la pasarela de pago
  @Column({ type: 'text', nullable: true })
  transactionId: string | null;

  // Mensaje de error si fallo el intento
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  // Metadata adicional del intento de pago
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
