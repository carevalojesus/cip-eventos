import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { EventCategory } from './entities/event-category.entity';
import { EventModality } from './entities/event-modality.entity';
import { EventType } from './entities/event-type.entity';
import { User } from '../users/entities/user.entity';

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
  ) {}

  async create(createEventDto: CreateEventDto, userId: string) {
    const {
      typeId,
      categoryId,
      modalityId,
      location,
      virtualAccess,
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
    });

    return this.eventRepository.save(event);
  }

  findAll() {
    // No incluye virtualAccess por seguridad (lazy loading)
    return this.eventRepository.find({
      where: { isActive: true },
      relations: ['type', 'category', 'modality', 'createdBy', 'location'],
    });
  }

  async findOne(id: string) {
    // No incluye virtualAccess por seguridad (lazy loading)
    const event = await this.eventRepository.findOne({
      where: { id, isActive: true },
      relations: ['type', 'category', 'modality', 'createdBy', 'location'],
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
      ...eventData
    } = updateEventDto;

    // Verificar que el evento existe y está activo
    const existingEvent = await this.eventRepository.findOne({
      where: { id, isActive: true },
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

    // Regenerate slug if title changed
    if (eventData.title) {
      event.slug = this.generateSlug(eventData.title);
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

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
