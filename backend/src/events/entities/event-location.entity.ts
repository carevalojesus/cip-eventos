import { Column, Entity, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Event } from './event.entity';

@Entity('event_locations')
export class EventLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  name: string; // Nombre del lugar (ej: "Facultad de Sistemas")

  @Column({ type: 'text' })
  address: string; // Dirección completa (ej: "Av. Pevas Cuadra 4")

  @Column({ type: 'text', nullable: true })
  reference: string; // "Frente al parque"

  @Column({ type: 'text' })
  city: string; // Ciudad donde se realiza

  @Column({ type: 'text', nullable: true })
  mapLink: string; // Enlace a Google Maps

  // Relación 1:1 de vuelta al evento
  @OneToOne(() => Event, (event) => event.location)
  event: Event;
}
