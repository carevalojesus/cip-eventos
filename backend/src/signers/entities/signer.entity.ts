import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('signers')
export class Signer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  fullName: string; // Ej: "Ing. María Rodríguez"

  @Column({ type: 'text' })
  title: string; // Ej: "Decana Departamental", "Director de Eventos"

  @Column({ type: 'text' })
  signatureUrl: string; // URL de la imagen de la firma (png transparente)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
