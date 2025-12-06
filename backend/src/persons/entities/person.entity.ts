import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DocumentType } from '../../common/enums/document-type.enum';

export { DocumentType };

export enum PersonStatus {
  ACTIVE = 'ACTIVE',
  MERGED = 'MERGED',
}

@Entity('persons')
@Index(['documentType', 'documentNumber'], { unique: true })
@Index(['email'])
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    enumName: 'document_type_enum',
    default: DocumentType.DNI,
  })
  documentType: DocumentType;

  @Column({ type: 'text' })
  documentNumber: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  country: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  // Tutor (para menores)
  @Column({ type: 'text', nullable: true })
  guardianName: string | null;

  @Column({ type: 'text', nullable: true })
  guardianDocument: string | null;

  @Column({ type: 'text', nullable: true })
  guardianPhone: string | null;

  @Column({ type: 'text', nullable: true })
  guardianAuthorizationUrl: string | null;

  // Flags de riesgo/observación de datos
  @Column({ type: 'boolean', default: false })
  flagRisk: boolean;

  @Column({ type: 'boolean', default: false })
  flagDataObserved: boolean;

  // Campos de validación RENIEC
  @Column({ type: 'int', nullable: true })
  reniecValidationScore: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  reniecValidatedAt: Date | null;

  @Column({
    type: 'enum',
    enum: PersonStatus,
    default: PersonStatus.ACTIVE,
  })
  status: PersonStatus;

  // En caso de fusión, referencia a la persona principal
  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn({ name: 'mergedToPersonId' })
  mergedToPerson: Person | null;

  // Fecha en que se fusionó
  @Column({ type: 'timestamptz', nullable: true })
  mergedAt: Date | null;

  // Usuario que realizó la fusión
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'mergedById' })
  mergedBy: User | null;

  // Vinculación opcional con cuenta de usuario
  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  // Campos de pseudonimización (GDPR / protección de datos)
  @Column({ type: 'boolean', default: false })
  isPseudonymized: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  pseudonymizedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'pseudonymizedById' })
  pseudonymizedBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  deletionRequestedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
