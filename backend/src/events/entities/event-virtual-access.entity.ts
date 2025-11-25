import { Column, Entity, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Event } from './event.entity';

@Entity('event_virtual_access')
export class EventVirtualAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  platform: string; // Ej: "Zoom", "Google Meet"

  @Column({ type: 'text' })
  meetingUrl: string; // Link de acceso

  @Exclude() // No se serializa en responses públicas
  @Column({ type: 'text', nullable: true })
  meetingPassword: string; // Contraseña si es necesaria

  @Column({ type: 'text', nullable: true })
  instructions: string; // Instrucciones especiales

  // Relación 1:1 de vuelta al evento
  @OneToOne(() => Event, (event) => event.virtualAccess)
  event: Event;
}