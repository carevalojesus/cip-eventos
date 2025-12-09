import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { Registration } from '../../registrations/entities/registration.entity';
import { User } from '../../users/entities/user.entity';
import { Person } from '../../persons/entities/person.entity';
import { DocumentType } from '../../common/enums/document-type.enum';
export { DocumentType };

@Entity('attendees')
@Index(['documentType', 'documentNumber'], { unique: true })
export class Attendee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  @Column({ type: 'text', unique: true })
  email: string; // Identificador único para invitado

  @Column({
    type: 'enum',
    enum: DocumentType,
    enumName: 'document_type_enum',
    default: DocumentType.DNI,
  })
  documentType: DocumentType;

  @Column({ type: 'text' })
  documentNumber: string;

  @Column({ type: 'text', nullable: true })
  cipCode: string; // Importante para tu lógica de descuentos del CIP

  @Column({ type: 'text', nullable: true })
  phone: string;

  // Vinculación con la entidad Persona (modelo unificado de identidad)
  // Cada attendee DEBE tener una persona asociada
  @ManyToOne(() => Person, { nullable: false })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User;

  @OneToMany(() => Registration, (reg) => reg.attendee)
  registrations: Registration[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
