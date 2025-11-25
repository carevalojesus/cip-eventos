import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import {
  Registration,
  RegistrationStatus,
} from './entities/registration.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { AttendeesService } from '../attendees/attendees.service';
import { EventsService } from '../events/events.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    private readonly attendeesService: AttendeesService,
    private readonly eventsService: EventsService,
  ) {}

  async create(createRegistrationDto: CreateRegistrationDto) {
    const {
      eventId,
      attendeeId,
      attendee: attendeeData,
    } = createRegistrationDto;

    // 1. Verificar evento
    const event = await this.eventsService.findOne(eventId);

    // 2. Obtener o crear asistente
    let attendee: Attendee;
    if (attendeeId) {
      attendee = await this.attendeesService.findOne(attendeeId);
    } else if (attendeeData) {
      // Buscar por email o documento para evitar duplicados
      const existingAttendee = await this.attendeesService.findByEmail(
        attendeeData.email,
      );
      if (existingAttendee) {
        attendee = existingAttendee;
      } else {
        attendee = await this.attendeesService.create(attendeeData);
      }
    } else {
      throw new BadRequestException('Attendee ID or data is required');
    }

    // 3. Verificar si ya está registrado
    const existingRegistration = await this.registrationRepository.findOne({
      where: {
        event: { id: eventId },
        attendee: { id: attendee.id },
      },
    });

    if (existingRegistration) {
      throw new BadRequestException(
        'Attendee is already registered for this event',
      );
    }

    // 4. Crear registro
    const registration = this.registrationRepository.create({
      event,
      attendee,
      ticketCode: uuidv4(),
      status: RegistrationStatus.CONFIRMED,
    });

    return this.registrationRepository.save(registration);
  }

  findAll() {
    return this.registrationRepository.find({
      relations: ['attendee', 'event'],
    });
  }

  async findOne(id: string) {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: ['attendee', 'event'],
    });
    if (!registration)
      throw new NotFoundException(`Registration with ID ${id} not found`);
    return registration;
  }
}
