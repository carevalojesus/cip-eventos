import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FiscalDocument, FiscalDocumentStatus } from './fiscal-document.entity';
import { User } from '../../users/entities/user.entity';

export enum CreditNoteReason {
  ANULACION = '01', // Anulación de operación
  ANULACION_ERROR = '02', // Anulación por error en RUC
  CORRECCION_DESCRIPCION = '03', // Corrección por error en descripción
  DESCUENTO_GLOBAL = '04', // Descuento global
  DESCUENTO_ITEM = '05', // Descuento por ítem
  DEVOLUCION_TOTAL = '06', // Devolución total
  DEVOLUCION_PARCIAL = '07', // Devolución parcial
  BONIFICACION = '08', // Bonificación
  DISMINUCION_VALOR = '09', // Disminución en el valor
  OTROS = '10', // Otros conceptos
}

@Entity('credit_notes')
@Index(['series', 'correlative'], { unique: true })
@Index(['originalDocument'])
@Index(['status'])
export class CreditNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Serie de nota de crédito (ej: BC01 para boletas, FC01 para facturas)
  @Column({ type: 'varchar', length: 10 })
  series: string;

  @Column({ type: 'int' })
  correlative: number;

  @Column({ type: 'varchar', length: 20 })
  fullNumber: string;

  @Column({
    type: 'enum',
    enum: FiscalDocumentStatus,
    default: FiscalDocumentStatus.PENDING,
  })
  status: FiscalDocumentStatus;

  // Documento original que se está modificando/anulando
  @ManyToOne(() => FiscalDocument)
  originalDocument: FiscalDocument;

  @Column({
    type: 'enum',
    enum: CreditNoteReason,
  })
  reason: CreditNoteReason;

  @Column({ type: 'text' })
  description: string;

  // Montos
  @Column({ type: 'varchar', length: 3, default: 'PEN' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  igv: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Respuesta SUNAT
  @Column({ type: 'text', nullable: true })
  digestValue: string | null;

  @Column({ type: 'text', nullable: true })
  cdrResponse: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sunatResponseCode: string | null;

  @Column({ type: 'text', nullable: true })
  sunatResponseMessage: string | null;

  // Archivos
  @Column({ type: 'text', nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'text', nullable: true })
  xmlUrl: string | null;

  // Auditoría
  @ManyToOne(() => User)
  issuedBy: User;

  @Column({ type: 'timestamptz', nullable: true })
  issuedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
