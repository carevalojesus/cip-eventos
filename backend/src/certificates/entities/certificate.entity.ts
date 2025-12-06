import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { EventSession } from '../../events/entities/event-session.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { Speaker } from '../../speakers/entities/speaker.entity';
import { User } from '../../users/entities/user.entity';
import { BlockEnrollment } from '../../evaluations/entities/block-enrollment.entity';

export enum CertificateType {
  ATTENDANCE = 'ATTENDANCE', // Asistencia al evento completo
  SESSION_ATTENDANCE = 'SESSION_ATTENDANCE', // Asistencia a sesión específica
  SPEAKER = 'SPEAKER', // Ponente
  ORGANIZER = 'ORGANIZER', // Organizador
  APPROVAL = 'APPROVAL', // Aprobación de bloque evaluable (curso/taller)
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE', // Certificado válido
  REVOKED = 'REVOKED', // Certificado revocado por admin
  EXPIRED = 'EXPIRED', // Certificado expirado por tiempo
}

export interface CertificateVersionHistory {
  version: number;
  issuedAt: Date;
  pdfUrl: string;
  metadata: Record<string, any>;
  reason?: string; // Motivo de reemisión
}

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CertificateType })
  type: CertificateType;

  @Column({
    type: 'enum',
    enum: CertificateStatus,
    default: CertificateStatus.ACTIVE,
  })
  status: CertificateStatus;

  // 👇 CÓDIGO ÚNICO DE VALIDACIÓN (Vital para evitar fraudes)
  @Index({ unique: true })
  @Column({ type: 'text' })
  validationCode: string; // Ej: "CIP-2025-X8J9L"

  @Column({ type: 'text', nullable: true })
  pdfUrl: string; // URL del PDF generado (guardado en S3/Storage)

  // Snapshot de datos importantes al momento de la emisión
  // (Para asegurar integridad histórica si el evento o usuario cambian después)
  @Column({ type: 'simple-json', nullable: true })
  metadata: {
    eventName?: string;
    eventDate?: string;
    hours?: number;
    recipientName?: string;
    [key: string]: any;
  };

  // 👇 CAMPOS DE VERSIONADO
  @Column({ default: 1 })
  version: number;

  @Column({ type: 'jsonb', nullable: true })
  versionHistory: CertificateVersionHistory[];

  // 👇 CAMPOS DE REVOCACIÓN
  @Column({ nullable: true })
  revokedAt: Date;

  @Column({ nullable: true })
  revokedReason: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'revokedById' })
  revokedBy: User;

  // 👇 CAMPOS DE REEMISIÓN
  @Column({ nullable: true })
  lastReissuedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'lastReissuedById' })
  lastReissuedBy: User;

  // --- VINCULACIÓN (Polimórfica simplificada) ---

  @ManyToOne(() => Event, { nullable: false })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  // Opción A: Es un Asistente
  @ManyToOne(() => Registration, { nullable: true })
  @JoinColumn({ name: 'registrationId' })
  registration: Registration;

  // Opción B: Es un Ponente
  @ManyToOne(() => Speaker, { nullable: true })
  @JoinColumn({ name: 'speakerId' })
  speaker: Speaker;

  // Opción C: Es un Organizador (Usuario del sistema)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Opción D: Es un participante aprobado de bloque evaluable
  @ManyToOne(() => BlockEnrollment, { nullable: true })
  @JoinColumn({ name: 'blockEnrollmentId' })
  blockEnrollment: BlockEnrollment;

  // Opción E: Certificado por sesión específica
  @ManyToOne(() => EventSession, { nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: EventSession;

  @CreateDateColumn()
  issuedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
