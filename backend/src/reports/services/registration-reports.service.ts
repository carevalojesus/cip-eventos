import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Registration,
  RegistrationStatus,
  RegistrationOrigin,
} from '../../registrations/entities/registration.entity';
import { Payment, PaymentStatus } from '../../payments/entities/payment.entity';
import {
  SessionAttendance,
  AttendanceStatus,
} from '../../evaluations/entities/session-attendance.entity';
import {
  RegistrationReportData,
  RegistrationDetailData,
  RegistrationReportFilterDto,
} from '../dto/registration-report.dto';
import { Certificate } from '../../certificates/entities/certificate.entity';

@Injectable()
export class RegistrationReportsService {
  private readonly logger = new Logger(RegistrationReportsService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepo: Repository<SessionAttendance>,
    @InjectRepository(Certificate)
    private readonly certificateRepo: Repository<Certificate>,
  ) {}

  /**
   * Reporte general de inscripciones por evento
   */
  async getRegistrationsByEvent(
    eventId: string,
    filters?: RegistrationReportFilterDto,
  ): Promise<RegistrationReportData> {
    this.logger.log(`Generating registrations report for event ${eventId}`);

    const queryBuilder = this.registrationRepo
      .createQueryBuilder('reg')
      .leftJoinAndSelect('reg.eventTicket', 'ticket')
      .leftJoinAndSelect('reg.payment', 'payment')
      .where('reg.eventId = :eventId', { eventId });

    // Aplicar filtros
    if (filters?.status) {
      queryBuilder.andWhere('reg.status = :status', { status: filters.status });
    }
    if (filters?.origin) {
      queryBuilder.andWhere('reg.origin = :origin', { origin: filters.origin });
    }
    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('reg.registeredAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(filters.dateFrom),
        dateTo: new Date(filters.dateTo),
      });
    }

    const registrations = await queryBuilder.getMany();
    const totalRegistrations = registrations.length;

    // Por estado
    const byStatus = this.groupByStatus(registrations);

    // Por tipo de entrada
    const byTicketType = this.groupByTicketType(registrations);

    // Por origen
    const byOrigin = this.groupByOrigin(registrations);

    // Timeline (agrupado por día)
    const timeline = this.generateTimeline(registrations);

    // Tasa de conversión
    const conversionRate = await this.calculateConversionRate(eventId);

    return {
      totalRegistrations,
      byStatus,
      byTicketType,
      byOrigin,
      timeline,
      conversionRate,
    };
  }

  /**
   * Listado detallado de inscripciones para exportar
   */
  async getRegistrationsDetail(
    eventId: string,
    filters?: RegistrationReportFilterDto,
  ): Promise<RegistrationDetailData[]> {
    const queryBuilder = this.registrationRepo
      .createQueryBuilder('reg')
      .leftJoinAndSelect('reg.attendee', 'attendee')
      .leftJoinAndSelect('reg.eventTicket', 'ticket')
      .leftJoinAndSelect('reg.payment', 'payment')
      .where('reg.eventId = :eventId', { eventId });

    if (filters?.status) {
      queryBuilder.andWhere('reg.status = :status', { status: filters.status });
    }
    if (filters?.origin) {
      queryBuilder.andWhere('reg.origin = :origin', { origin: filters.origin });
    }

    const registrations = await queryBuilder.getMany();

    return registrations.map((reg) => ({
      id: reg.id,
      ticketCode: reg.ticketCode,
      attendeeName: `${reg.attendee.firstName || ''} ${reg.attendee.lastName || ''}`.trim(),
      attendeeEmail: reg.attendee.email,
      attendeeDocument: reg.attendee.documentNumber || '',
      ticketType: reg.eventTicket?.name || 'N/A',
      status: reg.status,
      origin: reg.origin,
      finalPrice: Number(reg.finalPrice),
      discountAmount: Number(reg.discountAmount),
      originalPrice: Number(reg.originalPrice || 0),
      attended: reg.attended,
      attendedAt: reg.attendedAt,
      registeredAt: reg.registeredAt,
      paymentStatus: reg.payment?.status,
      paymentProvider: reg.payment?.provider,
    }));
  }

  /**
   * Reporte de inscripciones por tipo de entrada
   */
  async getRegistrationsByTicketType(eventId: string) {
    const registrations = await this.registrationRepo.find({
      where: { event: { id: eventId } },
      relations: ['eventTicket'],
    });

    return this.groupByTicketType(registrations);
  }

  /**
   * Reporte de asistencia por sesión
   */
  async getAttendanceBySession(eventId: string) {
    const attendances = await this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.session', 'session')
      .leftJoinAndSelect('att.attendee', 'attendee')
      .leftJoinAndSelect('session.event', 'event')
      .where('event.id = :eventId', { eventId })
      .getMany();

    // Agrupar por sesión
    const sessionMap = new Map();

    for (const att of attendances) {
      const sessionId = att.session.id;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          sessionId: sessionId,
          sessionName: att.session.title,
          sessionDate: att.session.startAt,
          totalRegistered: 0,
          present: 0,
          absent: 0,
          partial: 0,
          late: 0,
          excused: 0,
          inPerson: 0,
          virtual: 0,
        });
      }

      const stats = sessionMap.get(sessionId);
      stats.totalRegistered++;

      switch (att.status) {
        case AttendanceStatus.PRESENT:
          stats.present++;
          break;
        case AttendanceStatus.ABSENT:
          stats.absent++;
          break;
        case AttendanceStatus.PARTIAL:
          stats.partial++;
          break;
        case AttendanceStatus.LATE:
          stats.late++;
          break;
        case AttendanceStatus.EXCUSED:
          stats.excused++;
          break;
      }

      if (att.modality === 'IN_PERSON') stats.inPerson++;
      if (att.modality === 'VIRTUAL') stats.virtual++;
    }

    return Array.from(sessionMap.values()).map((s) => ({
      ...s,
      attendanceRate: s.totalRegistered > 0
        ? (s.present / s.totalRegistered) * 100
        : 0,
    }));
  }

  /**
   * Certificados emitidos vs descargados
   */
  async getCertificateStats(eventId: string) {
    const certificates = await this.certificateRepo
      .createQueryBuilder('cert')
      .leftJoinAndSelect('cert.registration', 'reg')
      .where('cert.eventId = :eventId', { eventId })
      .getMany();

    const totalIssued = certificates.length;
    const totalDownloaded = certificates.filter((c) => c.pdfUrl).length;

    return {
      totalIssued,
      totalDownloaded,
      downloadRate: totalIssued > 0 ? (totalDownloaded / totalIssued) * 100 : 0,
      byType: this.groupCertificatesByType(certificates),
    };
  }

  // ===== HELPERS =====

  private groupByStatus(registrations: Registration[]) {
    const total = registrations.length;
    const statusGroups = registrations.reduce(
      (acc, reg) => {
        acc[reg.status] = (acc[reg.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusGroups).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  private groupByTicketType(registrations: Registration[]) {
    const ticketGroups = registrations.reduce(
      (acc, reg) => {
        const ticketName = reg.eventTicket?.name || 'Sin ticket';
        if (!acc[ticketName]) {
          acc[ticketName] = { count: 0, revenue: 0 };
        }
        acc[ticketName].count++;
        acc[ticketName].revenue += Number(reg.finalPrice);
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    const total = registrations.length;

    return Object.entries(ticketGroups).map(([ticketName, data]) => ({
      ticketName,
      count: data.count,
      revenue: data.revenue,
      percentage: total > 0 ? (data.count / total) * 100 : 0,
    }));
  }

  private groupByOrigin(registrations: Registration[]) {
    const total = registrations.length;
    const originGroups = registrations.reduce(
      (acc, reg) => {
        acc[reg.origin] = (acc[reg.origin] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(originGroups).map(([origin, count]) => ({
      origin,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  private generateTimeline(registrations: Registration[]) {
    const dateGroups = registrations.reduce(
      (acc, reg) => {
        const date = reg.registeredAt.toISOString().slice(0, 10);
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const sorted = Object.entries(dateGroups).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    let cumulative = 0;
    return sorted.map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulative };
    });
  }

  private async calculateConversionRate(eventId: string) {
    const totalRegistrations = await this.registrationRepo.count({
      where: { event: { id: eventId } },
    });

    const paidRegistrations = await this.paymentRepo.count({
      where: {
        registration: { event: { id: eventId } },
        status: PaymentStatus.COMPLETED,
      },
    });

    return {
      registrations: totalRegistrations,
      payments: paidRegistrations,
      conversionToPayment:
        totalRegistrations > 0
          ? (paidRegistrations / totalRegistrations) * 100
          : 0,
    };
  }

  private groupCertificatesByType(certificates: Certificate[]) {
    const typeGroups = certificates.reduce(
      (acc, cert) => {
        acc[cert.type] = (acc[cert.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(typeGroups).map(([type, count]) => ({
      type,
      count,
    }));
  }
}
