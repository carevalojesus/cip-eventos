import { Injectable, Logger } from '@nestjs/common';
import { RegistrationReportsService } from './services/registration-reports.service';
import { FinancialReportsService } from './services/financial-reports.service';
import { AcademicReportsService } from './services/academic-reports.service';
import { ExportService } from './services/export.service';
import { ColumnConfig } from './interfaces/export.interface';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly registrationReports: RegistrationReportsService,
    private readonly financialReports: FinancialReportsService,
    private readonly academicReports: AcademicReportsService,
    private readonly exportService: ExportService,
    private readonly i18n: I18nService,
  ) {}

  // ===== REGISTRATION REPORTS =====

  async getRegistrationsReport(eventId: string, filters?: any) {
    return this.registrationReports.getRegistrationsByEvent(eventId, filters);
  }

  async exportRegistrations(
    eventId: string,
    format: 'csv' | 'xlsx',
    lang: string = 'es',
  ) {
    const data = await this.registrationReports.getRegistrationsDetail(eventId);
    const columns = this.getRegistrationColumns(lang);

    if (format === 'csv') {
      return this.exportService.toCsv(data, columns);
    } else {
      return this.exportService.toExcel([
        { name: 'Inscripciones', data, columns },
      ]);
    }
  }

  async getAttendanceBySession(eventId: string) {
    return this.registrationReports.getAttendanceBySession(eventId);
  }

  async exportAttendanceBySession(
    eventId: string,
    format: 'csv' | 'xlsx',
    lang: string = 'es',
  ) {
    const data = await this.registrationReports.getAttendanceBySession(eventId);
    const columns = this.getSessionAttendanceColumns(lang);

    if (format === 'csv') {
      return this.exportService.toCsv(data, columns);
    } else {
      return this.exportService.toExcel([
        { name: 'Asistencia por Sesión', data, columns },
      ]);
    }
  }

  async getCertificateStats(eventId: string) {
    return this.registrationReports.getCertificateStats(eventId);
  }

  // ===== FINANCIAL REPORTS =====

  async getRevenueReport(eventId: string, filters?: any) {
    return this.financialReports.getRevenueReport(eventId, filters);
  }

  async exportRevenue(
    eventId: string,
    format: 'csv' | 'xlsx',
    lang: string = 'es',
  ) {
    const report = await this.financialReports.getRevenueReport(eventId);
    const columns = this.getRevenueColumns(lang);

    // Preparar datos para exportar
    const data = report.byTicketType.map((item) => ({
      ticketType: item.name,
      quantity: item.quantity,
      revenue: item.revenue,
      percentage: item.percentage,
    }));

    if (format === 'csv') {
      return this.exportService.toCsv(data, columns);
    } else {
      return this.exportService.toExcel([
        { name: 'Recaudación', data, columns },
      ]);
    }
  }

  async getPaymentsByMethod(eventId: string, filters?: any) {
    return this.financialReports.getPaymentsByMethod(eventId, filters);
  }

  async exportPaymentsByMethod(
    eventId: string,
    format: 'csv' | 'xlsx',
    lang: string = 'es',
  ) {
    const data = await this.financialReports.getPaymentsByMethod(eventId);
    const columns = this.getPaymentMethodColumns(lang);

    if (format === 'csv') {
      return this.exportService.toCsv(data, columns);
    } else {
      return this.exportService.toExcel([
        { name: 'Pagos por Método', data, columns },
      ]);
    }
  }

  async getFiscalDocumentsReport(eventId: string, filters?: any) {
    return this.financialReports.getFiscalDocumentsReport(eventId, filters);
  }

  async getRefundsReport(eventId: string, filters?: any) {
    return this.financialReports.getRefundsReport(eventId, filters);
  }

  async exportRefunds(
    eventId: string,
    format: 'csv' | 'xlsx',
    lang: string = 'es',
  ) {
    const report = await this.financialReports.getRefundsReport(eventId);
    const columns = this.getRefundsColumns(lang);

    // Flatten data for export
    const data = report.byStatus.map((item) => ({
      status: item.status,
      count: item.count,
      amount: item.amount,
    }));

    if (format === 'csv') {
      return this.exportService.toCsv(data, columns);
    } else {
      return this.exportService.toExcel([
        { name: 'Reembolsos', data, columns },
      ]);
    }
  }

  // ===== ACADEMIC REPORTS =====

  async getApprovalStatus(blockId: string, filters?: any) {
    return this.academicReports.getApprovalStatus(blockId, filters);
  }

  async exportApprovalStatus(
    blockId: string,
    format: 'csv' | 'xlsx',
    lang: string = 'es',
  ) {
    const data = await this.academicReports.getApprovalStatus(blockId);
    const columns = this.getApprovalStatusColumns(lang);

    if (format === 'csv') {
      return this.exportService.toCsv(data, columns);
    } else {
      return this.exportService.toExcel([
        { name: 'Estado de Aprobación', data, columns },
      ]);
    }
  }

  async getGradeDistribution(blockId: string, filters?: any) {
    return this.academicReports.getGradeDistribution(blockId, filters);
  }

  async getDetailedAttendance(blockId: string, filters?: any) {
    return this.academicReports.getDetailedAttendance(blockId, filters);
  }

  async exportDetailedAttendance(
    blockId: string,
    format: 'csv' | 'xlsx',
    lang: string = 'es',
  ) {
    const data = await this.academicReports.getDetailedAttendance(blockId);
    const columns = this.getDetailedAttendanceColumns(lang);

    if (format === 'csv') {
      return this.exportService.toCsv(data, columns);
    } else {
      return this.exportService.toExcel([
        { name: 'Asistencia Detallada', data, columns },
      ]);
    }
  }

  // ===== FULL EVENT REPORT =====

  async exportFullEventReport(eventId: string, lang: string = 'es') {
    this.logger.log(`Generating full event report for ${eventId}`);

    // Obtener todos los datos
    const registrationsData =
      await this.registrationReports.getRegistrationsDetail(eventId);
    const revenueReport = await this.financialReports.getRevenueReport(eventId);
    const paymentsData = await this.financialReports.getPaymentsByMethod(eventId);
    const attendanceData =
      await this.registrationReports.getAttendanceBySession(eventId);

    // Crear múltiples hojas
    const sheets = [
      {
        name: 'Inscripciones',
        data: registrationsData,
        columns: this.getRegistrationColumns(lang),
      },
      {
        name: 'Recaudación por Ticket',
        data: revenueReport.byTicketType,
        columns: this.getRevenueColumns(lang),
      },
      {
        name: 'Métodos de Pago',
        data: paymentsData,
        columns: this.getPaymentMethodColumns(lang),
      },
      {
        name: 'Asistencia por Sesión',
        data: attendanceData,
        columns: this.getSessionAttendanceColumns(lang),
      },
    ];

    return this.exportService.toExcel(sheets);
  }

  // ===== COLUMN DEFINITIONS =====

  private getRegistrationColumns(lang: string): ColumnConfig[] {
    return [
      { key: 'ticketCode', header: 'Código de Ticket', width: 20 },
      { key: 'attendeeName', header: 'Nombre', width: 30 },
      { key: 'attendeeEmail', header: 'Email', width: 30 },
      { key: 'attendeeDocument', header: 'Documento', width: 15 },
      { key: 'ticketType', header: 'Tipo de Entrada', width: 20 },
      { key: 'status', header: 'Estado', width: 15 },
      { key: 'origin', header: 'Origen', width: 15 },
      { key: 'finalPrice', header: 'Precio Final', width: 15, format: 'currency' },
      { key: 'discountAmount', header: 'Descuento', width: 15, format: 'currency' },
      { key: 'attended', header: 'Asistió', width: 10 },
      { key: 'registeredAt', header: 'Fecha de Registro', width: 20, format: 'datetime' },
      { key: 'paymentStatus', header: 'Estado de Pago', width: 15 },
      { key: 'paymentProvider', header: 'Método de Pago', width: 15 },
    ];
  }

  private getRevenueColumns(lang: string): ColumnConfig[] {
    return [
      { key: 'name', header: 'Tipo de Ticket', width: 30 },
      { key: 'quantity', header: 'Cantidad', width: 15, format: 'number' },
      { key: 'revenue', header: 'Recaudación', width: 15, format: 'currency' },
      { key: 'percentage', header: 'Porcentaje', width: 15, format: 'percentage' },
    ];
  }

  private getPaymentMethodColumns(lang: string): ColumnConfig[] {
    return [
      { key: 'provider', header: 'Método de Pago', width: 20 },
      { key: 'count', header: 'Cantidad', width: 15, format: 'number' },
      { key: 'amount', header: 'Monto Total', width: 15, format: 'currency' },
      { key: 'percentage', header: 'Porcentaje', width: 15, format: 'percentage' },
      { key: 'avgAmount', header: 'Monto Promedio', width: 15, format: 'currency' },
    ];
  }

  private getSessionAttendanceColumns(lang: string): ColumnConfig[] {
    return [
      { key: 'sessionName', header: 'Sesión', width: 30 },
      { key: 'sessionDate', header: 'Fecha', width: 20, format: 'datetime' },
      { key: 'totalRegistered', header: 'Total Inscritos', width: 15, format: 'number' },
      { key: 'present', header: 'Presentes', width: 15, format: 'number' },
      { key: 'absent', header: 'Ausentes', width: 15, format: 'number' },
      { key: 'partial', header: 'Parciales', width: 15, format: 'number' },
      { key: 'late', header: 'Tardanzas', width: 15, format: 'number' },
      { key: 'inPerson', header: 'Presencial', width: 15, format: 'number' },
      { key: 'virtual', header: 'Virtual', width: 15, format: 'number' },
      { key: 'attendanceRate', header: 'Tasa de Asistencia', width: 15, format: 'percentage' },
    ];
  }

  private getRefundsColumns(lang: string): ColumnConfig[] {
    return [
      { key: 'status', header: 'Estado', width: 20 },
      { key: 'count', header: 'Cantidad', width: 15, format: 'number' },
      { key: 'amount', header: 'Monto', width: 15, format: 'currency' },
    ];
  }

  private getApprovalStatusColumns(lang: string): ColumnConfig[] {
    return [
      { key: 'attendeeName', header: 'Nombre', width: 30 },
      { key: 'attendeeEmail', header: 'Email', width: 30 },
      { key: 'attendeeDocument', header: 'Documento', width: 15 },
      { key: 'finalGrade', header: 'Nota Final', width: 15, format: 'number' },
      { key: 'attendancePercentage', header: 'Asistencia %', width: 15, format: 'percentage' },
      { key: 'meetsAttendanceRequirement', header: 'Cumple Asistencia', width: 15 },
      { key: 'passed', header: 'Aprobado', width: 15 },
      { key: 'status', header: 'Estado', width: 15 },
      { key: 'certificateIssued', header: 'Certificado Emitido', width: 15 },
      { key: 'enrolledAt', header: 'Fecha de Inscripción', width: 20, format: 'datetime' },
    ];
  }

  private getDetailedAttendanceColumns(lang: string): ColumnConfig[] {
    return [
      { key: 'attendeeName', header: 'Nombre', width: 30 },
      { key: 'attendeeEmail', header: 'Email', width: 30 },
      { key: 'sessionName', header: 'Sesión', width: 30 },
      { key: 'sessionDate', header: 'Fecha de Sesión', width: 20, format: 'datetime' },
      { key: 'status', header: 'Estado', width: 15 },
      { key: 'modality', header: 'Modalidad', width: 15 },
      { key: 'checkInAt', header: 'Hora Entrada', width: 20, format: 'datetime' },
      { key: 'checkOutAt', header: 'Hora Salida', width: 20, format: 'datetime' },
      { key: 'minutesAttended', header: 'Minutos Asistidos', width: 15, format: 'number' },
      { key: 'attendancePercentage', header: 'Porcentaje', width: 15, format: 'percentage' },
    ];
  }
}
