import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  VersionColumn,
} from 'typeorm';
import { Organizer } from '../../organizers/entities/organizer.entity';
import { FiscalDocumentType } from './fiscal-document.entity';

// Maneja las series y correlativos de comprobantes
@Entity('fiscal_series')
@Index(['organizer', 'type', 'series'], { unique: true })
export class FiscalSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organizer, { nullable: true })
  organizer: Organizer | null;

  @Column({
    type: 'enum',
    enum: FiscalDocumentType,
  })
  type: FiscalDocumentType;

  // Serie (ej: B001 para boletas, F001 para facturas)
  @Column({ type: 'varchar', length: 10 })
  series: string;

  // Último correlativo usado
  @Column({ type: 'int', default: 0 })
  lastCorrelative: number;

  // Control de concurrencia
  @VersionColumn()
  version: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
