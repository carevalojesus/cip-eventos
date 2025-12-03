import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Event, EventStatus } from './entities/event.entity';

@Injectable()
export class EventsCronService {
  private readonly logger = new Logger(EventsCronService.name);
  private readonly enableCron: boolean;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly configService: ConfigService,
  ) {
    // Habilitar en producción o si se configura explícitamente
    this.enableCron =
      this.configService.get<string>('NODE_ENV') === 'production' ||
      this.configService.get<string>('EVENTS_CRON_ENABLED') === 'true';

    if (this.enableCron) {
      this.logger.log('✅ Events Cron jobs habilitados');
    } else {
      this.logger.log('⏸️ Events Cron jobs deshabilitados (NODE_ENV !== production)');
    }
  }

  /**
   * Auto-completar eventos cuya fecha de fin ya pasó
   * Se ejecuta cada 15 minutos
   */
  @Cron(CronExpression.EVERY_15_MINUTES, {
    name: 'auto-complete-events',
    timeZone: 'America/Lima',
  })
  async autoCompleteEvents() {
    if (!this.enableCron) {
      return;
    }

    try {
      this.logger.log('🔄 Verificando eventos para auto-completar...');

      const now = new Date();

      // Buscar eventos PUBLISHED cuyo endAt ya pasó
      const eventsToComplete = await this.eventRepository.find({
        where: {
          status: EventStatus.PUBLISHED,
          endAt: LessThan(now),
          isActive: true,
        },
      });

      if (eventsToComplete.length === 0) {
        this.logger.log('✅ No hay eventos pendientes de completar');
        return;
      }

      // Actualizar estado a COMPLETED
      for (const event of eventsToComplete) {
        event.status = EventStatus.COMPLETED;
        await this.eventRepository.save(event);
        this.logger.log(`✅ Evento completado: "${event.title}" (ID: ${event.id})`);
      }

      this.logger.log(
        `📊 Resumen: ${eventsToComplete.length} evento(s) marcado(s) como COMPLETED`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error al auto-completar eventos: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Reporte diario de eventos próximos
   * Se ejecuta todos los días a las 7:00 AM
   */
  @Cron('0 7 * * *', {
    name: 'daily-events-report',
    timeZone: 'America/Lima',
  })
  async dailyEventsReport() {
    if (!this.enableCron) {
      return;
    }

    try {
      this.logger.log('📅 Generando reporte diario de eventos...');

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      // Eventos que inician hoy o mañana
      const upcomingEvents = await this.eventRepository
        .createQueryBuilder('event')
        .where('event.status = :status', { status: EventStatus.PUBLISHED })
        .andWhere('event.isActive = :isActive', { isActive: true })
        .andWhere('event.startAt BETWEEN :now AND :tomorrow', { now, tomorrow })
        .orderBy('event.startAt', 'ASC')
        .getMany();

      if (upcomingEvents.length > 0) {
        this.logger.log(`📊 Eventos próximos (próximas 48h): ${upcomingEvents.length}`);
        upcomingEvents.forEach((event) => {
          this.logger.log(
            `   - "${event.title}" - ${new Date(event.startAt).toLocaleString('es-PE')}`,
          );
        });
      } else {
        this.logger.log('📊 No hay eventos programados para las próximas 48 horas');
      }

      // Estadísticas generales
      const stats = await this.eventRepository
        .createQueryBuilder('event')
        .select('event.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('event.isActive = :isActive', { isActive: true })
        .groupBy('event.status')
        .getRawMany();

      this.logger.log('📊 Estadísticas de eventos:');
      stats.forEach((stat) => {
        this.logger.log(`   - ${stat.status}: ${stat.count}`);
      });
    } catch (error) {
      this.logger.error(
        `❌ Error en reporte diario: ${error.message}`,
        error.stack,
      );
    }
  }
}
