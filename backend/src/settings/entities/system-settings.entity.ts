import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * SystemSettings Entity
 *
 * Almacena configuraciones del sistema en base de datos.
 * Usa un modelo key-value para flexibilidad.
 * Configuraciones sensibles (tokens, passwords) se mantienen en .env
 */
@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @Column({ type: 'varchar', length: 50, default: 'string' })
  type: 'string' | 'number' | 'boolean' | 'json';

  @Column({ type: 'varchar', length: 50, default: 'general' })
  category: 'general' | 'organization' | 'email' | 'integrations' | 'security';

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  isSecret: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
