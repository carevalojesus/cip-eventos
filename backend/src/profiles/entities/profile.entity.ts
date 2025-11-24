import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  // 👇 NUEVOS CAMPOS 👇
  @Column({ type: 'text', nullable: true })
  designation: string; // Ej: "Ingeniero Civil Senior" o "Gerente de Proyectos"

  @Column({ type: 'text', nullable: true })
  description: string; // Ej: "Especialista en estructuras con 10 años de exp..."

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  avatar: string; // Guardaremos la URL de la imagen, no el archivo binario
  // 👆 ------------------

  @Column({ type: 'text', nullable: true })
  phoneNumber: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
