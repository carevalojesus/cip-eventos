import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Registration } from '../../registrations/entities/registration.entity';
import { User } from '../../users/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'PENDING', // Creado, esperando acción
  WAITING_APPROVAL = 'WAITING_APPROVAL', // Usuario reportó pago (Yapeó), falta que Admin revise
  COMPLETED = 'COMPLETED', // Dinero confirmado, Ticket enviado
  REJECTED = 'REJECTED', // Admin rechazó (foto falsa, monto incorrecto)
  REFUNDED = 'REFUNDED', // Pago reembolsado
  EXPIRED = 'EXPIRED', // Pago expiró sin completarse
  FAILED = 'FAILED', // Error en procesamiento de pago
}

// Tipo de documento para facturación (diferente a DocumentType de attendees)
export enum BillingDocumentType {
  DNI = 'DNI', // Boleta - Persona natural
  RUC = 'RUC', // Factura - Empresa
}

// Origen de la compra/pago
export enum PaymentSource {
  ONLINE = 'ONLINE', // Compra por web
  BOX_OFFICE = 'BOX_OFFICE', // Compra en taquilla/oficina
  ADMIN = 'ADMIN', // Registrado por admin
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  NIUBIZ = 'NIUBIZ',
  PAYPAL = 'PAYPAL',
  // 👇 NUEVOS MÉTODOS
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH', // Efectivo (Pago en oficina)
  SIMULATED = 'SIMULATED',
}

@Entity('payments')
@Index(['status']) // Índice para filtrar por estado de pago
@Index(['provider']) // Índice para filtrar por proveedor
@Index(['transactionId']) // Índice para búsqueda por ID de transacción
@Index(['status', 'provider']) // Índice compuesto para reportes
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', default: 'PEN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.SIMULATED,
  })
  provider: PaymentProvider;

  // 👇 Datos para validar pagos manuales
  @Column({ type: 'text', nullable: true })
  operationCode: string | null; // El número de operación del banco/Yape

  @Column({ type: 'text', nullable: true })
  evidenceUrl: string | null; // URL de la foto/screenshot (Subida a S3/Cloudinary)

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null; // Si se rechaza, ¿por qué?

  // Datos de facturación (snapshot al momento del pago)
  @Column({ type: 'jsonb', nullable: true })
  billingData: {
    documentType: BillingDocumentType;
    documentNumber: string;
    businessName?: string;
    address?: string;
  };

  @Column({ type: 'text', nullable: true })
  invoiceUrl: string; // URL al PDF de factura/boleta

  @Column({
    type: 'enum',
    enum: PaymentSource,
    default: PaymentSource.ONLINE,
  })
  source: PaymentSource;

  // 👇 Auditoría: ¿Qué admin aprobó esto?
  @ManyToOne(() => User, { nullable: true })
  reviewedBy: User;

  // ... (TransactionId, Metadata, Registration, Fechas) se quedan igual
  @Column({ type: 'text', nullable: true })
  transactionId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @OneToOne(() => Registration, (reg) => reg.payment)
  @JoinColumn({ name: 'registrationId' })
  registration: Registration;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
