import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';

@Entity('coupon_usages')
@Index(['coupon', 'attendee']) // Para validar usos por persona
@Index(['registration']) // Para saber qué cupón usó cada registro
export class CouponUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Coupon)
  coupon: Coupon;

  @ManyToOne(() => Registration)
  registration: Registration;

  @ManyToOne(() => Attendee)
  attendee: Attendee;

  // Snapshot del descuento aplicado
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountApplied: number;

  // Precio original antes del descuento
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalPrice: number;

  // Precio final después del descuento
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number;

  @CreateDateColumn()
  usedAt: Date;
}
