import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';

import { Request } from 'express';

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: UserPayload;
  params: {
    id: string;
  };
}

@Injectable()
export class EventOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const eventId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!eventId) {
      throw new ForbiddenException('Event ID not provided');
    }

    // ADMIN y SUPER_ADMIN pueden modificar cualquier evento
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Buscar el evento
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isActive: true },
      relations: ['createdBy'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Verificar que el usuario sea el creador del evento
    if (event.createdBy?.id !== user.userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this event',
      );
    }

    return true;
  }
}
