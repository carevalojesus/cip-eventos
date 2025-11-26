import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventStatus } from './entities/event.entity';
import { EventCategory } from './entities/event-category.entity';
import { EventModality } from './entities/event-modality.entity';
import { EventType } from './entities/event-type.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { Organizer } from '../organizers/entities/organizer.entity';
import { User } from '../users/entities/user.entity';
import { EventSession } from './entities/event-session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { EventTicket } from './entities/event-ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,
    @InjectRepository(EventCategory)
    private readonly eventCategoryRepository: Repository<EventCategory>,
    @InjectRepository(EventModality)
    private readonly eventModalityRepository: Repository<EventModality>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Speaker)
    private readonly speakerRepository: Repository<Speaker>,
    @InjectRepository(Organizer)
    private readonly organizerRepository: Repository<Organizer>,
    @InjectRepository(EventSession)
    private readonly sessionRepository: Repository<EventSession>,
    @InjectRepository(EventTicket)
    private readonly ticketRepository: Repository<EventTicket>,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string) {
    const {
      typeId,
      categoryId,
      modalityId,
      location,
      virtualAccess,
      speakersIds,
      organizersIds,
      ...eventData
    } = createEventDto;

    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const type = await this.eventTypeRepository.findOneBy({ id: typeId });
    if (!type) throw new NotFoundException('Event Type not found');

    const category = await this.eventCategoryRepository.findOneBy({
      id: categoryId,
    });
    if (!category) throw new NotFoundException('Event Category not found');

    const modality = await this.eventModalityRepository.findOneBy({
      id: modalityId,
    });
    if (!modality) throw new NotFoundException('Event Modality not found');

    // Validar speakers si se proporcionaron
    let speakers: Speaker[] = [];
    if (speakersIds && speakersIds.length > 0) {
      speakers = await this.speakerRepository.findBy({
        id: In(speakersIds),
        isActive: true,
      });
      if (speakers.length !== speakersIds.length) {
        throw new NotFoundException('One or more speakers not found');
      }
    }

    // Validar organizers si se proporcionaron
    let organizers: Organizer[] = [];
    if (organizersIds && organizersIds.length > 0) {
      organizers = await this.organizerRepository.findBy({
        id: In(organizersIds),
        isActive: true,
      });
      if (organizers.length !== organizersIds.length) {
        throw new NotFoundException('One or more organizers not found');
      }
    }

    const slug = this.generateSlug(eventData.title);

    const event = this.eventRepository.create({
      ...eventData,
      slug,
      type: { id: typeId },
      category: { id: categoryId },
      modality: { id: modalityId },
      createdBy: user,
      location,
      virtualAccess,
      speakers,
      organizers,
    });

    return this.eventRepository.save(event);
  }

  findAll() {
    // No incluye virtualAccess por seguridad (lazy loading)
    return this.eventRepository.find({
      where: { isActive: true, status: EventStatus.PUBLISHED },
      relations: [
        'type',
        'category',
        'modality',
        'createdBy',
        'location',
        'speakers',
        'organizers',
      ],
    });
  }

  async findOne(id: string) {
    // No incluye virtualAccess por seguridad (lazy loading)
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true, status: EventStatus.PUBLISHED },
      relations: [
        'type',
        'category',
        'modality',
        'createdBy',
        'location',
        'speakers',
      ],
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    return event;
  }

  async findOneWithVirtualAccess(id: string) {
    // Incluye virtualAccess (solo para creador o admin)
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
      relations: [
        'type',
        'category',
        'modality',
        'createdBy',
        'location',
        'virtualAccess',
        'speakers',
      ],
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const {
      typeId,
      categoryId,
      modalityId,
      location,
      virtualAccess,
      speakersIds,
      organizersIds,
      ...eventData
    } = updateEventDto;

    // Verificar que el evento existe y está activo
    const existingEvent = await this.eventRepository.findOne({
      where: { id, isActive: true },
      relations: ['virtualAccess'],
    });
    if (!existingEvent)
      throw new NotFoundException(`Event with ID ${id} not found`);

    const event = await this.eventRepository.preload({
      id,
      ...eventData,
      location,
      virtualAccess,
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    if (typeId) {
      const type = await this.eventTypeRepository.findOneBy({ id: typeId });
      if (!type) throw new NotFoundException('Event Type not found');
      event.type = type;
    }

    if (categoryId) {
      const category = await this.eventCategoryRepository.findOneBy({
        id: categoryId,
      });
      if (!category) throw new NotFoundException('Event Category not found');
      event.category = category;
    }

    if (modalityId) {
      const modality = await this.eventModalityRepository.findOneBy({
        id: modalityId,
      });
      if (!modality) throw new NotFoundException('Event Modality not found');
      event.modality = modality;
    }

    if (speakersIds) {
      const speakers = await this.speakerRepository.findBy({
        id: In(speakersIds),
        isActive: true,
      });
      if (speakers.length !== speakersIds.length) {
        throw new NotFoundException('One or more speakers not found');
      }
      event.speakers = speakers;
    }

    if (organizersIds) {
      const organizers = await this.organizerRepository.findBy({
        id: In(organizersIds),
        isActive: true,
      });
      if (organizers.length !== organizersIds.length) {
        throw new NotFoundException('One or more organizers not found');
      }
      event.organizers = organizers;
    }

    // Regenerate slug if title changed
    if (eventData.title) {
      event.slug = this.generateSlug(eventData.title);
    }

    // Validar consistencia de modalidad
    // Determinamos la modalidad final
    const finalModalityId = event.modality?.id ?? existingEvent.modality?.id;
    const MODALITY_PRESENTIAL = 1;
    const MODALITY_VIRTUAL = 2;
    const MODALITY_HYBRID = 3;

    // Determinamos location y virtualAccess finales
    // Nota: location es eager, así que event.location debería tener el valor correcto (nuevo o existente)
    // virtualAccess es lazy, así que si no se actualizó, podría no estar en 'event', usamos existingEvent
    const finalLocation = event.location;
    const finalVirtualAccess =
      'virtualAccess' in updateEventDto
        ? event.virtualAccess
        : existingEvent.virtualAccess;

    if (finalModalityId === MODALITY_PRESENTIAL) {
      if (finalVirtualAccess) {
        throw new BadRequestException(
          'Un evento Presencial no debe tener accesos virtuales',
        );
      }
    }

    if (finalModalityId === MODALITY_VIRTUAL) {
      if (finalLocation) {
        throw new BadRequestException(
          'Un evento Virtual no debe tener ubicación física',
        );
      }
    }

    if (finalModalityId === MODALITY_HYBRID) {
      // Validación flexible: Evento híbrido puede tener:
      // - Solo location (se agregará virtualAccess después)
      // - Solo virtualAccess (se agregará location después)
      // - Ambos (completo)
      // No se aplica validación estricta para máxima flexibilidad
    }

    return this.eventRepository.save(event);
  }

  async remove(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    // Soft delete: marcar como inactivo
    event.isActive = false;
    return this.eventRepository.save(event);
  }

  async addSpeaker(id: string, speakerId: string) {
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
      relations: ['speakers'],
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    const speaker = await this.speakerRepository.findOne({
      where: { id: speakerId, isActive: true },
    });

    if (!speaker)
      throw new NotFoundException(`Speaker with ID ${speakerId} not found`);

    // Verificar si ya existe
    const exists = event.speakers.some((s) => s.id === speakerId);
    if (!exists) {
      event.speakers.push(speaker);
      return this.eventRepository.save(event);
    }

    return event;
  }

  async removeSpeaker(id: string, speakerId: string) {
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
      relations: ['speakers'],
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    event.speakers = event.speakers.filter((s) => s.id !== speakerId);

    return this.eventRepository.save(event);
  }

  async addOrganizer(id: string, organizerId: string) {
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
      relations: ['organizers'],
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    const organizer = await this.organizerRepository.findOne({
      where: { id: organizerId, isActive: true },
    });

    if (!organizer)
      throw new NotFoundException(`Organizer with ID ${organizerId} not found`);

    // Verificar si ya existe
    const exists = event.organizers.some((o) => o.id === organizerId);
    if (!exists) {
      event.organizers.push(organizer);
      return this.eventRepository.save(event);
    }

    return event;
  }

  async removeOrganizer(id: string, organizerId: string) {
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
      relations: ['organizers'],
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    event.organizers = event.organizers.filter((o) => o.id !== organizerId);

    return this.eventRepository.save(event);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async addSessionToEvent(eventId: string, sessionDto: CreateSessionDto) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['sessions', 'speakers'],
    });

    if (!event) throw new NotFoundException('Evento no encontrado');

    // Validación 1: startAt debe ser menor que endAt
    const sessionStart = new Date(sessionDto.startAt);
    const sessionEnd = new Date(sessionDto.endAt);

    if (sessionStart >= sessionEnd) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    // Validación 2: La sesión debe estar dentro del rango del evento padre
    const eventStart = new Date(event.startAt);
    const eventEnd = new Date(event.endAt);

    if (sessionStart < eventStart || sessionEnd > eventEnd) {
      throw new BadRequestException(
        `La sesión debe estar dentro del rango del evento (${event.startAt.toISOString()} - ${event.endAt.toISOString()})`,
      );
    }

    // Validación 3: Validar solapamiento de sesiones en el mismo room
    if (sessionDto.room) {
      const overlappingSessions = event.sessions.filter((session) => {
        if (session.room !== sessionDto.room) return false;

        const existingStart = new Date(session.startAt);
        const existingEnd = new Date(session.endAt);

        // Verificar solapamiento: dos sesiones se solapan si una comienza antes de que termine la otra
        return (
          (sessionStart >= existingStart && sessionStart < existingEnd) ||
          (sessionEnd > existingStart && sessionEnd <= existingEnd) ||
          (sessionStart <= existingStart && sessionEnd >= existingEnd)
        );
      });

      if (overlappingSessions.length > 0) {
        throw new BadRequestException(
          `Ya existe una sesión en la sala "${sessionDto.room}" que se solapa con el horario especificado`,
        );
      }
    }

    // Manejo de Ponentes de la sesión
    let sessionSpeakers: Speaker[] = [];
    if (sessionDto.speakersIds && sessionDto.speakersIds.length > 0) {
      sessionSpeakers = await this.speakerRepository.findBy({
        id: In(sessionDto.speakersIds),
        isActive: true,
      });

      if (sessionSpeakers.length !== sessionDto.speakersIds.length) {
        throw new NotFoundException('Uno o más ponentes no encontrados');
      }

      // Validación 4: Los speakers de la sesión deben ser speakers del evento
      const eventSpeakerIds = event.speakers.map((s) => s.id);
      const invalidSpeakers = sessionDto.speakersIds.filter(
        (id) => !eventSpeakerIds.includes(id),
      );

      if (invalidSpeakers.length > 0) {
        throw new BadRequestException(
          'Algunos ponentes no están asignados a este evento. Primero debes agregarlos al evento.',
        );
      }
    }

    // Crear la sesión
    const session = this.sessionRepository.create({
      ...sessionDto,
      event: event,
      speakers: sessionSpeakers,
    });

    return await this.sessionRepository.save(session);
  }

  async getSessionsByEvent(eventId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isActive: true, status: EventStatus.PUBLISHED },
      relations: ['sessions', 'sessions.speakers'],
    });

    if (!event) throw new NotFoundException('Evento no encontrado');

    return event.sessions;
  }

  async getSessionById(eventId: string, sessionId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isActive: true, status: EventStatus.PUBLISHED },
    });

    if (!event) throw new NotFoundException('Evento no encontrado');

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, event: { id: eventId } },
      relations: ['speakers', 'event'],
    });

    if (!session) throw new NotFoundException('Sesión no encontrada');

    return session;
  }

  async updateSession(
    eventId: string,
    sessionId: string,
    updateDto: UpdateSessionDto,
  ) {
    // Verificar que el evento existe
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isActive: true },
      relations: ['sessions', 'speakers'],
    });

    if (!event) throw new NotFoundException('Evento no encontrado');

    // Buscar la sesión
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, event: { id: eventId } },
      relations: ['speakers'],
    });

    if (!session) throw new NotFoundException('Sesión no encontrada');

    // Determinar las fechas finales (nuevas o existentes)
    const sessionStart = new Date(updateDto.startAt || session.startAt);
    const sessionEnd = new Date(updateDto.endAt || session.endAt);

    // Validación 1: startAt debe ser menor que endAt
    if (sessionStart >= sessionEnd) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    // Validación 2: La sesión debe estar dentro del rango del evento padre
    const eventStart = new Date(event.startAt);
    const eventEnd = new Date(event.endAt);

    if (sessionStart < eventStart || sessionEnd > eventEnd) {
      throw new BadRequestException(
        `La sesión debe estar dentro del rango del evento (${event.startAt.toISOString()} - ${event.endAt.toISOString()})`,
      );
    }

    // Validación 3: Validar solapamiento con otras sesiones (excluyendo la actual)
    // Se ejecuta SIEMPRE, incluso si solo se actualiza el room
    const roomToCheck = updateDto.room ?? session.room;
    if (roomToCheck) {
      const overlappingSessions = event.sessions.filter((s) => {
        if (s.id === sessionId) return false; // Excluir la sesión actual
        if (s.room !== roomToCheck) return false;

        const existingStart = new Date(s.startAt);
        const existingEnd = new Date(s.endAt);

        return (
          (sessionStart >= existingStart && sessionStart < existingEnd) ||
          (sessionEnd > existingStart && sessionEnd <= existingEnd) ||
          (sessionStart <= existingStart && sessionEnd >= existingEnd)
        );
      });

      if (overlappingSessions.length > 0) {
        throw new BadRequestException(
          `Ya existe una sesión en la sala "${roomToCheck}" que se solapa con el horario especificado`,
        );
      }
    }

    // Validar speakers si se proporcionan
    if (updateDto.speakersIds) {
      const sessionSpeakers = await this.speakerRepository.findBy({
        id: In(updateDto.speakersIds),
        isActive: true,
      });

      if (sessionSpeakers.length !== updateDto.speakersIds.length) {
        throw new NotFoundException('Uno o más ponentes no encontrados');
      }

      // Validar que los speakers pertenecen al evento
      const eventSpeakerIds = event.speakers.map((s) => s.id);
      const invalidSpeakers = updateDto.speakersIds.filter(
        (id) => !eventSpeakerIds.includes(id),
      );

      if (invalidSpeakers.length > 0) {
        throw new BadRequestException(
          'Algunos ponentes no están asignados a este evento',
        );
      }

      session.speakers = sessionSpeakers;
    }

    // Actualizar los campos
    Object.assign(session, updateDto);

    return await this.sessionRepository.save(session);
  }

  async deleteSession(eventId: string, sessionId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isActive: true },
    });

    if (!event) throw new NotFoundException('Evento no encontrado');

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, event: { id: eventId } },
    });

    if (!session) throw new NotFoundException('Sesión no encontrada');

    await this.sessionRepository.remove(session);

    return { message: 'Sesión eliminada correctamente' };
  }

  async createTicket(eventId: string, createTicketDto: CreateTicketDto) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isActive: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      event,
    });

    return this.ticketRepository.save(ticket);
  }
}
