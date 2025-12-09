import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  NotificationChannel,
  NotificationStatus,
} from '../enums/notification-status.enum';

@Entity('notification_logs')
@Index(['entityType', 'entityId']) // Índice para buscar logs por entidad
@Index(['recipientEmail']) // Índice para buscar por email
@Index(['status']) // Índice para filtrar por estado
@Index(['createdAt']) // Índice para ordenar por fecha
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  type: string; // Tipo de notificación (REGISTRATION_PENDING, PAYMENT_CONFIRMED, etc)

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.EMAIL,
  })
  channel: NotificationChannel; // EMAIL, IN_APP, SMS

  @Column({ type: 'varchar', length: 255 })
  recipientEmail: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recipientUserId' })
  recipientUser: User | null;

  @Column({ type: 'uuid', nullable: true })
  recipientUserId: string | null;

  @Column({ type: 'varchar', length: 100 })
  entityType: string; // Registration, Payment, Certificate, etc.

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.QUEUED,
  })
  status: NotificationStatus; // QUEUED, SENT, FAILED

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;
}
