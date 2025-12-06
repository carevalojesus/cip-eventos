import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, LessThan, LessThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Cron, CronExpression } from '@nestjs/schedule';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';

// Entidades
import {
  Registration,
  RegistrationStatus,
} from './entities/registration.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee, DocumentType } from '../attendees/entities/attendee.entity';
import { User } from '../users/entities/user.entity';
import { EventStatus } from '../events/entities/event.entity';
import { EventSession } from '../events/entities/event-session.entity';
import { SessionAttendance, AttendanceStatus, AttendanceModality } from '../evaluations/entities/session-attendance.entity';

// DTOs y Servicios
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CheckInDto, CheckOutDto, CheckInMode } from './dto/check-in.dto';
import { MailService } from '../mail/mail.service';
import { CipIntegrationService } from '../cip-integration/cip-integration.service';
import { EmailQueueService } from '../queue/services/email-queue.service';
import { CouponsService, CouponValidationResult } from '../coupons/coupons.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { NotificationTriggersService } from '../notifications/services/notification-triggers.service';

// Tiempo de expiración de reserva en minutos (por defecto 30)
const DEFAULT_RESERVATION_TIMEOUT_MINUTES = 30;

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);
  private readonly reservationTimeoutMinutes: number;

  constructor(
    @InjectRepository(Registration) private regRepo: Repository<Registration>,
    @InjectRepository(EventTicket) private ticketRepo: Repository<EventTicket>,
    @InjectRepository(Attendee) private attendeeRepo: Repository<Attendee>,
    @InjectRepository(EventSession) private sessionRepo: Repository<EventSession>,
    @InjectRepository(SessionAttendance) private attendanceRepo: Repository<SessionAttendance>,
    private readonly mailService: MailService,
    private readonly cipService: CipIntegrationService,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
    private readonly emailQueueService: EmailQueueService,
    private readonly couponsService: CouponsService,
    private readonly configService: ConfigService,
    private readonly waitlistService: WaitlistService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {
    this.reservationTimeoutMinutes = this.configService.get<number>(
      'RESERVATION_TIMEOUT_MINUTES',
      DEFAULT_RESERVATION_TIMEOUT_MINUTES,
    );
  }

  async create(dto: CreateRegistrationDto, user?: User | null) {
    const { ticketId, couponCode } = dto;

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

        // 2. 📉 VALIDAR STOCK DE FORMA ATÓMICA (solo contar CONFIRMED y PENDING no expirados)
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

        // 4. 🚫 VALIDAR DUPLICIDAD (Misma persona, mismo evento - excluir expirados)
        const existing = await manager.findOne(Registration, {
          where: {
            attendee: { id: attendee.id },
            event: { id: event.id },
            status: In([
              RegistrationStatus.CONFIRMED,
              RegistrationStatus.PENDING,
              RegistrationStatus.ATTENDED,
            ]),
          },
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

        // 6. 🎟️ VALIDAR Y APLICAR CUPÓN (si existe)
        const originalPrice = Number(ticket.price);
        let finalPrice = originalPrice;
        let discountAmount = 0;
        let couponValidation: CouponValidationResult | null = null;

        if (couponCode) {
          couponValidation = await this.couponsService.validateCoupon({
            code: couponCode,
            ticketId: ticketId,
            attendeeId: attendee.id,
            cipCode: attendee.cipCode || undefined,
          });

          if (!couponValidation.isValid) {
            throw new BadRequestException(
              couponValidation.errorMessage ||
              this.i18n.t('registrations.invalid_coupon', {
                lang: I18nContext.current()?.lang,
              }),
            );
          }

          finalPrice = couponValidation.finalPrice!;
          discountAmount = couponValidation.discount!;
          this.logger.log(
            `🎟️ Cupón ${couponCode} aplicado: -S/${discountAmount} (${originalPrice} → ${finalPrice})`,
          );
        }

        // 7. 💰 DEFINIR ESTADO Y FECHA DE EXPIRACIÓN
        let status = RegistrationStatus.PENDING;
        let expiresAt: Date | null = null;

        if (finalPrice === 0) {
          // Entrada gratuita o 100% descuento → Confirmar inmediatamente
          status = RegistrationStatus.CONFIRMED;
        } else {
          // Entrada con costo → Establecer fecha límite de pago
          status = RegistrationStatus.PENDING;
          expiresAt = new Date(
            Date.now() + this.reservationTimeoutMinutes * 60 * 1000,
          );
        }

        // 8. 💾 GUARDAR REGISTRO
        const registration = manager.create(Registration, {
          attendee: attendee,
          eventTicket: ticket,
          event,
          ticketCode: uuidv4(),
          originalPrice,
          finalPrice,
          discountAmount,
          expiresAt,
          status,
        });

        const savedReg = await manager.save(registration);

        // 9. 🎟️ REGISTRAR USO DEL CUPÓN
        if (couponValidation?.isValid && couponValidation.coupon) {
          await this.couponsService.applyCoupon(
            couponValidation.coupon,
            savedReg,
            attendee,
            originalPrice,
            finalPrice,
          );
        }

        // 10. 📧 COMUNICACIÓN Y NOTIFICACIONES
        if (savedReg.status === RegistrationStatus.CONFIRMED) {
          // Encolar email de confirmación con ticket
          await this.emailQueueService.queueTicketEmail(savedReg.id);
          this.logger.log(
            `✅ Email de confirmación encolado para ${attendee.email}`,
          );
        } else if (finalPrice > 0) {
          this.logger.log(
            `⏳ Reserva creada para ${attendee.email}, expira en ${this.reservationTimeoutMinutes} minutos`,
          );
          // Trigger notificación de inscripción pendiente
          await this.notificationTriggers.onRegistrationCreated(savedReg);
        }

        return {
          message: this.i18n.t('registrations.process_started', {
            lang: I18nContext.current()?.lang,
          }),
          registrationId: savedReg.id,
          status: savedReg.status,
          originalPrice,
          discount: discountAmount,
          finalPrice,
          expiresAt,
          couponApplied: couponCode ? true : false,
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

  // 🧹 CRON: Expirar reservas pendientes que pasaron su fecha límite
  @Cron(CronExpression.EVERY_MINUTE)
  async expirePendingRegistrations() {
    const now = new Date();

    // Buscar registros pendientes con expiresAt vencido
    const expiredRegistrations = await this.regRepo.find({
      where: {
        status: RegistrationStatus.PENDING,
        expiresAt: LessThanOrEqual(now),
      },
      relations: ['attendee', 'eventTicket'],
    });

    if (expiredRegistrations.length === 0) {
      return;
    }

    this.logger.log(
      `⏰ Expirando ${expiredRegistrations.length} reservas pendientes...`,
    );

    for (const reg of expiredRegistrations) {
      reg.status = RegistrationStatus.EXPIRED;
      await this.regRepo.save(reg);

      this.logger.log(
        `❌ Reserva expirada: ${reg.id} - ${reg.attendee?.email} - Ticket: ${reg.eventTicket?.name}`,
      );

      // TODO: Notificar al usuario que su reserva expiró

      // ✅ Disparar lista de espera si el ticket lo permite
      if (reg.eventTicket && reg.eventTicket.allowsWaitlist) {
        try {
          await this.waitlistService.onStockReleased(reg.eventTicket.id);
        } catch (error) {
          this.logger.error(
            `Error al procesar lista de espera para ticket ${reg.eventTicket.id}: ${error.message}`,
          );
        }
      }
    }

    this.logger.log(
      `✅ ${expiredRegistrations.length} reservas marcadas como expiradas`,
    );
  }

  // 🧹 CRON: Limpiar registros pendientes antiguos (fallback para registros sin expiresAt)
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldPendingRegistrations() {
    const thresholdDate = new Date(
      Date.now() - this.reservationTimeoutMinutes * 2 * 60 * 1000, // 2x el timeout
    );

    const result = await this.regRepo.update(
      {
        status: RegistrationStatus.PENDING,
        expiresAt: null as any, // Solo los que no tienen expiresAt
        registeredAt: LessThan(thresholdDate),
      },
      {
        status: RegistrationStatus.EXPIRED,
      },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `🧹 Se expiraron ${result.affected} registros pendientes antiguos sin fecha de expiración.`,
      );
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

  // ============================================
  // 🎟️ SISTEMA DE CHECK-IN POR QR
  // ============================================

  /**
   * Valida que un ticket exista y esté activo
   * @param ticketCode Código del ticket (QR)
   * @returns Registration si es válido
   * @throws NotFoundException si no existe
   * @throws BadRequestException si está inactivo o no confirmado
   */
  async validateTicket(ticketCode: string): Promise<Registration> {
    const registration = await this.regRepo.findOne({
      where: { ticketCode },
      relations: ['attendee', 'event', 'eventTicket'],
    });

    if (!registration) {
      throw new NotFoundException(
        this.i18n.t('registrations.ticket_not_found_code', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que el ticket esté confirmado
    if (registration.status !== RegistrationStatus.CONFIRMED) {
      throw new BadRequestException(
        this.i18n.t('registrations.ticket_not_confirmed', {
          lang: I18nContext.current()?.lang,
          args: { status: registration.status },
        }),
      );
    }

    return registration;
  }

  /**
   * Obtiene el estado de check-in de un ticket
   * @param ticketCode Código del ticket
   */
  async getCheckInStatus(ticketCode: string) {
    const registration = await this.validateTicket(ticketCode);

    // Buscar todas las asistencias a sesiones
    const sessionAttendances = await this.attendanceRepo.find({
      where: { attendee: { id: registration.attendee.id } },
      relations: ['session'],
      order: { checkInAt: 'DESC' },
    });

    return {
      ticketCode: registration.ticketCode,
      attendee: {
        id: registration.attendee.id,
        firstName: registration.attendee.firstName,
        lastName: registration.attendee.lastName,
        email: registration.attendee.email,
        documentNumber: registration.attendee.documentNumber,
      },
      event: {
        id: registration.event.id,
        title: registration.event.title,
      },
      eventCheckIn: {
        attended: registration.attended,
        attendedAt: registration.attendedAt,
      },
      sessionAttendances: sessionAttendances.map((sa) => ({
        sessionId: sa.session.id,
        sessionTitle: sa.session.title,
        checkInAt: sa.checkInAt,
        checkOutAt: sa.checkOutAt,
        status: sa.status,
        modality: sa.modality,
        minutesAttended: sa.minutesAttended,
        attendancePercentage: sa.attendancePercentage,
      })),
    };
  }

  /**
   * Registra el check-in (entrada) de un ticket
   * Puede ser check-in general al evento o a una sesión específica
   *
   * @param dto CheckInDto con ticketCode, sessionId opcional y mode
   * @param staffUser Usuario del staff que registra el check-in
   */
  async checkInAdvanced(dto: CheckInDto, staffUser?: User) {
    const { ticketCode, sessionId, mode = CheckInMode.SIMPLE } = dto;
    const registration = await this.validateTicket(ticketCode);
    const now = new Date();

    // Si no se especifica sesión, hacer check-in general al evento
    if (!sessionId) {
      return this.checkInEventOnly(registration, now);
    }

    // Check-in a sesión específica
    return this.checkInToSession(registration, sessionId, now, staffUser);
  }

  /**
   * Check-in general al evento (sin sesión específica)
   */
  private async checkInEventOnly(registration: Registration, now: Date) {
    // Validar si ya hizo check-in al evento
    if (registration.attended) {
      const previousTime = registration.attendedAt?.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Modo reingreso: permitir pero notificar
      this.logger.warn(
        `🔄 Reingreso detectado: ${registration.attendee.email} - Última entrada: ${previousTime}`,
      );

      return {
        success: true,
        message: this.i18n.t('registrations.reentry_detected', {
          lang: I18nContext.current()?.lang,
          args: { time: previousTime },
        }),
        isReentry: true,
        attendee: {
          firstName: registration.attendee.firstName,
          lastName: registration.attendee.lastName,
          email: registration.attendee.email,
          documentNumber: registration.attendee.documentNumber,
        },
        event: registration.event.title,
        checkInTime: registration.attendedAt,
        currentTime: now,
      };
    }

    // Registrar check-in
    registration.attended = true;
    registration.attendedAt = now;
    registration.status = RegistrationStatus.ATTENDED;
    await this.regRepo.save(registration);

    this.logger.log(
      `✅ Check-in exitoso: ${registration.attendee.firstName} ${registration.attendee.lastName} - ${registration.event.title}`,
    );

    return {
      success: true,
      message: this.i18n.t('registrations.check_in_success', {
        lang: I18nContext.current()?.lang,
      }),
      isReentry: false,
      attendee: {
        firstName: registration.attendee.firstName,
        lastName: registration.attendee.lastName,
        email: registration.attendee.email,
        documentNumber: registration.attendee.documentNumber,
      },
      event: registration.event.title,
      checkInTime: now,
    };
  }

  /**
   * Check-in a una sesión específica
   */
  private async checkInToSession(
    registration: Registration,
    sessionId: string,
    now: Date,
    staffUser?: User,
  ) {
    // 1. Buscar la sesión
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['event'],
    });

    if (!session) {
      throw new NotFoundException(
        this.i18n.t('registrations.session_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 2. Validar que la sesión pertenezca al evento del ticket
    if (session.event.id !== registration.event.id) {
      throw new BadRequestException(
        this.i18n.t('registrations.session_not_for_event', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 3. Validar horario de la sesión (opcional, se puede omitir para flexibilidad)
    const sessionStart = new Date(session.startAt);
    const sessionEnd = new Date(session.endAt);

    if (now < sessionStart) {
      const startTime = sessionStart.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });

      this.logger.warn(
        `⚠️ Check-in antes de inicio: ${registration.attendee.email} - Sesión inicia a las ${startTime}`,
      );

      // Permitir check-in anticipado pero advertir
      // throw new BadRequestException(
      //   this.i18n.t('registrations.session_not_started', {
      //     lang: I18nContext.current()?.lang,
      //     args: { time: startTime },
      //   }),
      // );
    }

    // 4. Buscar si ya existe un registro de asistencia para esta sesión
    let attendance = await this.attendanceRepo.findOne({
      where: {
        session: { id: sessionId },
        attendee: { id: registration.attendee.id },
      },
    });

    // 5. Si ya existe, validar si es reingreso
    if (attendance && attendance.checkInAt) {
      const previousTime = attendance.checkInAt.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });

      this.logger.warn(
        `🔄 Reingreso a sesión: ${registration.attendee.email} - ${session.title} - Última entrada: ${previousTime}`,
      );

      return {
        success: true,
        message: this.i18n.t('registrations.already_checked_in_session', {
          lang: I18nContext.current()?.lang,
          args: { time: previousTime },
        }),
        isReentry: true,
        attendee: {
          firstName: registration.attendee.firstName,
          lastName: registration.attendee.lastName,
          email: registration.attendee.email,
          documentNumber: registration.attendee.documentNumber,
        },
        session: {
          id: session.id,
          title: session.title,
          startAt: session.startAt,
          endAt: session.endAt,
        },
        checkInTime: attendance.checkInAt,
        currentTime: now,
      };
    }

    // 6. Crear o actualizar el registro de asistencia
    if (!attendance) {
      attendance = this.attendanceRepo.create({
        session: session,
        attendee: registration.attendee,
        status: AttendanceStatus.PRESENT,
        modality: AttendanceModality.IN_PERSON,
        registeredBy: staffUser || null,
      });
    }

    attendance.checkInAt = now;
    attendance.status = AttendanceStatus.PRESENT;

    // Calcular duración de la sesión en minutos
    const sessionDurationMs = sessionEnd.getTime() - sessionStart.getTime();
    attendance.sessionDurationMinutes = Math.floor(sessionDurationMs / (1000 * 60));

    await this.attendanceRepo.save(attendance);

    // 7. También marcar el registro general como asistido
    if (!registration.attended) {
      registration.attended = true;
      registration.attendedAt = now;
      registration.status = RegistrationStatus.ATTENDED;
      await this.regRepo.save(registration);
    }

    this.logger.log(
      `✅ Check-in a sesión exitoso: ${registration.attendee.firstName} ${registration.attendee.lastName} - ${session.title}`,
    );

    return {
      success: true,
      message: this.i18n.t('registrations.check_in_session_success', {
        lang: I18nContext.current()?.lang,
      }),
      isReentry: false,
      attendee: {
        firstName: registration.attendee.firstName,
        lastName: registration.attendee.lastName,
        email: registration.attendee.email,
        documentNumber: registration.attendee.documentNumber,
      },
      session: {
        id: session.id,
        title: session.title,
        startAt: session.startAt,
        endAt: session.endAt,
      },
      checkInTime: now,
      attendance: {
        id: attendance.id,
        status: attendance.status,
        modality: attendance.modality,
      },
    };
  }

  /**
   * Registra el check-out (salida) de una sesión
   * Solo aplica para modo avanzado
   *
   * @param dto CheckOutDto con ticketCode y sessionId
   * @param staffUser Usuario del staff que registra el check-out
   */
  async checkOutSession(dto: CheckOutDto, staffUser?: User) {
    const { ticketCode, sessionId } = dto;
    const registration = await this.validateTicket(ticketCode);
    const now = new Date();

    // 1. Buscar la sesión
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['event'],
    });

    if (!session) {
      throw new NotFoundException(
        this.i18n.t('registrations.session_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 2. Buscar el registro de asistencia
    const attendance = await this.attendanceRepo.findOne({
      where: {
        session: { id: sessionId },
        attendee: { id: registration.attendee.id },
      },
    });

    if (!attendance) {
      throw new BadRequestException(
        this.i18n.t('registrations.not_checked_in_session', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (!attendance.checkInAt) {
      throw new BadRequestException(
        this.i18n.t('registrations.not_checked_in_session', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // 3. Validar si ya hizo check-out
    if (attendance.checkOutAt) {
      const previousTime = attendance.checkOutAt.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });

      throw new BadRequestException(
        this.i18n.t('registrations.already_checked_out', {
          lang: I18nContext.current()?.lang,
          args: { time: previousTime },
        }),
      );
    }

    // 4. Registrar check-out
    attendance.checkOutAt = now;

    // Calcular minutos asistidos
    const checkInTime = new Date(attendance.checkInAt).getTime();
    const checkOutTime = now.getTime();
    const minutesAttended = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
    attendance.minutesAttended = minutesAttended;

    // Calcular porcentaje de asistencia
    if (attendance.sessionDurationMinutes > 0) {
      const percentage = (minutesAttended / attendance.sessionDurationMinutes) * 100;
      attendance.attendancePercentage = Math.min(percentage, 100); // Máximo 100%
    }

    await this.attendanceRepo.save(attendance);

    this.logger.log(
      `🚪 Check-out exitoso: ${registration.attendee.firstName} ${registration.attendee.lastName} - ${session.title} - ${minutesAttended} minutos`,
    );

    return {
      success: true,
      message: this.i18n.t('registrations.check_out_success', {
        lang: I18nContext.current()?.lang,
      }),
      attendee: {
        firstName: registration.attendee.firstName,
        lastName: registration.attendee.lastName,
        email: registration.attendee.email,
      },
      session: {
        id: session.id,
        title: session.title,
      },
      checkInTime: attendance.checkInAt,
      checkOutTime: attendance.checkOutAt,
      minutesAttended,
      attendancePercentage: attendance.attendancePercentage,
    };
  }
}
