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
import { Person } from '../../persons/entities/person.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { PaymentAttempt } from './payment-attempt.entity';
import { PurchaseOrderStatus } from '../enums/purchase-order-status.enum';

@Entity('purchase_orders')
@Index(['status']) // Indice para filtrar por estado
@Index(['buyerEmail']) // Indice para buscar por email
@Index(['status', 'expiresAt']) // Indice para cron de expiracion
@Index(['createdAt']) // Indice para reportes cronologicos
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.PENDING,
  })
  status: PurchaseOrderStatus;

  // Relacion con Person (quien compra) - puede ser null para compras de invitados
  @ManyToOne(() => Person, { nullable: true, eager: true })
  @JoinColumn({ name: 'buyerPersonId' })
  buyerPerson: Person | null;

  // Email del comprador (para compras sin cuenta o de invitados)
  @Column({ type: 'text' })
  buyerEmail: string;

  // Monto total del pedido
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  // Moneda del pedido
  @Column({ type: 'text', default: 'PEN' })
  currency: string;

  // Fecha limite de pago (ej: 20 minutos desde creacion)
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  // Fecha en que se completo el pago
  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  // Metadata adicional (IP del cliente, user agent, etc.)
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    clientIp?: string;
    userAgent?: string;
    [key: string]: any;
  } | null;

  // Relaciones
  @OneToMany(() => Registration, (registration) => registration.purchaseOrder)
  registrations: Registration[];

  @OneToMany(() => PaymentAttempt, (attempt) => attempt.purchaseOrder)
  paymentAttempts: PaymentAttempt[];

  // Pago exitoso final (solo uno)
  @OneToOne(() => Payment, (payment) => payment.purchaseOrder, {
    nullable: true,
  })
  payment: Payment | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
