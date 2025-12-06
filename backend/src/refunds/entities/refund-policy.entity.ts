import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';

// Política de reembolso por evento
@Entity('refund_policies')
export class RefundPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, { nullable: true })
  event: Event | null; // null = política global por defecto

  // Días antes del evento para aplicar esta política
  // ej: daysBeforeEvent = 30 significa "más de 30 días antes"
  @Column({ type: 'int' })
  daysBeforeEvent: number;

  // Porcentaje de devolución (0-100)
  // ej: refundPercentage = 80 significa "se devuelve el 80%"
  @Column({ type: 'int' })
  refundPercentage: number;

  // Descripción de la política
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
