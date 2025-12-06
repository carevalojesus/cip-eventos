import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { EventCoorganizer } from './event-coorganizer.entity';

@Entity('organizers')
export class Organizer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string; // Ej: "Capítulo de Ingeniería Civil" o "Constructora ABC"

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  email: string; // Email de contacto del organizador (para Reply-To en correos)

  // Datos fiscales y configuración base
  @Column({ type: 'varchar', length: 11, nullable: true })
  ruc: string | null;

  @Column({ type: 'text', nullable: true })
  businessName: string | null;

  @Column({ type: 'text', nullable: true })
  fiscalAddress: string | null;

  @Column({ type: 'varchar', length: 3, default: 'PEN' })
  baseCurrency: string;

  @Column({ type: 'boolean', default: false })
  emitsFiscalDocuments: boolean;

  @Column({ type: 'text', nullable: true })
  termsText: string | null;

  @Column({ type: 'text', nullable: true })
  privacyText: string | null;

  // 🔄 Relación N:M (legacy - mantener por compatibilidad)
  @ManyToMany(() => Event, (event) => event.organizers)
  events: Event[];

  // 👇 Nueva relación con roles de coorganización
  @OneToMany(() => EventCoorganizer, (coorg) => coorg.organizer)
  coorganizations: EventCoorganizer[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
