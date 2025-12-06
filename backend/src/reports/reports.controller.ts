import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ScheduledReportsService } from './services/scheduled-reports.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ReportFilterDto,
  ExportFormat,
} from './dto/report-filter.dto';
import {
  RegistrationReportFilterDto,
} from './dto/registration-report.dto';
import {
  FinancialReportFilterDto,
} from './dto/financial-report.dto';
import {
  AcademicReportFilterDto,
} from './dto/academic-report.dto';
import { CreateScheduledReportDto } from './dto/create-scheduled-report.dto';
import { UpdateScheduledReportDto } from './dto/update-scheduled-report.dto';
import { I18nContext } from 'nestjs-i18n';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly scheduledReportsService: ScheduledReportsService,
  ) {}

  // ===== INSCRIPCIONES =====

  @Get('events/:eventId/registrations')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get registrations report for event' })
  async getRegistrationsReport(
    @Param('eventId') eventId: string,
    @Query() filters: RegistrationReportFilterDto,
  ) {
    this.logger.log(`Getting registrations report for event ${eventId}`);
    return this.reportsService.getRegistrationsReport(eventId, filters);
  }

  @Get('events/:eventId/registrations/export')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export registrations to CSV or Excel' })
  async exportRegistrations(
    @Param('eventId') eventId: string,
    @Query('format') format: ExportFormat = ExportFormat.XLSX,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Exporting registrations for event ${eventId} in format ${format}`,
    );

    const lang = I18nContext.current()?.lang || 'es';
    const exportFormat = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const buffer = await this.reportsService.exportRegistrations(
      eventId,
      exportFormat,
      lang,
    );

    const filename = `inscripciones_${eventId}_${new Date().toISOString().slice(0, 10)}.${format}`;

    res.set({
      'Content-Type':
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('events/:eventId/attendance-by-session')
  @Roles('ORG_ADMIN', 'ORG_STAFF_ACADEMICO', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get attendance report by session' })
  async getAttendanceBySession(@Param('eventId') eventId: string) {
    return this.reportsService.getAttendanceBySession(eventId);
  }

  @Get('events/:eventId/attendance-by-session/export')
  @Roles('ORG_ADMIN', 'ORG_STAFF_ACADEMICO', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export attendance by session' })
  async exportAttendanceBySession(
    @Param('eventId') eventId: string,
    @Query('format') format: ExportFormat = ExportFormat.XLSX,
    @Res() res: Response,
  ) {
    const lang = I18nContext.current()?.lang || 'es';
    const exportFormat = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const buffer = await this.reportsService.exportAttendanceBySession(
      eventId,
      exportFormat,
      lang,
    );

    const filename = `asistencia_sesiones_${eventId}_${new Date().toISOString().slice(0, 10)}.${format}`;

    res.set({
      'Content-Type':
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('events/:eventId/certificates')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get certificate statistics' })
  async getCertificateStats(@Param('eventId') eventId: string) {
    return this.reportsService.getCertificateStats(eventId);
  }

  // ===== FINANCIEROS =====

  @Get('events/:eventId/revenue')
  @Roles('ORG_FINANZAS', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenueReport(
    @Param('eventId') eventId: string,
    @Query() filters: FinancialReportFilterDto,
  ) {
    this.logger.log(`Getting revenue report for event ${eventId}`);
    return this.reportsService.getRevenueReport(eventId, filters);
  }

  @Get('events/:eventId/revenue/export')
  @Roles('ORG_FINANZAS', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export revenue report' })
  async exportRevenue(
    @Param('eventId') eventId: string,
    @Query('format') format: ExportFormat = ExportFormat.XLSX,
    @Res() res: Response,
  ) {
    const lang = I18nContext.current()?.lang || 'es';
    const exportFormat = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const buffer = await this.reportsService.exportRevenue(eventId, exportFormat, lang);

    const filename = `recaudacion_${eventId}_${new Date().toISOString().slice(0, 10)}.${format}`;

    res.set({
      'Content-Type':
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('events/:eventId/payments')
  @Roles('ORG_FINANZAS', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get payments by method report' })
  async getPaymentsReport(
    @Param('eventId') eventId: string,
    @Query() filters: FinancialReportFilterDto,
  ) {
    return this.reportsService.getPaymentsByMethod(eventId, filters);
  }

  @Get('events/:eventId/payments/export')
  @Roles('ORG_FINANZAS', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export payments by method' })
  async exportPaymentsByMethod(
    @Param('eventId') eventId: string,
    @Query('format') format: ExportFormat = ExportFormat.XLSX,
    @Res() res: Response,
  ) {
    const lang = I18nContext.current()?.lang || 'es';
    const exportFormat = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const buffer = await this.reportsService.exportPaymentsByMethod(
      eventId,
      exportFormat,
      lang,
    );

    const filename = `metodos_pago_${eventId}_${new Date().toISOString().slice(0, 10)}.${format}`;

    res.set({
      'Content-Type':
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('events/:eventId/fiscal-documents')
  @Roles('ORG_FINANZAS', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get fiscal documents report' })
  async getFiscalDocumentsReport(
    @Param('eventId') eventId: string,
    @Query() filters: FinancialReportFilterDto,
  ) {
    return this.reportsService.getFiscalDocumentsReport(eventId, filters);
  }

  @Get('events/:eventId/refunds')
  @Roles('ORG_FINANZAS', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get refunds report' })
  async getRefundsReport(
    @Param('eventId') eventId: string,
    @Query() filters: FinancialReportFilterDto,
  ) {
    return this.reportsService.getRefundsReport(eventId, filters);
  }

  @Get('events/:eventId/refunds/export')
  @Roles('ORG_FINANZAS', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export refunds report' })
  async exportRefunds(
    @Param('eventId') eventId: string,
    @Query('format') format: ExportFormat = ExportFormat.XLSX,
    @Res() res: Response,
  ) {
    const lang = I18nContext.current()?.lang || 'es';
    const exportFormat = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const buffer = await this.reportsService.exportRefunds(eventId, exportFormat, lang);

    const filename = `reembolsos_${eventId}_${new Date().toISOString().slice(0, 10)}.${format}`;

    res.set({
      'Content-Type':
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  // ===== ACADÉMICOS =====

  @Get('blocks/:blockId/approval-status')
  @Roles('ORG_STAFF_ACADEMICO', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get approval status report for block' })
  async getApprovalStatus(
    @Param('blockId') blockId: string,
    @Query() filters: AcademicReportFilterDto,
  ) {
    this.logger.log(`Getting approval status for block ${blockId}`);
    return this.reportsService.getApprovalStatus(blockId, filters);
  }

  @Get('blocks/:blockId/approval-status/export')
  @Roles('ORG_STAFF_ACADEMICO', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export approval status' })
  async exportApprovalStatus(
    @Param('blockId') blockId: string,
    @Query('format') format: ExportFormat = ExportFormat.XLSX,
    @Res() res: Response,
  ) {
    const lang = I18nContext.current()?.lang || 'es';
    const exportFormat = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const buffer = await this.reportsService.exportApprovalStatus(
      blockId,
      exportFormat,
      lang,
    );

    const filename = `aptos_certificado_${blockId}_${new Date().toISOString().slice(0, 10)}.${format}`;

    res.set({
      'Content-Type':
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('blocks/:blockId/grades')
  @Roles('ORG_STAFF_ACADEMICO', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get grade distribution' })
  async getGradeDistribution(
    @Param('blockId') blockId: string,
    @Query() filters: AcademicReportFilterDto,
  ) {
    return this.reportsService.getGradeDistribution(blockId, filters);
  }

  @Get('blocks/:blockId/attendance')
  @Roles('ORG_STAFF_ACADEMICO', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get detailed attendance report' })
  async getDetailedAttendance(
    @Param('blockId') blockId: string,
    @Query() filters: AcademicReportFilterDto,
  ) {
    return this.reportsService.getDetailedAttendance(blockId, filters);
  }

  @Get('blocks/:blockId/attendance/export')
  @Roles('ORG_STAFF_ACADEMICO', 'ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export detailed attendance' })
  async exportDetailedAttendance(
    @Param('blockId') blockId: string,
    @Query('format') format: ExportFormat = ExportFormat.XLSX,
    @Res() res: Response,
  ) {
    const lang = I18nContext.current()?.lang || 'es';
    const exportFormat = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const buffer = await this.reportsService.exportDetailedAttendance(
      blockId,
      exportFormat,
      lang,
    );

    const filename = `asistencia_detallada_${blockId}_${new Date().toISOString().slice(0, 10)}.${format}`;

    res.set({
      'Content-Type':
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  // ===== EXPORTACIÓN COMPLETA =====

  @Get('events/:eventId/full-report/export')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export complete event report with all data' })
  async exportFullEventReport(
    @Param('eventId') eventId: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Exporting full report for event ${eventId}`);

    const lang = I18nContext.current()?.lang || 'es';
    const buffer = await this.reportsService.exportFullEventReport(eventId, lang);

    const filename = `reporte_completo_${eventId}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  // ===== REPORTES PROGRAMADOS =====

  @Post('scheduled')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a scheduled report' })
  async createScheduledReport(
    @Body() dto: CreateScheduledReportDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Creating scheduled report: ${dto.name}`);
    return this.scheduledReportsService.createScheduledReport(dto, user.id);
  }

  @Get('scheduled')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all scheduled reports' })
  async getScheduledReports(@Query('eventId') eventId?: string) {
    this.logger.log(`Getting scheduled reports${eventId ? ` for event ${eventId}` : ''}`);
    return this.scheduledReportsService.getScheduledReports(eventId);
  }

  @Get('scheduled/:id')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a scheduled report by ID' })
  async getScheduledReport(@Param('id') id: string) {
    this.logger.log(`Getting scheduled report ${id}`);
    return this.scheduledReportsService.getScheduledReport(id);
  }

  @Put('scheduled/:id')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a scheduled report' })
  async updateScheduledReport(
    @Param('id') id: string,
    @Body() dto: UpdateScheduledReportDto,
  ) {
    this.logger.log(`Updating scheduled report ${id}`);
    return this.scheduledReportsService.updateScheduledReport(id, dto);
  }

  @Delete('scheduled/:id')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a scheduled report' })
  async deleteScheduledReport(@Param('id') id: string) {
    this.logger.log(`Deleting scheduled report ${id}`);
    await this.scheduledReportsService.deleteScheduledReport(id);
    return { message: 'Scheduled report deleted successfully' };
  }

  @Post('scheduled/:id/send-now')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Execute a scheduled report immediately' })
  async executeScheduledReport(@Param('id') id: string) {
    this.logger.log(`Manually executing scheduled report ${id}`);
    await this.scheduledReportsService.executeReport(id);
    return { message: 'Report executed and sent successfully' };
  }
}
