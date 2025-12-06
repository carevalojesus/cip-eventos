import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, Between } from 'typeorm';
import { Registration, RegistrationStatus } from '../../registrations/entities/registration.entity';
import { NotificationTriggersService } from './notification-triggers.service';
import { Event } from '../../events/entities/event.entity';

/**
 * Servicio de cron para notificaciones automáticas
 * Maneja triggers programados y recordatorios
 */
@Injectable()
export class NotificationsCronService {
  private readonly logger = new Logger(NotificationsCronService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {}

  /**
   * Cada 5 minutos: revisar reservas por expirar
   * Envía recordatorio a reservas pendientes que expiran en 10-15 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkExpiringReservations(): Promise<void> {
    try {
      this.logger.debug('Checking for expiring reservations...');

      const now = new Date();
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

      // Buscar registros pendientes que expiran entre 10 y 15 minutos
      const expiringRegistrations = await this.registrationRepo.find({
        where: {
          status: RegistrationStatus.PENDING,
          expiresAt: Between(tenMinutesFromNow, fifteenMinutesFromNow),
        },
        relations: ['attendee', 'attendee.user', 'event'],
      });

      this.logger.log(
        `Found ${expiringRegistrations.length} expiring reservations`,
      );

      // Enviar notificación para cada uno
      for (const registration of expiringRegistrations) {
        if (!registration.expiresAt) continue;

        const minutesLeft = Math.floor(
          (registration.expiresAt.getTime() - now.getTime()) / 60000,
        );

        await this.notificationTriggers.onReservationExpiringSoon(
          registration,
          minutesLeft,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error checking expiring reservations: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cada hora: revisar reservas expiradas
   * Marca como expiradas y envía notificación
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredReservations(): Promise<void> {
    try {
      this.logger.debug('Checking for expired reservations...');

      const now = new Date();

      // Buscar registros pendientes que ya expiraron
      const expiredRegistrations = await this.registrationRepo.find({
        where: {
          status: RegistrationStatus.PENDING,
          expiresAt: LessThanOrEqual(now),
        },
        relations: ['attendee', 'attendee.user', 'event'],
      });

      this.logger.log(`Found ${expiredRegistrations.length} expired reservations`);

      // Marcar como expirados y notificar
      for (const registration of expiredRegistrations) {
        // Actualizar estado
        registration.status = RegistrationStatus.EXPIRED;
        await this.registrationRepo.save(registration);

        // Enviar notificación
        await this.notificationTriggers.onReservationExpired(registration);
      }
    } catch (error) {
      this.logger.error(
        `Error checking expired reservations: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cada día a las 9am: recordatorio de eventos próximos
   * Envía recordatorio a inscritos de eventos que empiezan mañana
   */
  @Cron('0 9 * * *')
  async sendEventReminders(): Promise<void> {
    try {
      this.logger.debug('Sending event reminders...');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Buscar eventos que empiezan mañana
      const upcomingEvents = await this.eventRepo.find({
        where: {
          startAt: Between(tomorrow, dayAfterTomorrow),
        },
      });

      this.logger.log(
        `Found ${upcomingEvents.length} events starting tomorrow`,
      );

      // Para cada evento, buscar inscritos confirmados
      for (const event of upcomingEvents) {
        const confirmedRegistrations = await this.registrationRepo.find({
          where: {
            event: { id: event.id },
            status: RegistrationStatus.CONFIRMED,
          },
          relations: ['attendee', 'attendee.user', 'event'],
        });

        this.logger.log(
          `Event "${event.title}" has ${confirmedRegistrations.length} confirmed attendees`,
        );

        // Enviar recordatorio a cada inscrito
        // Nota: Aquí podrías crear un nuevo trigger específico para recordatorios de eventos
        // Por ahora, lo dejamos como log
        for (const registration of confirmedRegistrations) {
          this.logger.debug(
            `Would send reminder to ${registration.attendee.email} for event ${event.title}`,
          );
          // TODO: Implementar trigger específico de recordatorio de evento
        }
      }
    } catch (error) {
      this.logger.error(
        `Error sending event reminders: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cada día a la medianoche: limpiar notificaciones antiguas
   * Elimina notificaciones leídas de más de 30 días
   */
  @Cron('0 0 * * *')
  async cleanupOldNotifications(): Promise<void> {
    try {
      this.logger.debug('Cleaning up old notifications...');

      // La limpieza se maneja en el servicio de notificaciones
      // Aquí solo lo invocamos desde el cron
      const deleted =
        await this.notificationTriggers['notificationsService'].deleteOldNotifications(
          30,
        );

      this.logger.log(`Deleted ${deleted} old notifications`);
    } catch (error) {
      this.logger.error(
        `Error cleaning up notifications: ${error.message}`,
        error.stack,
      );
    }
  }
}
