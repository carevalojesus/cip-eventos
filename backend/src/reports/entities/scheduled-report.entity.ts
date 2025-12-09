import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { User } from '../../users/entities/user.entity';
import { ReportType } from '../enums/report-type.enum';
import { ReportFrequency } from '../enums/report-frequency.enum';
import { ReportFormat } from '../enums/report-format.enum';

@Entity('scheduled_reports')
@Index(['isActive'])
@Index(['nextScheduledAt'])
@Index(['event', 'isActive'])
export class ScheduledReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Event, { nullable: true, eager: true })
  @JoinColumn({ name: 'eventId' })
  event: Event | null;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  reportType: ReportType;

  @Column({
    type: 'enum',
    enum: ReportFrequency,
  })
  frequency: ReportFrequency;

  @Column({
    type: 'enum',
    enum: ReportFormat,
  })
  format: ReportFormat;

  @Column({ type: 'text', array: true })
  recipients: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastSentAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextScheduledAt: Date | null;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @Column({ type: 'jsonb', nullable: true })
  config: {
    // Filtros adicionales para el reporte
    dateFrom?: string;
    dateTo?: string;
    status?: string[];
    ticketTypes?: string[];
    // Configuración de horario (para reportes diarios)
    scheduleTime?: string; // HH:mm formato 24h, ej: "08:00"
    // Día de la semana para reportes semanales (0-6, donde 0 = Domingo)
    weekDay?: number;
    // Día del mes para reportes mensuales (1-31)
    monthDay?: number;
    // Zona horaria para la programación
    timezone?: string;
    // Opciones adicionales
    includeCharts?: boolean;
    includeComparison?: boolean;
    groupBy?: string;
  };

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
