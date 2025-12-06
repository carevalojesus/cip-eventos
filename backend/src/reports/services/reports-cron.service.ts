import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledReportsService } from './scheduled-reports.service';

@Injectable()
export class ReportsCronService {
  private readonly logger = new Logger(ReportsCronService.name);

  constructor(
    private readonly scheduledReportsService: ScheduledReportsService,
  ) {}

  /**
   * Ejecutar reportes programados cada hora
   * Busca todos los reportes cuya fecha de ejecución sea <= ahora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async executeScheduledReports() {
    this.logger.log('Running scheduled reports check...');

    try {
      const pendingReports =
        await this.scheduledReportsService.getPendingReports();

      if (pendingReports.length === 0) {
        this.logger.log('No pending reports to execute');
        return;
      }

      this.logger.log(
        `Found ${pendingReports.length} pending reports to execute`,
      );

      // Ejecutar cada reporte
      for (const report of pendingReports) {
        try {
          await this.scheduledReportsService.executeScheduledReport(report);
          this.logger.log(`Successfully executed report: ${report.name}`);
        } catch (error) {
          this.logger.error(
            `Failed to execute report ${report.name}: ${error.message}`,
            error.stack,
          );
          // Continuar con los demás reportes aunque uno falle
        }
      }

      this.logger.log('Scheduled reports execution completed');
    } catch (error) {
      this.logger.error(
        `Error during scheduled reports execution: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Verificar reportes de eventos finalizados
   * Se ejecuta cada 6 horas
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkEventEndReports() {
    this.logger.log('Checking for event end reports...');

    try {
      // Aquí se puede implementar lógica para detectar eventos que terminaron
      // y ejecutar reportes configurados como ON_EVENT_END
      // Por ahora es un placeholder

      this.logger.log('Event end reports check completed');
    } catch (error) {
      this.logger.error(
        `Error checking event end reports: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Limpiar reportes antiguos fallidos
   * Se ejecuta diariamente a las 3 AM
   */
  @Cron('0 3 * * *')
  async cleanupOldReports() {
    this.logger.log('Cleaning up old failed reports...');

    try {
      // Aquí se puede implementar lógica para limpiar reportes muy antiguos
      // o desactivar reportes con demasiados fallos consecutivos
      // Por ahora es un placeholder

      this.logger.log('Old reports cleanup completed');
    } catch (error) {
      this.logger.error(
        `Error cleaning up old reports: ${error.message}`,
        error.stack,
      );
    }
  }
}
