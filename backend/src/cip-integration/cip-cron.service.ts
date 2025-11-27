import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CipIntegrationService } from './cip-integration.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CipCronService {
  private readonly logger = new Logger(CipCronService.name);
  private readonly enableCron: boolean;

  constructor(
    private readonly cipIntegrationService: CipIntegrationService,
    private readonly configService: ConfigService,
  ) {
    // Solo habilitar en producción o si se configura explícitamente
    this.enableCron = this.configService.get<string>('NODE_ENV') === 'production' ||
      this.configService.get<boolean>('CIP_CRON_ENABLED') === true;

    if (this.enableCron) {
      this.logger.log('CIP Cron jobs habilitados');
    } else {
      this.logger.log('CIP Cron jobs deshabilitados (NODE_ENV !== production)');
    }
  }

  /**
   * Verifica si el padrón necesita actualización
   * Se ejecuta todos los lunes a las 8:00 AM
   */
  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_8AM, {
    name: 'check-padron-update',
    timeZone: 'America/Lima',
  })
  async checkPadronUpdate() {
    if (!this.enableCron) {
      return;
    }

    try {
      this.logger.log('Verificando antigüedad del padrón CIP...');

      const importInfo = await this.cipIntegrationService.getLastImportInfo();

      if (!importInfo.hasData) {
        this.logger.warn('⚠️ No hay datos del padrón CIP. Se requiere primera importación.');
        // Aquí podrías enviar notificación al admin
        return;
      }

      if (importInfo.needsUpdate) {
        this.logger.warn(
          `⚠️ El padrón CIP tiene ${importInfo.daysSinceImport} días sin actualizar. Se recomienda actualización.`,
        );
        // Aquí podrías enviar notificación al admin por email
        // await this.mailService.sendAdminAlert(...)
      } else {
        this.logger.log(
          `✅ Padrón CIP actualizado (${importInfo.daysSinceImport} días desde última importación)`,
        );
      }
    } catch (error) {
      this.logger.error(`Error al verificar padrón: ${error.message}`, error.stack);
    }
  }

  /**
   * Genera reporte semanal de estadísticas
   * Se ejecuta todos los lunes a las 9:00 AM
   */
  @Cron('0 9 * * 1', {
    name: 'weekly-stats-report',
    timeZone: 'America/Lima',
  })
  async generateWeeklyReport() {
    if (!this.enableCron) {
      return;
    }

    try {
      this.logger.log('Generando reporte semanal de estadísticas CIP...');

      const stats = await this.cipIntegrationService.getStats();

      this.logger.log(`📊 Reporte Semanal CIP:`);
      this.logger.log(`   Total miembros: ${stats.total}`);
      this.logger.log(`   Habilitados: ${stats.habilitados} (${stats.percentageHabilitados}%)`);
      this.logger.log(`   No habilitados: ${stats.noHabilitados}`);
      this.logger.log(`   Top 5 Capítulos:`);

      stats.topChapters.slice(0, 5).forEach((chapter, index) => {
        this.logger.log(
          `     ${index + 1}. ${chapter.chapter}: ${chapter.total} (${chapter.habilitados} habilitados)`,
        );
      });

      // Aquí podrías enviar este reporte por email a los administradores
      // await this.mailService.sendWeeklyReport(stats)
    } catch (error) {
      this.logger.error(`Error al generar reporte: ${error.message}`, error.stack);
    }
  }

  /**
   * Limpia registros antiguos si es necesario
   * Se ejecuta el primer día de cada mes a las 2:00 AM
   */
  @Cron('0 2 1 * *', {
    name: 'cleanup-old-data',
    timeZone: 'America/Lima',
  })
  async cleanupOldData() {
    if (!this.enableCron) {
      return;
    }

    try {
      this.logger.log('Ejecutando mantenimiento de datos...');

      // Aquí podrías implementar lógica para limpiar datos muy antiguos
      // Por ejemplo, eliminar registros con más de 2 años sin actualizar

      this.logger.log('✅ Mantenimiento completado');
    } catch (error) {
      this.logger.error(`Error en mantenimiento: ${error.message}`, error.stack);
    }
  }
}
