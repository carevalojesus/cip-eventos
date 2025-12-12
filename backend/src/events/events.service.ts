import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, ILike } from 'typeorm';
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
import { EventLocation } from './entities/event-location.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  PaginationDto,
  paginate,
  PaginatedResult,
} from '../common/dto/pagination.dto';
import { RedisService } from '../redis/redis.service';
import { Registration, RegistrationStatus } from '../registrations/entities/registration.entity';
import { FindEventsDto } from './dto/find-events.dto';

// Cache TTLs
const CATALOG_CACHE_TTL = 60 * 60 * 1000; // 1 hora para catálogos
const EVENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos para eventos individuales
const EVENTS_LIST_CACHE_TTL = 2 * 60 * 1000; // 2 minutos para listados

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
    @InjectRepository(EventLocation)
    private readonly locationRepository: Repository<EventLocation>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    private readonly redisService: RedisService,
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

    // Ejecutar todas las consultas en paralelo para evitar N+1
    const [user, type, category, modality, speakers, organizers] =
      await Promise.all([
        this.userRepository.findOne({
          where: { id: userId, isActive: true },
        }),
        this.eventTypeRepository.findOneBy({ id: typeId }),
        categoryId
          ? this.eventCategoryRepository.findOneBy({ id: categoryId })
          : Promise.resolve(null),
        this.eventModalityRepository.findOneBy({ id: modalityId }),
        speakersIds && speakersIds.length > 0
          ? this.speakerRepository.findBy({
              id: In(speakersIds),
              isActive: true,
            })
          : Promise.resolve([]),
        organizersIds && organizersIds.length > 0
          ? this.organizerRepository.findBy({
              id: In(organizersIds),
              isActive: true,
            })
          : Promise.resolve([]),
      ]);

    // Validaciones
    if (!user) throw new NotFoundException('User not found');
    if (!type) throw new NotFoundException('Event Type not found');
    if (categoryId && !category)
      throw new NotFoundException('Event Category not found');
    if (!modality) throw new NotFoundException('Event Modality not found');

    // Validar speakers si se proporcionaron
    if (
      speakersIds &&
      speakersIds.length > 0 &&
      speakers.length !== speakersIds.length
    ) {
      throw new NotFoundException('One or more speakers not found');
    }

    // Validar organizers si se proporcionaron
    if (
      organizersIds &&
      organizersIds.length > 0 &&
      organizers.length !== organizersIds.length
    ) {
      throw new NotFoundException('One or more organizers not found');
    }

    const slug = this.generateSlug(eventData.title);

    // Deduplicar ubicación
    let eventLocation: EventLocation | undefined;
    if (location) {
      const existingLocation = await this.locationRepository.findOne({
        where: {
          name: location.name,
          address: location.address,
          city: location.city,
        },
      });

      if (existingLocation) {
        eventLocation = existingLocation;
      } else {
        eventLocation = this.locationRepository.create(location);
      }
    }

    const event = this.eventRepository.create({
      ...eventData,
      slug,
      type: { id: typeId },
      ...(categoryId && { category: { id: categoryId } }),
      modality: { id: modalityId },
      createdBy: user,
      location: eventLocation,
      virtualAccess,
      speakers,
      organizers,
    });

    const savedEvent = await this.eventRepository.save(event);
    await this.invalidateEventCache(savedEvent.id);
    return savedEvent;
  }

  async getTypes() {
    const cacheKey = 'catalog:event-types';
    const cached = await this.redisService.get<EventType[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const types = await this.eventTypeRepository.find();
    await this.redisService.set(cacheKey, types, CATALOG_CACHE_TTL);
    return types;
  }

  async getCategories() {
    const cacheKey = 'catalog:event-categories';
    const cached = await this.redisService.get<EventCategory[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.eventCategoryRepository.find();
    await this.redisService.set(cacheKey, categories, CATALOG_CACHE_TTL);
    return categories;
  }

  async getModalities() {
    const cacheKey = 'catalog:event-modalities';
    const cached = await this.redisService.get<EventModality[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const modalities = await this.eventModalityRepository.find();
    await this.redisService.set(cacheKey, modalities, CATALOG_CACHE_TTL);
    return modalities;
  }

  async invalidateCatalogCache() {
    await Promise.all([
      this.redisService.del('catalog:event-types'),
      this.redisService.del('catalog:event-categories'),
      this.redisService.del('catalog:event-modalities'),
    ]);
  }

  async invalidateEventCache(eventId: string) {
    await Promise.all([
      this.redisService.del(`event:${eventId}`),
      // Invalidar listados (las primeras páginas más comunes)
      this.redisService.del('events:list:1:10'),
      this.redisService.del('events:list:1:20'),
      this.redisService.del('events:list:2:10'),
    ]);
  }

  async getLocations() {
    const locations = await this.locationRepository.find({
      select: ['id', 'name', 'address', 'reference', 'city', 'mapLink'],
      order: { city: 'ASC', name: 'ASC', address: 'ASC' },
    });

    const uniqueMap = new Map<string, EventLocation>();
    for (const loc of locations) {
      const key = `${(loc.address || '').toLowerCase()}|${(loc.city || '').toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, loc);
      }
    }

    return Array.from(uniqueMap.values());
  }

  async findAll(filters?: FindEventsDto): Promise<PaginatedResult<Event>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.type', 'type')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.modality', 'modality')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .leftJoinAndSelect('event.location', 'location')
      .leftJoinAndSelect('event.speakers', 'speakers')
      .leftJoinAndSelect('event.organizers', 'organizers')
      .leftJoinAndSelect('event.tickets', 'tickets')
      .where('event.isActive = :active', { active: true });

    // Filtro por estado (opcional)
    if (filters?.status) {
      qb.andWhere('event.status = :status', { status: filters.status });
    }

    // Rango de fechas (inicio)
    if (filters?.from && filters?.to) {
      qb.andWhere('event.startAt BETWEEN :from AND :to', {
        from: new Date(filters.from),
        to: new Date(filters.to),
      });
    } else if (filters?.from) {
      qb.andWhere('event.startAt >= :from', { from: new Date(filters.from) });
    } else if (filters?.to) {
      qb.andWhere('event.startAt <= :to', { to: new Date(filters.to) });
    }

    // Búsqueda por título/resumen/ciudad
    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(event.title) LIKE :term OR LOWER(event.summary) LIKE :term OR LOWER(location.city) LIKE :term)',
        { term },
      );
    }

    // Ordenar por prioridad de estado y fecha de inicio
    qb.addSelect(
      `CASE 
        WHEN event.status = :published THEN 1
        WHEN event.status = :draft THEN 2
        WHEN event.status = :completed THEN 3
        WHEN event.status = :cancelled THEN 4
        ELSE 5
      END`,
      'status_priority',
    ).setParameters({
      published: EventStatus.PUBLISHED,
      draft: EventStatus.DRAFT,
      completed: EventStatus.COMPLETED,
      cancelled: EventStatus.CANCELLED,
    });

    qb.orderBy('status_priority', 'ASC').addOrderBy('event.startAt', 'ASC');

    const [events, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return paginate(events, total, page, limit);
  }

  async findOne(id: string) {
    // Intentar obtener del cache
    const cacheKey = `event:${id}`;
    const cached = await this.redisService.get<Event>(cacheKey);
    if (cached) {
      return cached;
    }

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

    await this.redisService.set(cacheKey, event, EVENT_CACHE_TTL);
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
        'organizers',
        'tickets',
        'sessions',
        'signers',
      ],
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    return event;
  }

  async getMetrics(eventId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isActive: true },
      relations: ['tickets'],
    });

    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`);

    const ticketsCount = event.tickets?.length || 0;
    const totalStock =
      event.tickets?.reduce((acc, ticket) => acc + (ticket.stock || 0), 0) || 0;

    const [enrolledCount, revenue, checkInsCount] = await Promise.all([
      this.registrationRepository.count({
        where: {
          event: { id: eventId },
          status: In([
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.PENDING,
            RegistrationStatus.ATTENDED,
          ]),
        },
      }),
      this.registrationRepository
        .createQueryBuilder('registration')
        .select('SUM(registration.finalPrice)', 'sum')
        .where('registration.eventId = :eventId', { eventId })
        .andWhere('registration.status IN (:...statuses)', {
          statuses: [
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.ATTENDED,
          ],
        })
        .getRawOne()
        .then((result) => Number(result?.sum || 0)),
      this.registrationRepository.count({
        where: {
          event: { id: eventId },
          status: In([RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED]),
          attended: true,
        },
      }),
    ]);

    return {
      ticketsCount,
      totalStock,
      enrolledCount,
      totalRevenue: revenue,
      checkInsCount,
    };
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

    // Deduplicar ubicación
    let eventLocation: EventLocation | undefined;
    if (location) {
      const existingLocation = await this.locationRepository.findOne({
        where: {
          name: location.name,
          address: location.address,
          city: location.city,
        },
      });

      if (existingLocation) {
        eventLocation = existingLocation;
      } else {
        eventLocation = this.locationRepository.create(location);
      }
    }

    const event = await this.eventRepository.preload({
      id,
      ...eventData,
      location: eventLocation,
      virtualAccess,
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    // Cargar todas las relaciones necesarias en paralelo
    const [type, category, modality, speakers, organizers] = await Promise.all([
      typeId
        ? this.eventTypeRepository.findOneBy({ id: typeId })
        : Promise.resolve(null),
      categoryId
        ? this.eventCategoryRepository.findOneBy({ id: categoryId })
        : Promise.resolve(null),
      modalityId
        ? this.eventModalityRepository.findOneBy({ id: modalityId })
        : Promise.resolve(null),
      speakersIds
        ? this.speakerRepository.findBy({ id: In(speakersIds), isActive: true })
        : Promise.resolve(null),
      organizersIds
        ? this.organizerRepository.findBy({
            id: In(organizersIds),
            isActive: true,
          })
        : Promise.resolve(null),
    ]);

    // Validaciones y asignaciones
    if (typeId) {
      if (!type) throw new NotFoundException('Event Type not found');
      event.type = type;
    }

    if (categoryId) {
      if (!category) throw new NotFoundException('Event Category not found');
      event.category = category;
    }

    if (modalityId) {
      if (!modality) throw new NotFoundException('Event Modality not found');
      event.modality = modality;
    }

    if (speakersIds) {
      if (!speakers || speakers.length !== speakersIds.length) {
        throw new NotFoundException('One or more speakers not found');
      }
      event.speakers = speakers;
    }

    if (organizersIds) {
      if (!organizers || organizers.length !== organizersIds.length) {
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

    const savedEvent = await this.eventRepository.save(event);
    await this.invalidateEventCache(id);
    return savedEvent;
  }

  async remove(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
    });

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    // Soft delete: marcar como inactivo
    event.isActive = false;
    const savedEvent = await this.eventRepository.save(event);
    await this.invalidateEventCache(id);
    return savedEvent;
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

  async getTickets(eventId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isActive: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    return this.ticketRepository.find({
      where: { event: { id: eventId } },
      order: { name: 'ASC' },
    });
  }

  async getTicket(eventId: string, ticketId: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, event: { id: eventId, isActive: true } },
      relations: ['event'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    return ticket;
  }

  async updateTicket(
    eventId: string,
    ticketId: string,
    updateTicketDto: UpdateTicketDto,
  ) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, event: { id: eventId, isActive: true } },
      relations: ['event'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    Object.assign(ticket, updateTicketDto);

    return this.ticketRepository.save(ticket);
  }

  async deleteTicket(eventId: string, ticketId: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, event: { id: eventId, isActive: true } },
      relations: ['registrations'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    // Si tiene registros, solo desactivar (soft delete)
    if (ticket.registrations && ticket.registrations.length > 0) {
      ticket.isActive = false;
      await this.ticketRepository.save(ticket);
      return { message: 'Ticket desactivado (tiene registros asociados)' };
    }

    // Si no tiene registros, eliminar completamente
    await this.ticketRepository.remove(ticket);
    return { message: 'Ticket eliminado correctamente' };
  }

  async publish(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
      relations: ['type', 'category', 'modality', 'location', 'virtualAccess'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be published');
    }

    // Validar que la fecha de inicio no haya pasado
    const now = new Date();
    if (new Date(event.startAt) < now) {
      throw new BadRequestException(
        'No se puede publicar un evento cuya fecha de inicio ya pasó',
      );
    }

    event.status = EventStatus.PUBLISHED;
    const saved = await this.eventRepository.save(event);
    await this.invalidateEventCache(id);
    return saved;
  }
}
