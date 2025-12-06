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
import { Organizer } from '../../organizers/entities/organizer.entity';
import { User } from '../../users/entities/user.entity';

export enum FiscalDocumentType {
  BOLETA = 'BOLETA', // Para personas naturales (DNI)
  FACTURA = 'FACTURA', // Para empresas (RUC)
}

export enum FiscalDocumentStatus {
  PENDING = 'PENDING', // Pendiente de emisión
  ISSUED = 'ISSUED', // Emitido correctamente
  SENT_TO_SUNAT = 'SENT_TO_SUNAT', // Enviado a SUNAT
  ACCEPTED = 'ACCEPTED', // Aceptado por SUNAT
  REJECTED = 'REJECTED', // Rechazado por SUNAT
  VOIDED = 'VOIDED', // Anulado
  ERROR = 'ERROR', // Error en emisión
}

@Entity('fiscal_documents')
@Index(['type', 'series', 'correlative'], { unique: true })
@Index(['status'])
@Index(['payment'])
@Index(['issuedAt'])
@Index(['rucReceiver'])
@Index(['dniReceiver'])
export class FiscalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FiscalDocumentType,
  })
  type: FiscalDocumentType;

  // Serie del comprobante (ej: B001, F001)
  @Column({ type: 'varchar', length: 10 })
  series: string;

  // Número correlativo
  @Column({ type: 'int' })
  correlative: number;

  // Número completo (ej: B001-00000123)
  @Column({ type: 'varchar', length: 20 })
  fullNumber: string;

  @Column({
    type: 'enum',
    enum: FiscalDocumentStatus,
    default: FiscalDocumentStatus.PENDING,
  })
  status: FiscalDocumentStatus;

  // ========== DATOS DEL EMISOR ==========
  @Column({ type: 'varchar', length: 11 })
  rucEmitter: string; // RUC del CIP

  @Column({ type: 'text' })
  businessNameEmitter: string; // Razón social del CIP

  @Column({ type: 'text' })
  addressEmitter: string; // Dirección fiscal del CIP

  // ========== DATOS DEL RECEPTOR ==========
  // Para Boleta (DNI)
  @Column({ type: 'varchar', length: 8, nullable: true })
  dniReceiver: string | null;

  // Para Factura (RUC)
  @Column({ type: 'varchar', length: 11, nullable: true })
  rucReceiver: string | null;

  @Column({ type: 'text' })
  nameReceiver: string; // Nombre o Razón Social del receptor

  @Column({ type: 'text', nullable: true })
  addressReceiver: string | null; // Dirección del receptor (requerido para facturas)

  @Column({ type: 'varchar', length: 100, nullable: true })
  emailReceiver: string | null;

  // ========== DETALLE ECONÓMICO ==========
  @Column({ type: 'varchar', length: 3, default: 'PEN' })
  currency: string;

  // Subtotal (base imponible)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // IGV (18%)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  igv: number;

  // Total
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Descripción del servicio/producto
  @Column({ type: 'text' })
  description: string;

  // ========== INTEGRACIÓN SUNAT ==========
  // Hash de la firma digital
  @Column({ type: 'text', nullable: true })
  digestValue: string | null;

  // CDR (Constancia de Recepción) de SUNAT
  @Column({ type: 'text', nullable: true })
  cdrResponse: string | null;

  // Código de respuesta de SUNAT
  @Column({ type: 'varchar', length: 10, nullable: true })
  sunatResponseCode: string | null;

  // Mensaje de SUNAT
  @Column({ type: 'text', nullable: true })
  sunatResponseMessage: string | null;

  // ========== ARCHIVOS ==========
  @Column({ type: 'text', nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'text', nullable: true })
  xmlUrl: string | null;

  // ========== RELACIONES ==========
  @ManyToOne(() => Payment)
  payment: Payment;

  @ManyToOne(() => Organizer, { nullable: true })
  organizer: Organizer | null;

  // Auditoría
  @ManyToOne(() => User, { nullable: true })
  issuedBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  voidedBy: User | null;

  @Column({ type: 'text', nullable: true })
  voidReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  voidedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  issuedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
