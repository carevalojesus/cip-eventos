import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Event } from '../../events/entities/event.entity';

@Entity('speakers')
export class Speaker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  @Exclude() // No se serializa en responses públicas
  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'text' })
  profession: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ type: 'text', nullable: true })
  knowledge: string;

  @Column({ type: 'text', nullable: true })
  companyName: string;

  @Exclude() // No se serializa en responses públicas
  @Column({ type: 'text', nullable: true })
  phoneNumber: string;

  @ManyToMany(() => Event, (event) => event.speakers)
  events: Event[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
