import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';

// Entidades
import { TicketTransfer } from './entities/ticket-transfer.entity';
import { Registration, RegistrationStatus } from '../registrations/entities/registration.entity';
import { Attendee, DocumentType } from '../attendees/entities/attendee.entity';
import { Person } from '../persons/entities/person.entity';
import { User } from '../users/entities/user.entity';
import { SessionAttendance } from '../evaluations/entities/session-attendance.entity';
import { BlockEnrollment } from '../evaluations/entities/block-enrollment.entity';

// DTOs y Enums
import { InitiateTransferDto } from './dto/initiate-transfer.dto';
import { TransferValidationDto } from './dto/transfer-validation.dto';
import { TransferResponseDto } from './dto/transfer-response.dto';
import { TransferStatus } from './enums/transfer-status.enum';

@Injectable()
export class TicketTransfersService {
  private readonly logger = new Logger(TicketTransfersService.name);

  constructor(
    @InjectRepository(TicketTransfer)
    private readonly transferRepo: Repository<TicketTransfer>,
    @InjectRepository(Registration)
    private readonly regRepo: Repository<Registration>,
    @InjectRepository(Attendee)
    private readonly attendeeRepo: Repository<Attendee>,
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    @InjectRepository(SessionAttendance)
    private readonly sessionAttendanceRepo: Repository<SessionAttendance>,
    @InjectRepository(BlockEnrollment)
    private readonly blockEnrollmentRepo: Repository<BlockEnrollment>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Inicia una transferencia de ticket
   */
  async initiateTransfer(
    registrationId: string,
    toAttendeeData: InitiateTransferDto,
    initiatedBy?: User,
    reason?: string,
  ): Promise<TicketTransfer> {
    this.logger.log(`Iniciating transfer for registration: ${registrationId}`);

    return await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      // 1. Obtener registration con ticket y evento
      const registration = await manager.findOne(Registration, {
        where: { id: registrationId },
        relations: ['attendee', 'eventTicket', 'event', 'attendee.person'],
      });

      if (!registration) {
        throw new NotFoundException(
          this.i18n.t('registrations.not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 2. Validar que puede transferirse
      await this.validateTransfer(registration, manager);

      // 3. Buscar o crear Attendee destino
      const toAttendee = await this.findOrCreateAttendee(
        toAttendeeData,
        manager,
      );

      // 4. Buscar o crear Person destino (si no existe)
      let toPerson: Person | null = toAttendee.person;
      if (!toPerson) {
        toPerson = await this.findOrCreatePerson(toAttendeeData, manager);
        // Vincular person con attendee
        toAttendee.person = toPerson;
        await manager.save(toAttendee);
      }

      // 5. Obtener fromPerson
      const fromPerson = registration.attendee.person;

      // 6. Crear registro de transferencia
      const transfer = manager.create(TicketTransfer, {
        registration,
        fromAttendee: registration.attendee,
        toAttendee,
        fromPerson,
        toPerson,
        status: TransferStatus.PENDING,
        reason: reason || toAttendeeData.reason,
        initiatedBy: initiatedBy || null,
      });

      await manager.save(transfer);

      this.logger.log(
        `Transfer created with ID: ${transfer.id}, status: ${transfer.status}`,
      );

      // 7. Si no requiere aprobación, completar directamente
      // Por ahora, todas las transferencias se completan automáticamente
      // En el futuro se puede agregar lógica de aprobación
      const completedTransfer = await this.completeTransferInternal(
        transfer.id,
        manager,
        initiatedBy,
      );

      return completedTransfer;
    });
  }

  /**
   * Completa una transferencia pendiente
   */
  async completeTransfer(
    transferId: string,
    approvedBy?: User,
  ): Promise<TicketTransfer> {
    return await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      return await this.completeTransferInternal(
        transferId,
        manager,
        approvedBy,
      );
    });
  }

  /**
   * Método interno para completar transferencia (usado en transacciones)
   */
  private async completeTransferInternal(
    transferId: string,
    manager: any,
    approvedBy?: User,
  ): Promise<TicketTransfer> {
    // 1. Obtener transfer
    const transfer = await manager.findOne(TicketTransfer, {
      where: { id: transferId },
      relations: [
        'registration',
        'registration.eventTicket',
        'registration.event',
        'toAttendee',
        'fromAttendee',
      ],
    });

    if (!transfer) {
      throw new NotFoundException(
        this.i18n.t('transfers.not_found', {
          lang: I18nContext.current()?.lang,
          defaultValue: 'Transferencia no encontrada',
        }),
      );
    }

    // 2. Validar que está en PENDING
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        this.i18n.t('transfers.not_pending', {
          lang: I18nContext.current()?.lang,
          defaultValue: 'La transferencia no está pendiente',
        }),
      );
    }

    // 3. Validar que aún está dentro del deadline
    const ticket = transfer.registration.eventTicket;
    if (ticket.transferDeadline && new Date() > ticket.transferDeadline) {
      transfer.status = TransferStatus.REJECTED;
      transfer.rejectionReason = this.i18n.t('transfers.deadline_passed', {
        lang: I18nContext.current()?.lang,
        defaultValue: 'La fecha límite para transferir ha pasado',
      });
      await manager.save(transfer);
      throw new BadRequestException(transfer.rejectionReason);
    }

    // 4. Actualizar registration.attendee al nuevo
    transfer.registration.attendee = transfer.toAttendee;
    await manager.save(transfer.registration);

    // 5. Actualizar enrollments si hay (bloques evaluables)
    const enrollments = await manager.find(BlockEnrollment, {
      where: {
        registration: { id: transfer.registration.id },
        attendee: { id: transfer.fromAttendee.id },
      },
    });

    if (enrollments.length > 0) {
      this.logger.log(
        `Updating ${enrollments.length} block enrollments for transfer ${transferId}`,
      );
      for (const enrollment of enrollments) {
        enrollment.attendee = transfer.toAttendee;
        await manager.save(enrollment);
      }
    }

    // 6. Marcar transfer como COMPLETED
    transfer.status = TransferStatus.COMPLETED;
    transfer.completedAt = new Date();
    transfer.approvedBy = approvedBy || null;
    await manager.save(transfer);

    this.logger.log(`Transfer ${transferId} completed successfully`);

    // TODO: 7. Enviar notificación al nuevo titular
    // await this.emailQueueService.sendTransferCompletedEmail(transfer);

    return transfer;
  }

  /**
   * Cancela una transferencia pendiente
   */
  async cancelTransfer(
    transferId: string,
    cancelledBy: User,
  ): Promise<TicketTransfer> {
    const transfer = await this.transferRepo.findOne({
      where: { id: transferId },
    });

    if (!transfer) {
      throw new NotFoundException(
        this.i18n.t('transfers.not_found', {
          lang: I18nContext.current()?.lang,
          defaultValue: 'Transferencia no encontrada',
        }),
      );
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        this.i18n.t('transfers.not_pending', {
          lang: I18nContext.current()?.lang,
          defaultValue: 'La transferencia no está pendiente',
        }),
      );
    }

    transfer.status = TransferStatus.CANCELLED;
    await this.transferRepo.save(transfer);

    this.logger.log(
      `Transfer ${transferId} cancelled by user ${cancelledBy.id}`,
    );

    return transfer;
  }

  /**
   * Valida si un ticket puede ser transferido
   */
  async canTransfer(registrationId: string): Promise<TransferValidationDto> {
    const registration = await this.regRepo.findOne({
      where: { id: registrationId },
      relations: ['attendee', 'eventTicket', 'event'],
    });

    if (!registration) {
      throw new NotFoundException(
        this.i18n.t('registrations.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const ticket = registration.eventTicket;
    const validation: TransferValidationDto = {
      canTransfer: true,
      reason: '',
      deadline: ticket.transferDeadline,
      allowsTransfer: ticket.allowsTransfer,
      hasAttendance: false,
      isConfirmed: registration.status === RegistrationStatus.CONFIRMED,
      isDeadlinePassed:
        ticket.transferDeadline !== null &&
        new Date() > ticket.transferDeadline,
    };

    // 1. Ticket permite transferencia
    if (!ticket.allowsTransfer) {
      validation.canTransfer = false;
      validation.reason = this.i18n.t('transfers.not_allowed', {
        lang: I18nContext.current()?.lang,
        defaultValue: 'Este ticket no permite transferencias',
      });
      return validation;
    }

    // 2. Dentro del deadline
    if (validation.isDeadlinePassed) {
      validation.canTransfer = false;
      validation.reason = this.i18n.t('transfers.deadline_passed', {
        lang: I18nContext.current()?.lang,
        defaultValue: 'La fecha límite para transferir ha pasado',
      });
      return validation;
    }

    // 3. Registration está confirmada
    if (!validation.isConfirmed) {
      validation.canTransfer = false;
      validation.reason = this.i18n.t('transfers.not_confirmed', {
        lang: I18nContext.current()?.lang,
        defaultValue: 'Solo se pueden transferir tickets confirmados',
      });
      return validation;
    }

    // 4. No hay asistencia registrada
    const hasAttendance = await this.sessionAttendanceRepo.count({
      where: {
        attendee: { id: registration.attendee.id },
        session: { event: { id: registration.event.id } },
      },
    });

    validation.hasAttendance = hasAttendance > 0;
    if (validation.hasAttendance) {
      validation.canTransfer = false;
      validation.reason = this.i18n.t('transfers.has_attendance', {
        lang: I18nContext.current()?.lang,
        defaultValue:
          'No se puede transferir un ticket con asistencia registrada',
      });
      return validation;
    }

    validation.reason = this.i18n.t('transfers.can_transfer', {
      lang: I18nContext.current()?.lang,
      defaultValue: 'El ticket puede ser transferido',
    });

    return validation;
  }

  /**
   * Obtiene historial de transferencias de un ticket
   */
  async getTransferHistory(
    registrationId: string,
  ): Promise<TransferResponseDto[]> {
    const transfers = await this.transferRepo.find({
      where: { registration: { id: registrationId } },
      relations: [
        'registration',
        'registration.event',
        'registration.eventTicket',
        'fromAttendee',
        'toAttendee',
      ],
      order: { createdAt: 'DESC' },
    });

    return transfers.map((transfer) => this.mapToResponseDto(transfer));
  }

  /**
   * Validaciones privadas
   */
  private async validateTransfer(
    registration: Registration,
    manager: any,
  ): Promise<void> {
    const ticket = registration.eventTicket;

    // 1. Ticket permite transferencia
    if (!ticket.allowsTransfer) {
      throw new BadRequestException(
        this.i18n.t('transfers.not_allowed', {
          lang: I18nContext.current()?.lang,
          defaultValue: 'Este ticket no permite transferencias',
        }),
      );
    }

    // 2. Dentro del deadline
    if (ticket.transferDeadline && new Date() > ticket.transferDeadline) {
      throw new BadRequestException(
        this.i18n.t('transfers.deadline_passed', {
          lang: I18nContext.current()?.lang,
          defaultValue: 'La fecha límite para transferir ha pasado',
        }),
      );
    }

    // 3. No hay asistencia registrada
    const hasAttendance = await manager.count(SessionAttendance, {
      where: {
        attendee: { id: registration.attendee.id },
        session: { event: { id: registration.event.id } },
      },
    });

    if (hasAttendance > 0) {
      throw new BadRequestException(
        this.i18n.t('transfers.has_attendance', {
          lang: I18nContext.current()?.lang,
          defaultValue:
            'No se puede transferir un ticket con asistencia registrada',
        }),
      );
    }

    // 4. Registration está confirmada
    if (registration.status !== RegistrationStatus.CONFIRMED) {
      throw new BadRequestException(
        this.i18n.t('transfers.not_confirmed', {
          lang: I18nContext.current()?.lang,
          defaultValue: 'Solo se pueden transferir tickets confirmados',
        }),
      );
    }
  }

  /**
   * Busca o crea un Attendee
   */
  private async findOrCreateAttendee(
    dto: InitiateTransferDto,
    manager: any,
  ): Promise<Attendee> {
    // Buscar por email o documento
    let attendee = await manager.findOne(Attendee, {
      where: [
        { email: dto.email },
        {
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
        },
      ],
      relations: ['person'],
    });

    if (!attendee) {
      // Crear nuevo attendee
      attendee = manager.create(Attendee, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        phone: dto.phone,
      });
      attendee = await manager.save(attendee);
      this.logger.log(`Created new attendee: ${attendee.id}`);
    }

    return attendee;
  }

  /**
   * Busca o crea una Person
   */
  private async findOrCreatePerson(
    dto: InitiateTransferDto,
    manager: any,
  ): Promise<Person> {
    // Buscar por email o documento
    let person = await manager.findOne(Person, {
      where: [
        { email: dto.email },
        {
          documentType: dto.documentType as any,
          documentNumber: dto.documentNumber,
        },
      ],
    });

    if (!person) {
      // Crear nueva person
      person = manager.create(Person, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        documentType: dto.documentType as any,
        documentNumber: dto.documentNumber,
        phone: dto.phone,
      });
      person = await manager.save(person);
      this.logger.log(`Created new person: ${person.id}`);
    }

    return person;
  }

  /**
   * Mapea una entidad TicketTransfer a DTO de respuesta
   */
  private mapToResponseDto(transfer: TicketTransfer): TransferResponseDto {
    return {
      id: transfer.id,
      status: transfer.status,
      registrationId: transfer.registration.id,
      fromAttendeeName: `${transfer.fromAttendee.firstName} ${transfer.fromAttendee.lastName}`,
      toAttendeeName: `${transfer.toAttendee.firstName} ${transfer.toAttendee.lastName}`,
      reason: transfer.reason,
      rejectionReason: transfer.rejectionReason,
      createdAt: transfer.createdAt,
      completedAt: transfer.completedAt,
      eventName: transfer.registration.event.title,
      ticketName: transfer.registration.eventTicket.name,
    };
  }
}
