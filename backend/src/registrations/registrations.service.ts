import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, LessThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Cron, CronExpression } from '@nestjs/schedule';
import { I18nService, I18nContext } from 'nestjs-i18n';

// Entidades
import {
  Registration,
  RegistrationStatus,
} from './entities/registration.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee, DocumentType } from '../attendees/entities/attendee.entity';
import { User } from '../users/entities/user.entity';
import { EventStatus } from '../events/entities/event.entity';

// DTOs y Servicios
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { MailService } from '../mail/mail.service';
import { CipIntegrationService } from '../cip-integration/cip-integration.service';
import { EmailQueueService } from '../queue/services/email-queue.service';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    @InjectRepository(Registration) private regRepo: Repository<Registration>,
    @InjectRepository(EventTicket) private ticketRepo: Repository<EventTicket>,
    @InjectRepository(Attendee) private attendeeRepo: Repository<Attendee>,
    private readonly mailService: MailService,
    private readonly cipService: CipIntegrationService,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async create(dto: CreateRegistrationDto, user?: User | null) {
    const { ticketId } = dto;

    // Usar transacción con bloqueo pesimista para prevenir race conditions
    return await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) => {
        // 1. 🎫 BUSCAR TICKET Y EVENTO CON BLOQUEO PESIMISTA
        const ticket = await manager.findOne(EventTicket, {
          where: { id: ticketId, isActive: true },
          relations: ['event', 'event.location'],
          lock: { mode: 'pessimistic_write' }, // 🔒 Bloqueo exclusivo
        });

        if (!ticket)
          throw new NotFoundException(
            this.i18n.t('registrations.ticket_not_found', {
              lang: I18nContext.current()?.lang,
            }),
          );
        const event = ticket.event;

        if (event.status !== EventStatus.PUBLISHED)
          throw new BadRequestException(
            this.i18n.t('registrations.event_not_available', {
              lang: I18nContext.current()?.lang,
            }),
          );

        // 2. 📉 VALIDAR STOCK DE FORMA ATÓMICA
        const reservedCount = await manager.count(Registration, {
          where: {
            eventTicket: { id: ticketId },
            status: In([
              RegistrationStatus.CONFIRMED,
              RegistrationStatus.PENDING,
            ]),
          },
        });

        if (reservedCount >= ticket.stock)
          throw new BadRequestException(
            this.i18n.t('registrations.sold_out', {
              lang: I18nContext.current()?.lang,
            }),
          );

        // 3. 🕵️‍♂️ RESOLVER ATTENDEE (Usuario vs Guest)
        let attendee: Attendee | null;

        if (user) {
          // Usuario Logueado: Buscamos su perfil de asistente
          attendee = await manager.findOne(Attendee, {
            where: { user: { id: user.id } },
          });
          if (!attendee) {
            // Crear perfil rápido basado en User
            attendee = manager.create(Attendee, {
              email: user.email,
              firstName: 'Usuario',
              lastName: 'Registrado',
              user: user,
              documentType: DocumentType.DNI,
              documentNumber: 'PEND-' + user.id.slice(0, 5),
            });
            attendee = await manager.save(attendee);
          }
        } else {
          // Guest: Validamos datos
          if (!dto.email || !dto.documentNumber || !dto.firstName) {
            throw new BadRequestException(
              this.i18n.t('registrations.incomplete_guest_data', {
                lang: I18nContext.current()?.lang,
              }),
            );
          }
          // Buscamos si ya existe (Find or Create)
          attendee = await manager.findOne(Attendee, {
            where: [
              { email: dto.email },
              { documentNumber: dto.documentNumber },
            ],
          });

          if (!attendee) {
            attendee = manager.create(Attendee, {
              ...dto,
              documentType: dto.documentType || DocumentType.DNI,
            });
            attendee = await manager.save(attendee);
          } else {
            // 🔒 VALIDAR CIP ANTES de actualizar
            if (dto.cipCode && dto.cipCode !== attendee.cipCode) {
              const cipValidation = await this.cipService.validateCip(
                dto.cipCode,
              );
              if (!cipValidation.isValid) {
                throw new BadRequestException(
                  this.i18n.t('registrations.invalid_cip_code', {
                    lang: I18nContext.current()?.lang,
                  }),
                );
              }
              attendee.cipCode = dto.cipCode;
              await manager.save(attendee);
            }
          }
        }

        // 4. 🚫 VALIDAR DUPLICIDAD (Misma persona, mismo evento)
        const existing = await manager.findOne(Registration, {
          where: { attendee: { id: attendee.id }, event: { id: event.id } },
        });
        if (existing)
          throw new BadRequestException(
            this.i18n.t('registrations.already_registered', {
              lang: I18nContext.current()?.lang,
            }),
          );

        // 5. 👮‍♂️ REGLAS DE NEGOCIO (CIP)
        if (ticket.requiresCipValidation) {
          if (!attendee.cipCode)
            throw new BadRequestException(
              this.i18n.t('registrations.cip_required', {
                lang: I18nContext.current()?.lang,
              }),
            );

          const cipStatus = await this.cipService.validateCip(attendee.cipCode);
          if (!cipStatus.isHabilitado) {
            throw new BadRequestException(
              this.i18n.t('registrations.not_habilitated', {
                lang: I18nContext.current()?.lang,
              }),
            );
          }
        }

        // 6. 💰 DEFINIR PRECIO Y ESTADO
        const finalPrice = Number(ticket.price);
        let status = RegistrationStatus.PENDING;

        // Lógica de estado inicial
        if (finalPrice === 0) {
          status = RegistrationStatus.CONFIRMED;
        } else {
          status = RegistrationStatus.PENDING;
        }

        // 7. 💾 GUARDAR
        const registration = manager.create(Registration, {
          attendee: attendee,
          eventTicket: ticket,
          event,
          ticketCode: uuidv4(),
          finalPrice,
          status,
        });

        const savedReg = await manager.save(registration);

        // 8. 📧 COMUNICACIÓN
        if (savedReg.status === RegistrationStatus.CONFIRMED) {
          // Encolar email de confirmación con ticket
          await this.emailQueueService.queueTicketEmail(savedReg.id);
          this.logger.log(
            `✅ Email de confirmación encolado para ${attendee.email}`,
          );
        } else if (finalPrice > 0) {
          this.logger.log('⏳ Enviar correo de instrucciones de pago...');
        }

        return {
          message: this.i18n.t('registrations.process_started', {
            lang: I18nContext.current()?.lang,
          }),
          registrationId: savedReg.id,
          status: savedReg.status,
          price: finalPrice,
        };
      },
    );
  }

  async findAll() {
    return this.regRepo.find();
  }

  async findOne(id: string) {
    const registration = await this.regRepo.findOne({
      where: { id },
      relations: ['attendee', 'event', 'eventTicket'],
    });
    if (!registration)
      throw new NotFoundException(
        this.i18n.t('registrations.registration_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    return registration;
  }

  async checkIn(ticketCode: string) {
    const registration = await this.regRepo.findOne({
      where: { ticketCode },
      relations: ['attendee', 'event'],
    });

    if (!registration) {
      throw new NotFoundException(
        this.i18n.t('registrations.ticket_not_found_code', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (registration.attended) {
      throw new BadRequestException(
        this.i18n.t('registrations.already_checked_in', {
          lang: I18nContext.current()?.lang,
          args: {
            name: registration.attendee.firstName,
            time: registration.attendedAt?.toLocaleTimeString(),
          },
        }),
      );
    }

    registration.attended = true;
    registration.attendedAt = new Date();

    await this.regRepo.save(registration);

    return {
      message: this.i18n.t('registrations.check_in_success', {
        lang: I18nContext.current()?.lang,
      }),
      attendee: `${registration.attendee.firstName} ${registration.attendee.lastName}`,
      event: registration.event.title,
      attendedAt: registration.attendedAt,
    };
  }

  // 🧹 CRON: Limpiar registros pendientes antiguos
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupPendingRegistrations() {
    this.logger.log('🧹 Ejecutando limpieza de registros pendientes...');
    const timeoutMinutes = 30;
    const thresholdDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const result = await this.regRepo.update(
      {
        status: RegistrationStatus.PENDING,
        registeredAt: LessThan(thresholdDate),
      },
      {
        status: RegistrationStatus.CANCELLED,
      },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `✅ Se cancelaron ${result.affected} registros pendientes antiguos.`,
      );
    } else {
      this.logger.log('👍 No se encontraron registros para cancelar.');
    }
  }

  // 📊 REPORTES: Estadísticas del evento
  async getEventStats(eventId: string) {
    const registrations = await this.regRepo.find({
      where: {
        event: { id: eventId },
        status: In([RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING]),
      },
    });

    const totalRegistered = registrations.length;
    const totalRevenue = registrations.reduce(
      (sum, reg) => sum + Number(reg.finalPrice),
      0,
    );
    const checkedInCount = registrations.filter((r) => r.attended).length;
    const attendancePercentage =
      totalRegistered > 0
        ? ((checkedInCount / totalRegistered) * 100).toFixed(2)
        : 0;

    return {
      totalRegistered,
      totalRevenue,
      checkedInCount,
      attendancePercentage: `${attendancePercentage}%`,
    };
  }

  // 📋 REPORTES: Lista de asistentes para exportar
  async getEventAttendees(eventId: string) {
    return this.regRepo.find({
      where: {
        event: { id: eventId },
        status: In([RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING]),
      },
      relations: ['attendee', 'eventTicket'],
      order: {
        attendee: {
          lastName: 'ASC',
        },
      },
    });
  }
}
