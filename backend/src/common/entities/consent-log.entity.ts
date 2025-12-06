import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Person } from '../../persons/entities/person.entity';
import { User } from '../../users/entities/user.entity';
import { ConsentType } from '../enums/consent-type.enum';

@Entity('consent_logs')
@Index(['person', 'consentType'])
@Index(['user', 'consentType'])
@Index(['consentType', 'revokedAt'])
@Index(['acceptedAt'])
export class ConsentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con Person (nullable - para usuarios no registrados o futuros)
  @ManyToOne(() => Person, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personId' })
  person: Person | null;

  // Relación con User (nullable - para usuarios registrados)
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({
    type: 'enum',
    enum: ConsentType,
    enumName: 'consent_type_enum',
  })
  consentType: ConsentType;

  @Column({ type: 'text' })
  documentVersion: string;

  @Column({ type: 'text', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'timestamptz' })
  acceptedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  revokeReason: string | null;

  // Usuario que revocó el consentimiento (si aplica)
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'revokedById' })
  revokedBy: User | null;

  // Metadata adicional en formato JSON para contexto
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
