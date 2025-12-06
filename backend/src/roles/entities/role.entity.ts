import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Enum para los nombres de roles predefinidos
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  ORG_STAFF_ACCESO = 'ORG_STAFF_ACCESO',
  ORG_STAFF_ACADEMICO = 'ORG_STAFF_ACADEMICO',
  ORG_FINANZAS = 'ORG_FINANZAS',
  PONENTE = 'PONENTE',
  PARTICIPANTE = 'PARTICIPANTE',
  ADMIN = 'ADMIN', // Compatibilidad retro
  USER = 'USER', // Compatibilidad retro
  MODERATOR = 'MODERATOR',
  ORGANIZER = 'ORGANIZER',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
