import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AuditAction } from '../enums/audit-action.enum';

@Entity('audit_logs')
@Index(['entityType'])
@Index(['entityId'])
@Index(['createdAt'])
@Index(['performedBy'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Tipo de entidad afectada (Certificate, ParticipantGrade, Registration, etc.)
  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  // ID de la entidad afectada
  @Column({ type: 'uuid' })
  entityId: string;

  // Acción realizada
  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  // Valores anteriores (antes del cambio)
  @Column({ type: 'jsonb', nullable: true })
  previousValues: Record<string, any> | null;

  // Valores nuevos (después del cambio)
  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any> | null;

  // Lista de campos que cambiaron (para filtros rápidos)
  @Column({ type: 'simple-array', nullable: true })
  changedFields: string[] | null;

  // Usuario que realizó la acción
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performedById' })
  performedBy: User | null;

  // Email del usuario (para casos donde no hay relación o fue eliminado)
  @Column({ type: 'varchar', length: 255, nullable: true })
  performedByEmail: string | null;

  // Dirección IP desde donde se realizó la acción
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  // User agent del navegador/cliente
  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  // Motivo del cambio (opcional, para cambios manuales administrativos)
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  // Metadata adicional (contexto, referencias, etc.)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
