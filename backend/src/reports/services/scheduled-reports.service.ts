import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ScheduledReport } from '../entities/scheduled-report.entity';
import { Event } from '../../events/entities/event.entity';
import { User } from '../../users/entities/user.entity';
import { CreateScheduledReportDto } from '../dto/create-scheduled-report.dto';
import { UpdateScheduledReportDto } from '../dto/update-scheduled-report.dto';
import { ScheduledReportResponseDto } from '../dto/scheduled-report-response.dto';
import { ReportFrequency } from '../enums/report-frequency.enum';
import { ReportType } from '../enums/report-type.enum';
import { ReportFormat } from '../enums/report-format.enum';
import { RegistrationReportsService } from './registration-reports.service';
import { FinancialReportsService } from './financial-reports.service';
import { AcademicReportsService } from './academic-reports.service';
import { ExportService } from './export.service';
import { EmailQueueService } from '../../queue/services/email-queue.service';

@Injectable()
export class ScheduledReportsService {
  private readonly logger = new Logger(ScheduledReportsService.name);

  constructor(
    @InjectRepository(ScheduledReport)
    private readonly scheduledReportRepo: Repository<ScheduledReport>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly registrationReportsService: RegistrationReportsService,
    private readonly financialReportsService: FinancialReportsService,
    private readonly academicReportsService: AcademicReportsService,
    private readonly exportService: ExportService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Crear un reporte programado
   */
  async createScheduledReport(
    dto: CreateScheduledReportDto,
    userId: string,
  ): Promise<ScheduledReportResponseDto> {
    this.logger.log(`Creating scheduled report: ${dto.name}`);

    // Validar evento si se especifica
    if (dto.eventId) {
      const event = await this.eventRepo.findOne({
        where: { id: dto.eventId },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
    }

    // Validar configuración
    this.validateConfig(dto.frequency, dto.config);

    const scheduledReport = this.scheduledReportRepo.create({
      name: dto.name,
      description: dto.description,
      event: dto.eventId ? { id: dto.eventId } as Event : null,
      reportType: dto.reportType,
      frequency: dto.frequency,
      format: dto.format,
      recipients: dto.recipients,
      isActive: dto.isActive ?? true,
      config: dto.config || {},
      createdBy: { id: userId } as User,
      executionCount: 0,
      failureCount: 0,
    });

    // Calcular próxima ejecución
    scheduledReport.nextScheduledAt = this.calculateNextRun(
      dto.frequency,
      null,
      dto.config,
    );

    const saved = await this.scheduledReportRepo.save(scheduledReport);
    return this.mapToResponseDto(saved as ScheduledReport);
  }

  /**
   * Actualizar un reporte programado
   */
  async updateScheduledReport(
    id: string,
    dto: UpdateScheduledReportDto,
  ): Promise<ScheduledReportResponseDto> {
    const scheduledReport = await this.scheduledReportRepo.findOne({
      where: { id },
    });

    if (!scheduledReport) {
      throw new NotFoundException('Scheduled report not found');
    }

    // Validar evento si se actualiza
    if (dto.eventId) {
      const event = await this.eventRepo.findOne({
        where: { id: dto.eventId },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
      scheduledReport.event = event;
    }

    // Actualizar campos
    if (dto.name) scheduledReport.name = dto.name;
    if (dto.description !== undefined)
      scheduledReport.description = dto.description;
    if (dto.reportType) scheduledReport.reportType = dto.reportType;
    if (dto.frequency) scheduledReport.frequency = dto.frequency;
    if (dto.format) scheduledReport.format = dto.format;
    if (dto.recipients) scheduledReport.recipients = dto.recipients;
    if (dto.isActive !== undefined) scheduledReport.isActive = dto.isActive;
    if (dto.config) scheduledReport.config = { ...scheduledReport.config, ...dto.config };

    // Recalcular próxima ejecución si cambió la frecuencia o configuración
    if (dto.frequency || dto.config) {
      this.validateConfig(scheduledReport.frequency, scheduledReport.config);
      scheduledReport.nextScheduledAt = this.calculateNextRun(
        scheduledReport.frequency,
        scheduledReport.lastSentAt,
        scheduledReport.config,
      );
    }

    const updated = await this.scheduledReportRepo.save(scheduledReport);
    return this.mapToResponseDto(updated);
  }

  /**
   * Eliminar un reporte programado
   */
  async deleteScheduledReport(id: string): Promise<void> {
    const result = await this.scheduledReportRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Scheduled report not found');
    }
    this.logger.log(`Deleted scheduled report ${id}`);
  }

  /**
   * Obtener reportes programados
   */
  async getScheduledReports(
    eventId?: string,
  ): Promise<ScheduledReportResponseDto[]> {
    const queryBuilder = this.scheduledReportRepo
      .createQueryBuilder('sr')
      .leftJoinAndSelect('sr.event', 'event')
      .leftJoinAndSelect('sr.createdBy', 'user')
      .orderBy('sr.createdAt', 'DESC');

    if (eventId) {
      queryBuilder.where('sr.eventId = :eventId', { eventId });
    }

    const reports = await queryBuilder.getMany();
    return reports.map((r) => this.mapToResponseDto(r));
  }

  /**
   * Obtener un reporte programado por ID
   */
  async getScheduledReport(id: string): Promise<ScheduledReportResponseDto> {
    const report = await this.scheduledReportRepo.findOne({
      where: { id },
      relations: ['event', 'createdBy'],
    });

    if (!report) {
      throw new NotFoundException('Scheduled report not found');
    }

    return this.mapToResponseDto(report);
  }

  /**
   * Ejecutar un reporte programado manualmente
   */
  async executeReport(id: string): Promise<void> {
    const scheduledReport = await this.scheduledReportRepo.findOne({
      where: { id },
      relations: ['event', 'createdBy'],
    });

    if (!scheduledReport) {
      throw new NotFoundException('Scheduled report not found');
    }

    this.logger.log(
      `Manually executing scheduled report: ${scheduledReport.name}`,
    );

    await this.executeScheduledReport(scheduledReport);
  }

  /**
   * Obtener reportes pendientes de ejecución
   */
  async getPendingReports(): Promise<ScheduledReport[]> {
    const now = new Date();
    return this.scheduledReportRepo.find({
      where: {
        isActive: true,
        nextScheduledAt: LessThanOrEqual(now),
      },
      relations: ['event', 'createdBy'],
    });
  }

  /**
   * Ejecutar un reporte programado (usado por el cron)
   */
  async executeScheduledReport(scheduledReport: ScheduledReport): Promise<void> {
    try {
      this.logger.log(
        `Executing scheduled report: ${scheduledReport.name} (${scheduledReport.id})`,
      );

      // Generar el reporte
      const reportData = await this.generateReportData(scheduledReport);

      // Exportar en el formato especificado
      const fileBuffer = await this.exportReportData(
        scheduledReport,
        reportData,
      );

      // Enviar por correo
      await this.emailQueueService.queueScheduledReportEmail(
        scheduledReport.id,
        scheduledReport.recipients,
        scheduledReport.name,
        fileBuffer,
        this.getFileExtension(scheduledReport.format),
      );

      // Actualizar estadísticas
      scheduledReport.lastSentAt = new Date();
      scheduledReport.executionCount += 1;
      scheduledReport.lastError = null;
      scheduledReport.nextScheduledAt = this.calculateNextRun(
        scheduledReport.frequency,
        scheduledReport.lastSentAt,
        scheduledReport.config,
      );

      await this.scheduledReportRepo.save(scheduledReport);

      this.logger.log(
        `Successfully executed scheduled report: ${scheduledReport.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Error executing scheduled report ${scheduledReport.name}: ${error.message}`,
        error.stack,
      );

      // Actualizar contador de fallos
      scheduledReport.failureCount += 1;
      scheduledReport.lastError = error.message;

      // Si tiene muchos fallos consecutivos, desactivar
      if (scheduledReport.failureCount >= 5) {
        scheduledReport.isActive = false;
        this.logger.warn(
          `Deactivated scheduled report ${scheduledReport.name} due to repeated failures`,
        );
      }

      await this.scheduledReportRepo.save(scheduledReport);
      throw error;
    }
  }

  /**
   * Calcular la próxima fecha de ejecución
   */
  calculateNextRun(
    frequency: ReportFrequency,
    lastRun: Date | null,
    config?: any,
  ): Date | null {
    const now = new Date();
    const baseDate = lastRun || now;
    const next = new Date(baseDate);

    const timezone = config?.timezone || 'America/Lima';
    const scheduleTime = config?.scheduleTime || '08:00';
    const [hours, minutes] = scheduleTime.split(':').map(Number);

    switch (frequency) {
      case ReportFrequency.DAILY:
        if (lastRun) {
          next.setDate(next.getDate() + 1);
        }
        next.setHours(hours, minutes, 0, 0);
        // Si ya pasó la hora de hoy, programar para mañana
        if (next <= now && !lastRun) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case ReportFrequency.WEEKLY:
        const targetWeekDay = config?.weekDay ?? 1; // Lunes por defecto
        if (lastRun) {
          next.setDate(next.getDate() + 7);
        } else {
          const currentDay = next.getDay();
          const daysUntilTarget = (targetWeekDay - currentDay + 7) % 7;
          next.setDate(next.getDate() + (daysUntilTarget || 7));
        }
        next.setHours(hours, minutes, 0, 0);
        break;

      case ReportFrequency.MONTHLY:
        const targetMonthDay = config?.monthDay ?? 1; // Día 1 por defecto
        if (lastRun) {
          next.setMonth(next.getMonth() + 1);
        } else {
          next.setDate(targetMonthDay);
          if (next <= now) {
            next.setMonth(next.getMonth() + 1);
          }
        }
        next.setHours(hours, minutes, 0, 0);
        break;

      case ReportFrequency.ON_EVENT_END:
        // Se programa para cuando termine el evento
        // Esto se debe manejar de forma especial en el cron
        return null;

      default:
        throw new BadRequestException(`Invalid frequency: ${frequency}`);
    }

    return next;
  }

  /**
   * Generar los datos del reporte según el tipo
   */
  private async generateReportData(
    scheduledReport: ScheduledReport,
  ): Promise<any> {
    const eventId = scheduledReport.event?.id;

    if (!eventId && scheduledReport.reportType !== ReportType.MONTHLY_SUMMARY) {
      throw new BadRequestException(
        'Event ID is required for this report type',
      );
    }

    switch (scheduledReport.reportType) {
      case ReportType.DAILY_REGISTRATIONS:
        return this.registrationReportsService.getRegistrationsDetail(eventId!, {
          dateFrom: this.getStartOfDay(),
          dateTo: this.getEndOfDay(),
        });

      case ReportType.DAILY_ATTENDANCE:
        return this.registrationReportsService.getAttendanceBySession(eventId!);

      case ReportType.DAILY_REVENUE:
        return this.financialReportsService.getRevenueReport(eventId!, {
          dateFrom: this.getStartOfDay(),
          dateTo: this.getEndOfDay(),
        });

      case ReportType.WEEKLY_SUMMARY:
        return this.generateWeeklySummary(eventId!);

      case ReportType.MONTHLY_SUMMARY:
        return this.generateMonthlySummary(eventId);

      case ReportType.FINANCIAL_SUMMARY:
        return this.financialReportsService.getRevenueReport(eventId!);

      case ReportType.CERTIFICATE_SUMMARY:
        return this.registrationReportsService.getCertificateStats(eventId!);

      case ReportType.EVENT_FINAL_REPORT:
        return this.generateEventFinalReport(eventId!);

      default:
        throw new BadRequestException(
          `Unsupported report type: ${scheduledReport.reportType}`,
        );
    }
  }

  /**
   * Exportar los datos del reporte en el formato especificado
   */
  private async exportReportData(
    scheduledReport: ScheduledReport,
    data: any,
  ): Promise<Buffer> {
    const format = scheduledReport.format;
    const reportType = scheduledReport.reportType;

    // Preparar columnas según el tipo de reporte
    const { columns, sheets } = this.prepareExportData(reportType, data);

    switch (format) {
      case ReportFormat.CSV:
        return this.exportService.toCsv(data, columns);

      case ReportFormat.EXCEL:
        return this.exportService.toExcel(sheets);

      case ReportFormat.PDF:
        // PDF aún no implementado completamente
        throw new BadRequestException('PDF export not yet supported');

      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  /**
   * Preparar datos para exportación
   */
  private prepareExportData(reportType: ReportType, data: any): any {
    // Esto se puede expandir según el tipo de reporte
    // Por ahora, una implementación básica

    switch (reportType) {
      case ReportType.DAILY_REGISTRATIONS:
        return {
          columns: [
            { header: 'Código', key: 'ticketCode', width: 15 },
            { header: 'Nombre', key: 'attendeeName', width: 30 },
            { header: 'Email', key: 'attendeeEmail', width: 30 },
            { header: 'Tipo', key: 'ticketType', width: 20 },
            { header: 'Estado', key: 'status', width: 15 },
            {
              header: 'Precio',
              key: 'finalPrice',
              width: 15,
              format: 'currency',
            },
            {
              header: 'Fecha',
              key: 'registeredAt',
              width: 20,
              format: 'datetime',
            },
          ],
          sheets: [
            {
              name: 'Inscripciones',
              columns: [
                { header: 'Código', key: 'ticketCode', width: 15 },
                { header: 'Nombre', key: 'attendeeName', width: 30 },
                { header: 'Email', key: 'attendeeEmail', width: 30 },
                { header: 'Tipo', key: 'ticketType', width: 20 },
                { header: 'Estado', key: 'status', width: 15 },
                {
                  header: 'Precio',
                  key: 'finalPrice',
                  width: 15,
                  format: 'currency',
                },
                {
                  header: 'Fecha',
                  key: 'registeredAt',
                  width: 20,
                  format: 'datetime',
                },
              ],
              data: data,
            },
          ],
        };

      case ReportType.DAILY_REVENUE:
        return {
          columns: [
            { header: 'Fecha', key: 'date', width: 15 },
            {
              header: 'Monto',
              key: 'amount',
              width: 15,
              format: 'currency',
            },
            { header: 'Transacciones', key: 'count', width: 15 },
          ],
          sheets: [
            {
              name: 'Ingresos Diarios',
              columns: [
                { header: 'Fecha', key: 'date', width: 15 },
                {
                  header: 'Monto',
                  key: 'amount',
                  width: 15,
                  format: 'currency',
                },
                { header: 'Transacciones', key: 'count', width: 15 },
              ],
              data: data.byDate || [],
            },
          ],
        };

      default:
        // Exportación genérica
        return {
          columns: Object.keys(data[0] || {}).map((key) => ({
            header: key,
            key: key,
            width: 20,
          })),
          sheets: [
            {
              name: 'Reporte',
              columns: Object.keys(data[0] || {}).map((key) => ({
                header: key,
                key: key,
                width: 20,
              })),
              data: Array.isArray(data) ? data : [data],
            },
          ],
        };
    }
  }

  /**
   * Generar resumen semanal
   */
  private async generateWeeklySummary(eventId: string): Promise<any> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const registrations =
      await this.registrationReportsService.getRegistrationsByEvent(eventId, {
        dateFrom: weekAgo.toISOString(),
        dateTo: new Date().toISOString(),
      });

    const revenue = await this.financialReportsService.getRevenueReport(
      eventId,
      {
        dateFrom: weekAgo.toISOString(),
        dateTo: new Date().toISOString(),
      },
    );

    return {
      period: 'weekly',
      dateFrom: weekAgo,
      dateTo: new Date(),
      registrations,
      revenue,
    };
  }

  /**
   * Generar resumen mensual
   */
  private async generateMonthlySummary(eventId?: string): Promise<any> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    if (eventId) {
      const registrations =
        await this.registrationReportsService.getRegistrationsByEvent(eventId, {
          dateFrom: monthAgo.toISOString(),
          dateTo: new Date().toISOString(),
        });

      const revenue = await this.financialReportsService.getRevenueReport(
        eventId,
        {
          dateFrom: monthAgo.toISOString(),
          dateTo: new Date().toISOString(),
        },
      );

      return {
        period: 'monthly',
        dateFrom: monthAgo,
        dateTo: new Date(),
        registrations,
        revenue,
      };
    }

    // Resumen global si no hay eventId
    return {
      period: 'monthly',
      dateFrom: monthAgo,
      dateTo: new Date(),
      message: 'Global monthly summary',
    };
  }

  /**
   * Generar reporte final del evento
   */
  private async generateEventFinalReport(eventId: string): Promise<any> {
    const registrations =
      await this.registrationReportsService.getRegistrationsByEvent(eventId);
    const revenue =
      await this.financialReportsService.getRevenueReport(eventId);
    const certificates =
      await this.registrationReportsService.getCertificateStats(eventId);
    const attendance =
      await this.registrationReportsService.getAttendanceBySession(eventId);

    return {
      registrations,
      revenue,
      certificates,
      attendance,
    };
  }

  /**
   * Validar configuración según frecuencia
   */
  private validateConfig(frequency: ReportFrequency, config?: any): void {
    if (!config) return;

    if (frequency === ReportFrequency.WEEKLY && config.weekDay !== undefined) {
      if (config.weekDay < 0 || config.weekDay > 6) {
        throw new BadRequestException('weekDay must be between 0 and 6');
      }
    }

    if (
      frequency === ReportFrequency.MONTHLY &&
      config.monthDay !== undefined
    ) {
      if (config.monthDay < 1 || config.monthDay > 31) {
        throw new BadRequestException('monthDay must be between 1 and 31');
      }
    }

    if (config.scheduleTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(config.scheduleTime)) {
        throw new BadRequestException(
          'scheduleTime must be in HH:mm format (24h)',
        );
      }
    }
  }

  /**
   * Mapear entidad a DTO de respuesta
   */
  private mapToResponseDto(
    scheduledReport: ScheduledReport,
  ): ScheduledReportResponseDto {
    return {
      id: scheduledReport.id,
      name: scheduledReport.name,
      description: scheduledReport.description,
      eventId: scheduledReport.event?.id,
      eventTitle: scheduledReport.event?.title,
      reportType: scheduledReport.reportType,
      frequency: scheduledReport.frequency,
      format: scheduledReport.format,
      recipients: scheduledReport.recipients,
      isActive: scheduledReport.isActive,
      lastSentAt: scheduledReport.lastSentAt,
      nextScheduledAt: scheduledReport.nextScheduledAt ?? undefined,
      executionCount: scheduledReport.executionCount,
      failureCount: scheduledReport.failureCount,
      lastError: scheduledReport.lastError ?? undefined,
      config: scheduledReport.config,
      createdBy: {
        id: scheduledReport.createdBy.id,
        email: scheduledReport.createdBy.email,
      },
      createdAt: scheduledReport.createdAt,
      updatedAt: scheduledReport.updatedAt,
    };
  }

  /**
   * Helpers para fechas
   */
  private getStartOfDay(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  }

  private getEndOfDay(): string {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.toISOString();
  }

  private getFileExtension(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.CSV:
        return 'csv';
      case ReportFormat.EXCEL:
        return 'xlsx';
      case ReportFormat.PDF:
        return 'pdf';
      default:
        return 'txt';
    }
  }
}
