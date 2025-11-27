import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cip_members')
export class CipMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true }) // Índice para búsqueda rápida por CIP
  @Column({ type: 'text' })
  cip: string;

  @Index() // Índice para búsqueda por DNI (para invitados que dicen ser ingenieros)
  @Column({ type: 'text', nullable: true })
  dni: string;

  @Column({ type: 'text' })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  chapter: string; // Ej: CIVIL, SISTEMAS

  @Column({ type: 'boolean', default: false })
  isHabilitado: boolean; // true = HABILITADO, false = NO HABILITADO

  @Column({ type: 'text', nullable: true })
  condition: string; // ORDINARIO, VITALICIO

  // Fecha de la última vez que actualizaste esta data desde el Excel
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  importedAt: Date;
}
