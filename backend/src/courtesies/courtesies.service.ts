import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { I18nService, I18nContext } from 'nestjs-i18n';

// Entidades
import { Courtesy } from './entities/courtesy.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { Person } from '../persons/entities/person.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { Speaker } from '../speakers/entities/speaker.entity';
import { EvaluableBlock } from '../evaluations/entities/evaluable-block.entity';
import { Registration, RegistrationStatus } from '../registrations/entities/registration.entity';
import { BlockEnrollment, BlockEnrollmentStatus } from '../evaluations/entities/block-enrollment.entity';
import { User } from '../users/entities/user.entity';

// DTOs
import { GrantCourtesyDto } from './dto/grant-courtesy.dto';
import { CancelCourtesyDto } from './dto/cancel-courtesy.dto';
import { GrantSpeakerCourtesiesDto } from './dto/grant-speaker-courtesies.dto';

// Enums
import { CourtesyStatus } from './enums/courtesy-status.enum';
import { CourtesyScope } from './enums/courtesy-scope.enum';
import { CourtesyType } from './enums/courtesy-type.enum';

// Servicios
import { PersonsService } from '../persons/persons.service';
import { EmailQueueService } from '../queue/services/email-queue.service';

export enum RegistrationOrigin {
  PURCHASE = 'PURCHASE',
  COURTESY = 'COURTESY',
  TRANSFER = 'TRANSFER',
}

@Injectable()
export class CourtesiesService {
  private readonly logger = new Logger(CourtesiesService.name);

  constructor(
    @InjectRepository(Courtesy)
    private readonly courtesyRepo: Repository<Courtesy>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(Attendee)
    private readonly attendeeRepo: Repository<Attendee>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(BlockEnrollment)
    private readonly enrollmentRepo: Repository<BlockEnrollment>,
    @InjectRepository(EvaluableBlock)
    private readonly blockRepo: Repository<EvaluableBlock>,
    @InjectRepository(Speaker)
    private readonly speakerRepo: Repository<Speaker>,
    private readonly personsService: PersonsService,
    private readonly emailQueueService: EmailQueueService,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Otorga una cortesía a una persona
   */
  async grant(dto: GrantCourtesyDto, grantedBy: User): Promise<Courtesy> {
    return await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      // 1. Validar que el evento existe y está activo
      const event = await manager.findOne(Event, {
        where: { id: dto.eventId, isActive: true },
      });

      if (!event) {
        throw new NotFoundException(
          this.i18n.t('courtesies.event_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      if (event.status === EventStatus.CANCELLED) {
        throw new BadRequestException(
          this.i18n.t('courtesies.event_cancelled', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 2. Buscar o crear Person
      let person: Person;
      if (dto.personId) {
        person = await this.personsService.findOne(dto.personId);
      } else if (dto.personData) {
        person = await this.personsService.findOrCreate(dto.personData);
      } else {
        throw new BadRequestException(
          this.i18n.t('courtesies.person_required', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 3. Validar que no tiene cortesía activa para este evento
      const existingCourtesy = await manager.findOne(Courtesy, {
        where: {
          event: { id: event.id },
          person: { id: person.id },
          status: In([CourtesyStatus.ACTIVE, CourtesyStatus.USED]),
        },
      });

      if (existingCourtesy) {
        throw new BadRequestException(
          this.i18n.t('courtesies.already_granted', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 4. Buscar o crear Attendee
      let attendee = await manager.findOne(Attendee, {
        where: [
          { email: person.email },
          { documentNumber: person.documentNumber },
        ],
      });

      if (!attendee) {
        attendee = manager.create(Attendee, {
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          documentType: person.documentType as any,
          documentNumber: person.documentNumber,
          phone: person.phone ?? undefined,
          person: person,
        });
        attendee = await manager.save(Attendee, attendee);
      }

      // 5. Validar bloques específicos si aplica
      let specificBlocks: EvaluableBlock[] = [];
      if (dto.scope === CourtesyScope.SPECIFIC_BLOCKS) {
        if (!dto.specificBlockIds || dto.specificBlockIds.length === 0) {
          throw new BadRequestException(
            this.i18n.t('courtesies.blocks_required', {
              lang: I18nContext.current()?.lang,
            }),
          );
        }

        specificBlocks = await manager.find(EvaluableBlock, {
          where: {
            id: In(dto.specificBlockIds),
            event: { id: event.id },
            isActive: true,
          },
        });

        if (specificBlocks.length !== dto.specificBlockIds.length) {
          throw new BadRequestException(
            this.i18n.t('courtesies.invalid_blocks', {
              lang: I18nContext.current()?.lang,
            }),
          );
        }
      }

      // 6. Validar speaker si aplica
      let speaker: Speaker | null = null;
      if (dto.speakerId) {
        speaker = await manager.findOne(Speaker, {
          where: { id: dto.speakerId },
        });

        if (!speaker) {
          throw new NotFoundException(
            this.i18n.t('courtesies.speaker_not_found', {
              lang: I18nContext.current()?.lang,
            }),
          );
        }
      }

      // 7. Crear la cortesía
      const courtesy = manager.create(Courtesy, {
        event,
        person,
        attendee,
        type: dto.type,
        scope: dto.scope,
        status: CourtesyStatus.ACTIVE,
        reason: dto.reason || null,
        notes: dto.notes || null,
        specificBlocks,
        speaker,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        grantedBy,
        grantedAt: new Date(),
      });

      const savedCourtesy = await manager.save(Courtesy, courtesy);

      // 8. Crear acceso gratuito según el scope
      await this.createFreeAccess(manager, savedCourtesy, attendee, event);

      this.logger.log(
        `Cortesía otorgada: ${dto.type} para ${person.email} en evento ${event.title}`,
      );

      // 9. Enviar notificación por email (asíncrono)
      // TODO: Implementar método queueCourtesyGrantedEmail en EmailQueueService
      // try {
      //   await this.emailQueueService.queueCourtesyGrantedEmail(
      //     savedCourtesy.id,
      //   );
      // } catch (error) {
      //   this.logger.error(
      //     `Error al encolar email de cortesía: ${error.message}`,
      //   );
      // }

      return savedCourtesy;
    });
  }

  /**
   * Crea registration/enrollments gratis para la cortesía
   */
  private async createFreeAccess(
    manager: any,
    courtesy: Courtesy,
    attendee: Attendee,
    event: Event,
  ): Promise<void> {
    if (courtesy.scope === CourtesyScope.FULL_EVENT) {
      // Verificar que no tenga registration activa
      const existingReg = await manager.findOne(Registration, {
        where: {
          attendee: { id: attendee.id },
          event: { id: event.id },
          status: In([
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.PENDING,
          ]),
        },
      });

      if (existingReg) {
        this.logger.warn(
          `Attendee ${attendee.email} ya tiene registration activa para evento ${event.id}`,
        );
        return;
      }

      // Crear Registration con precio 0
      const registration = manager.create(Registration, {
        attendee,
        event,
        eventTicket: null, // No hay ticket asociado
        ticketCode: uuidv4(),
        originalPrice: 0,
        finalPrice: 0,
        discountAmount: 0,
        status: RegistrationStatus.CONFIRMED,
        attended: false,
        // Campos para cortesía (se agregarán en la migración)
        // origin: RegistrationOrigin.COURTESY,
        // courtesy: courtesy,
      });

      await manager.save(Registration, registration);

      this.logger.log(
        `Registration gratuita creada para ${attendee.email} en evento ${event.title}`,
      );
    } else if (courtesy.scope === CourtesyScope.SPECIFIC_BLOCKS) {
      // Crear BlockEnrollments gratis para cada bloque
      for (const block of courtesy.specificBlocks) {
        // Verificar que no tenga enrollment activo
        const existingEnrollment = await manager.findOne(BlockEnrollment, {
          where: {
            attendee: { id: attendee.id },
            block: { id: block.id },
            status: In([
              BlockEnrollmentStatus.ENROLLED,
              BlockEnrollmentStatus.PENDING,
              BlockEnrollmentStatus.IN_PROGRESS,
            ]),
          },
        });

        if (existingEnrollment) {
          this.logger.warn(
            `Attendee ${attendee.email} ya tiene enrollment activo para bloque ${block.id}`,
          );
          continue;
        }

        const enrollment = manager.create(BlockEnrollment, {
          block,
          attendee,
          status: BlockEnrollmentStatus.ENROLLED,
          originalPrice: 0,
          discountAmount: 0,
          finalPrice: 0,
          attendancePercentage: 0,
          sessionsAttended: 0,
          totalSessions: block.sessions?.length || 0,
          meetsAttendanceRequirement: false,
          passed: false,
          retakeAttemptsUsed: 0,
          enrolledAt: new Date(),
          // Campo para cortesía (se agregará en la migración)
          // courtesy: courtesy,
        });

        await manager.save(BlockEnrollment, enrollment);

        this.logger.log(
          `Enrollment gratuito creado para ${attendee.email} en bloque ${block.name}`,
        );
      }
    }
    // ASSIGNED_SESSIONS_ONLY: el acceso se determina por ser ponente
    // No se crea nada automático
  }

  /**
   * Cancela una cortesía
   */
  async cancel(
    courtesyId: string,
    dto: CancelCourtesyDto,
    cancelledBy: User,
  ): Promise<Courtesy> {
    return await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const courtesy = await manager.findOne(Courtesy, {
        where: { id: courtesyId },
        relations: ['event', 'person', 'attendee'],
      });

      if (!courtesy) {
        throw new NotFoundException(
          this.i18n.t('courtesies.not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      if (courtesy.status !== CourtesyStatus.ACTIVE) {
        throw new BadRequestException(
          this.i18n.t('courtesies.not_active', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Cancelar registration asociada si existe
      if (courtesy.registration) {
        const registration = await manager.findOne(Registration, {
          where: { id: courtesy.registration.id },
        });

        if (registration && registration.status !== RegistrationStatus.CANCELLED) {
          registration.status = RegistrationStatus.CANCELLED;
          await manager.save(Registration, registration);
        }
      }

      // Cancelar enrollments asociados
      const enrollments = await manager.find(BlockEnrollment, {
        where: {
          attendee: { id: courtesy.attendee?.id },
          block: { id: In(courtesy.specificBlocks.map((b) => b.id)) },
        },
      });

      for (const enrollment of enrollments) {
        if (enrollment.status !== BlockEnrollmentStatus.CANCELLED) {
          enrollment.status = BlockEnrollmentStatus.CANCELLED;
          await manager.save(BlockEnrollment, enrollment);
        }
      }

      // Marcar cortesía como cancelada
      courtesy.status = CourtesyStatus.CANCELLED;
      courtesy.cancelledBy = cancelledBy;
      courtesy.cancelledAt = new Date();
      courtesy.cancellationReason = dto.reason;

      const savedCourtesy = await manager.save(Courtesy, courtesy);

      this.logger.log(
        `Cortesía cancelada: ${courtesyId} - Razón: ${dto.reason}`,
      );

      return savedCourtesy;
    });
  }

  /**
   * Lista cortesías de un evento
   */
  async findByEvent(eventId: string): Promise<Courtesy[]> {
    return this.courtesyRepo.find({
      where: { event: { id: eventId } },
      relations: ['person', 'attendee', 'speaker', 'grantedBy', 'cancelledBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lista cortesías de una persona
   */
  async findByPerson(personId: string): Promise<Courtesy[]> {
    return this.courtesyRepo.find({
      where: { person: { id: personId } },
      relations: ['event', 'speaker', 'grantedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene una cortesía por ID
   */
  async findOne(id: string): Promise<Courtesy> {
    const courtesy = await this.courtesyRepo.findOne({
      where: { id },
      relations: [
        'event',
        'person',
        'attendee',
        'speaker',
        'specificBlocks',
        'registration',
        'blockEnrollments',
        'grantedBy',
        'cancelledBy',
      ],
    });

    if (!courtesy) {
      throw new NotFoundException(
        this.i18n.t('courtesies.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return courtesy;
  }

  /**
   * Otorga cortesía automática a ponentes de un evento
   */
  async grantSpeakerCourtesies(
    eventId: string,
    dto: GrantSpeakerCourtesiesDto,
    grantedBy: User,
  ): Promise<Courtesy[]> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, isActive: true },
      relations: ['speakers'],
    });

    if (!event) {
      throw new NotFoundException(
        this.i18n.t('courtesies.event_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (!event.speakers || event.speakers.length === 0) {
      throw new BadRequestException(
        this.i18n.t('courtesies.no_speakers', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const createdCourtesies: Courtesy[] = [];

    for (const speaker of event.speakers) {
      try {
        // Buscar o crear persona para el speaker
        let person: Person | null;
        try {
          person = await this.personsService.findByEmail(speaker.email);
          if (!person) {
            person = await this.personsService.create({
              firstName: speaker.firstName,
              lastName: speaker.lastName,
              email: speaker.email,
              documentType: 'DNI' as any,
              documentNumber: `SPEAKER-${speaker.id.slice(0, 8)}`,
              phone: speaker.phoneNumber || undefined,
            });
          }
        } catch (error) {
          this.logger.error(
            `Error al buscar/crear persona para speaker ${speaker.email}: ${error.message}`,
          );
          continue;
        }

        // Si después de todo no tenemos persona, continuar
        if (!person) {
          continue;
        }

        // Verificar si ya tiene cortesía
        const existingCourtesy = await this.courtesyRepo.findOne({
          where: {
            event: { id: event.id },
            person: { id: person.id },
            status: In([CourtesyStatus.ACTIVE, CourtesyStatus.USED]),
          },
        });

        if (existingCourtesy) {
          this.logger.warn(
            `Speaker ${speaker.email} ya tiene cortesía para evento ${event.id}`,
          );
          continue;
        }

        // Crear cortesía
        const courtesy = await this.grant(
          {
            eventId: event.id,
            personId: person.id,
            type: CourtesyType.SPEAKER,
            scope: dto.scope,
            speakerId: speaker.id,
            reason: 'Cortesía automática para ponente',
          },
          grantedBy,
        );

        createdCourtesies.push(courtesy);
      } catch (error) {
        this.logger.error(
          `Error al crear cortesía para speaker ${speaker.email}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Cortesías creadas para ${createdCourtesies.length} de ${event.speakers.length} ponentes`,
    );

    return createdCourtesies;
  }

  /**
   * Obtiene estadísticas de cortesías de un evento
   */
  async getEventStats(eventId: string) {
    const courtesies = await this.courtesyRepo.find({
      where: { event: { id: eventId } },
    });

    const stats = {
      total: courtesies.length,
      active: courtesies.filter((c) => c.status === CourtesyStatus.ACTIVE).length,
      used: courtesies.filter((c) => c.status === CourtesyStatus.USED).length,
      cancelled: courtesies.filter((c) => c.status === CourtesyStatus.CANCELLED).length,
      expired: courtesies.filter((c) => c.status === CourtesyStatus.EXPIRED).length,
      byType: {
        speaker: courtesies.filter((c) => c.type === CourtesyType.SPEAKER).length,
        vip: courtesies.filter((c) => c.type === CourtesyType.VIP).length,
        press: courtesies.filter((c) => c.type === CourtesyType.PRESS).length,
        sponsor: courtesies.filter((c) => c.type === CourtesyType.SPONSOR).length,
        staff: courtesies.filter((c) => c.type === CourtesyType.STAFF).length,
        other: courtesies.filter((c) => c.type === CourtesyType.OTHER).length,
      },
      byScope: {
        fullEvent: courtesies.filter((c) => c.scope === CourtesyScope.FULL_EVENT).length,
        assignedSessions: courtesies.filter(
          (c) => c.scope === CourtesyScope.ASSIGNED_SESSIONS_ONLY,
        ).length,
        specificBlocks: courtesies.filter(
          (c) => c.scope === CourtesyScope.SPECIFIC_BLOCKS,
        ).length,
      },
    };

    return stats;
  }
}
