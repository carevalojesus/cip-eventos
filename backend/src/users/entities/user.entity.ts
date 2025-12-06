import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../roles/entities/role.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('users')
@Index(['email']) // Índice para búsquedas por email (login)
@Index(['isActive']) // Índice para filtrar usuarios activos
@Index(['isVerified']) // Índice para filtrar usuarios verificados
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'text' })
  password: string;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  currentRefreshToken: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  verificationToken: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  verificationExpires: Date | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  resetPasswordToken: string | null;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  // Campos de eliminación de cuenta (soft delete)
  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  deletionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
