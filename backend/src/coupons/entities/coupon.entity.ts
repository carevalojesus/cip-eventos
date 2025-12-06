import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { EventTicket } from '../../events/entities/event-ticket.entity';
import { User } from '../../users/entities/user.entity';

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE', // Descuento porcentual (ej: 20%)
  FIXED_AMOUNT = 'FIXED_AMOUNT', // Monto fijo (ej: S/ 50)
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

@Entity('coupons')
@Index(['code'], { unique: true })
@Index(['status'])
@Index(['event'])
@Index(['validFrom', 'validUntil'])
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Código único del cupón (ej: COLEGIADO20, EARLYBIRD50)
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE,
  })
  type: CouponType;

  // Valor del descuento (20 para 20%, o 50 para S/ 50)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  // Descuento máximo en soles (para cupones porcentuales)
  // Ej: 20% de descuento con máximo S/ 100
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscount: number | null;

  // Monto mínimo de compra para aplicar el cupón
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minPurchaseAmount: number;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  // Límites de uso
  @Column({ type: 'int', nullable: true })
  maxTotalUses: number | null; // Máximo de usos totales (null = ilimitado)

  @Column({ type: 'int', nullable: true })
  maxUsesPerPerson: number | null; // Máximo de usos por persona (null = ilimitado)

  @Column({ type: 'int', default: 0 })
  currentUses: number; // Contador de usos actuales

  // Vigencia
  @Column({ type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  // Restricciones
  @Column({ type: 'boolean', default: false })
  requiresCipValidation: boolean; // Solo para colegiados CIP

  @Column({ type: 'boolean', default: true })
  canCombineWithOthers: boolean; // Se puede combinar con otros cupones

  @Column({ type: 'boolean', default: true })
  appliesToAllTickets: boolean; // Aplica a todos los tickets del evento

  // Relaciones
  @ManyToOne(() => Event, { nullable: true })
  event: Event | null; // null = cupón global para cualquier evento

  // Tickets específicos a los que aplica (si appliesToAllTickets = false)
  @ManyToMany(() => EventTicket)
  @JoinTable({
    name: 'coupon_tickets',
    joinColumn: { name: 'couponId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'ticketId', referencedColumnName: 'id' },
  })
  applicableTickets: EventTicket[];

  // Auditoría
  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
