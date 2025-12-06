import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';

import { WaitlistEntry } from './entities/waitlist-entry.entity';
import { WaitlistStatus } from './enums/waitlist-status.enum';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Person } from '../persons/entities/person.entity';
import { Registration, RegistrationStatus } from '../registrations/entities/registration.entity';
import { EmailQueueService } from '../queue/services/email-queue.service';
import { WaitlistPositionDto } from './dto/waitlist-position.dto';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    @InjectRepository(WaitlistEntry)
    private waitlistRepo: Repository<WaitlistEntry>,
    @InjectRepository(EventTicket)
    private ticketRepo: Repository<EventTicket>,
    @InjectRepository(Person)
    private personRepo: Repository<Person>,
    @InjectRepository(Registration)
    private registrationRepo: Repository<Registration>,
    private readonly i18n: I18nService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Unirse a la lista de espera
   */
  async join(
    ticketId: string,
    personId: string,
    email: string,
  ): Promise<WaitlistEntry> {
    // 1. Validar que el ticket existe y permite lista de espera
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId, isActive: true },
      relations: ['event'],
    });

    if (!ticket) {
      throw new NotFoundException(
        this.i18n.t('waitlist.ticket_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (!ticket.allowsWaitlist) {
      throw new BadRequestException(
        this.i18n.t('waitlist.not_allowed', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 2. Verificar que el ticket está agotado
    const reservedCount = await this.registrationRepo.count({
      where: {
        eventTicket: { id: ticketId },
        status: In([RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING]),
      },
    });

    if (reservedCount < ticket.stock) {
      throw new BadRequestException(
        this.i18n.t('waitlist.tickets_still_available', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 3. Validar que la persona existe
    const person = await this.personRepo.findOne({
      where: { id: personId },
    });

    if (!person) {
      throw new NotFoundException(
        this.i18n.t('waitlist.person_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 4. Validar que la persona no está ya en la lista de espera
    const existingEntry = await this.waitlistRepo.findOne({
      where: {
        person: { id: personId },
        eventTicket: { id: ticketId },
        status: In([WaitlistStatus.WAITING, WaitlistStatus.INVITED]),
      },
    });

    if (existingEntry) {
      throw new BadRequestException(
        this.i18n.t('waitlist.already_in_waitlist', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 5. Verificar que no esté ya registrado en el evento
    const existingRegistration = await this.registrationRepo.findOne({
      where: {
        attendee: { id: personId },
        event: { id: ticket.event.id },
        status: In([
          RegistrationStatus.CONFIRMED,
          RegistrationStatus.PENDING,
          RegistrationStatus.ATTENDED,
        ]),
      },
    });

    if (existingRegistration) {
      throw new BadRequestException(
        this.i18n.t('waitlist.already_registered', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 6. Calcular la siguiente prioridad (FIFO)
    const maxPriority = await this.waitlistRepo
      .createQueryBuilder('wl')
      .where('wl.eventTicketId = :ticketId', { ticketId })
      .select('MAX(wl.priority)', 'max')
      .getRawOne();

    const nextPriority = (maxPriority?.max || 0) + 1;

    // 7. Crear la entrada en la lista de espera
    const entry = this.waitlistRepo.create({
      eventTicket: ticket,
      person,
      email,
      status: WaitlistStatus.WAITING,
      priority: nextPriority,
    });

    const savedEntry = await this.waitlistRepo.save(entry);

    this.logger.log(
      `✅ ${person.email} se unió a la lista de espera del ticket ${ticket.name} (prioridad: ${nextPriority})`,
    );

    // 8. Enviar email de confirmación
    // TODO: Implementar email de confirmación de entrada a lista de espera

    return savedEntry;
  }

  /**
   * Salir de la lista de espera
   */
  async leave(ticketId: string, personId: string): Promise<void> {
    const entry = await this.waitlistRepo.findOne({
      where: {
        person: { id: personId },
        eventTicket: { id: ticketId },
        status: In([WaitlistStatus.WAITING, WaitlistStatus.INVITED]),
      },
    });

    if (!entry) {
      throw new NotFoundException(
        this.i18n.t('waitlist.not_in_waitlist', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    entry.status = WaitlistStatus.CANCELLED;
    await this.waitlistRepo.save(entry);

    this.logger.log(
      `❌ ${entry.person.email} salió de la lista de espera del ticket ${entry.eventTicket.name}`,
    );
  }

  /**
   * Obtener posición en la lista de espera
   */
  async getPosition(
    ticketId: string,
    personId: string,
  ): Promise<WaitlistPositionDto> {
    const entry = await this.waitlistRepo.findOne({
      where: {
        person: { id: personId },
        eventTicket: { id: ticketId },
        status: In([WaitlistStatus.WAITING, WaitlistStatus.INVITED]),
      },
    });

    if (!entry) {
      throw new NotFoundException(
        this.i18n.t('waitlist.not_in_waitlist', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Contar cuántos están antes en la lista
    const position = await this.waitlistRepo.count({
      where: {
        eventTicket: { id: ticketId },
        status: WaitlistStatus.WAITING,
        priority: LessThanOrEqual(entry.priority),
      },
    });

    // Total en la cola
    const totalInQueue = await this.waitlistRepo.count({
      where: {
        eventTicket: { id: ticketId },
        status: WaitlistStatus.WAITING,
      },
    });

    return {
      position,
      totalInQueue,
      status: entry.status,
    };
  }

  /**
   * Obtener el conteo total en lista de espera para un ticket (público)
   */
  async getWaitlistCount(ticketId: string): Promise<number> {
    return await this.waitlistRepo.count({
      where: {
        eventTicket: { id: ticketId },
        status: WaitlistStatus.WAITING,
      },
    });
  }

  /**
   * Invitar al siguiente en la lista de espera
   */
  async inviteNext(ticketId: string): Promise<WaitlistEntry | null> {
    // 1. Buscar el ticket
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId, isActive: true },
    });

    if (!ticket) {
      throw new NotFoundException(
        this.i18n.t('waitlist.ticket_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 2. Buscar el siguiente en la lista (menor prioridad = primero)
    const nextEntry = await this.waitlistRepo.findOne({
      where: {
        eventTicket: { id: ticketId },
        status: WaitlistStatus.WAITING,
      },
      order: {
        priority: 'ASC', // FIFO: el de menor número es el primero
      },
    });

    if (!nextEntry) {
      this.logger.log(
        `ℹ️ No hay nadie en lista de espera para ticket ${ticket.name}`,
      );
      return null;
    }

    // 3. Generar token único de compra
    const purchaseToken = uuidv4();

    // 4. Calcular fecha de expiración de la invitación
    const invitationHours = ticket.waitlistInvitationHours || 24;
    const invitationExpiresAt = new Date(
      Date.now() + invitationHours * 60 * 60 * 1000,
    );

    // 5. Actualizar la entrada
    nextEntry.status = WaitlistStatus.INVITED;
    nextEntry.purchaseToken = purchaseToken;
    nextEntry.invitedAt = new Date();
    nextEntry.invitationExpiresAt = invitationExpiresAt;

    const updatedEntry = await this.waitlistRepo.save(nextEntry);

    this.logger.log(
      `📧 Invitación enviada a ${nextEntry.person.email} para ticket ${ticket.name} (expira en ${invitationHours}h)`,
    );

    // 6. Enviar email con link de compra
    // TODO: Implementar email con link de compra usando purchaseToken
    await this.sendInvitationEmail(updatedEntry, purchaseToken);

    return updatedEntry;
  }

  /**
   * Validar token de compra
   */
  async validateToken(token: string): Promise<WaitlistEntry> {
    const entry = await this.waitlistRepo.findOne({
      where: {
        purchaseToken: token,
        status: WaitlistStatus.INVITED,
      },
      relations: ['eventTicket', 'person'],
    });

    if (!entry) {
      throw new NotFoundException(
        this.i18n.t('waitlist.invalid_token', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Verificar que no haya expirado
    if (entry.invitationExpiresAt && entry.invitationExpiresAt < new Date()) {
      throw new BadRequestException(
        this.i18n.t('waitlist.invitation_expired', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return entry;
  }

  /**
   * Convertir entrada de lista de espera en inscripción
   */
  async convertToRegistration(token: string): Promise<void> {
    const entry = await this.validateToken(token);

    entry.status = WaitlistStatus.CONVERTED;
    entry.convertedAt = new Date();

    await this.waitlistRepo.save(entry);

    this.logger.log(
      `✅ ${entry.person.email} convirtió su invitación en inscripción para ${entry.eventTicket.name}`,
    );
  }

  /**
   * Llamar cuando se libera stock (por expiración de reserva)
   */
  async onStockReleased(ticketId: string): Promise<void> {
    this.logger.log(
      `🔔 Stock liberado para ticket ${ticketId}, verificando lista de espera...`,
    );

    // Invitar al siguiente en la lista
    await this.inviteNext(ticketId);
  }

  /**
   * CRON: Procesar invitaciones expiradas
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processExpiredInvitations(): Promise<void> {
    const now = new Date();

    // Buscar invitaciones expiradas
    const expiredInvitations = await this.waitlistRepo.find({
      where: {
        status: WaitlistStatus.INVITED,
        invitationExpiresAt: LessThanOrEqual(now),
      },
      relations: ['eventTicket'],
    });

    if (expiredInvitations.length === 0) {
      return;
    }

    this.logger.log(
      `⏰ Procesando ${expiredInvitations.length} invitaciones expiradas...`,
    );

    for (const entry of expiredInvitations) {
      // Marcar como expirada
      entry.status = WaitlistStatus.EXPIRED;
      await this.waitlistRepo.save(entry);

      this.logger.log(
        `❌ Invitación expirada: ${entry.person.email} - Ticket: ${entry.eventTicket.name}`,
      );

      // Invitar al siguiente en la lista
      await this.inviteNext(entry.eventTicket.id);
    }

    this.logger.log(
      `✅ ${expiredInvitations.length} invitaciones expiradas procesadas`,
    );
  }

  /**
   * Enviar email de invitación con link de compra
   */
  private async sendInvitationEmail(
    entry: WaitlistEntry,
    token: string,
  ): Promise<void> {
    // TODO: Implementar con EmailQueueService
    // El email debe incluir:
    // - Link de compra con el token
    // - Fecha de expiración
    // - Información del evento y ticket

    this.logger.log(
      `📧 Email de invitación para ${entry.person.email} con token ${token}`,
    );
  }
}
