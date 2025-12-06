import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';

import {
  SessionAttendance,
  AttendanceStatus,
  AttendanceModality,
} from '../entities/session-attendance.entity';
import { BlockEnrollment, BlockEnrollmentStatus } from '../entities/block-enrollment.entity';
import { EvaluableBlock } from '../entities/evaluable-block.entity';
import {
  RecordAttendanceDto,
  BatchRecordAttendanceDto,
  CheckInDto,
} from '../dto/record-attendance.dto';

import { EventSession } from '../../events/entities/event-session.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { Registration } from '../../registrations/entities/registration.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepo: Repository<SessionAttendance>,
    @InjectRepository(BlockEnrollment)
    private readonly enrollmentRepo: Repository<BlockEnrollment>,
    @InjectRepository(EvaluableBlock)
    private readonly blockRepo: Repository<EvaluableBlock>,
    @InjectRepository(EventSession)
    private readonly sessionRepo: Repository<EventSession>,
    @InjectRepository(Attendee)
    private readonly attendeeRepo: Repository<Attendee>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  // ========== REGISTRO DE ASISTENCIA ==========

  async recordAttendance(dto: RecordAttendanceDto): Promise<SessionAttendance> {
    return this.dataSource.transaction(async (manager) => {
      const attendanceRepo = manager.getRepository(SessionAttendance);
      const enrollmentRepo = manager.getRepository(BlockEnrollment);
      const sessionRepo = manager.getRepository(EventSession);

      // Validar sesión
      const session = await sessionRepo.findOne({
        where: { id: dto.sessionId },
        relations: ['event'],
      });

      if (!session) {
        throw new NotFoundException(
          this.i18n.t('evaluations.session_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Buscar inscripción del participante en algún bloque que contenga esta sesión
      const enrollment = await enrollmentRepo
        .createQueryBuilder('enrollment')
        .innerJoin('enrollment.block', 'block')
        .innerJoin('block.sessions', 'session')
        .innerJoin('enrollment.attendee', 'attendee')
        .where('session.id = :sessionId', { sessionId: dto.sessionId })
        .andWhere('attendee.id = :attendeeId', { attendeeId: dto.attendeeId })
        .andWhere('enrollment.status IN (:...statuses)', {
          statuses: [
            BlockEnrollmentStatus.ENROLLED,
            BlockEnrollmentStatus.IN_PROGRESS,
          ],
        })
        .getOne();

      if (!enrollment) {
        throw new BadRequestException(
          this.i18n.t('evaluations.not_enrolled_in_session', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Buscar o crear registro de asistencia
      let attendance = await attendanceRepo.findOne({
        where: {
          session: { id: dto.sessionId },
          enrollment: { id: enrollment.id },
        },
      });

      if (attendance) {
        // Actualizar existente
        attendance.status = dto.status;
        attendance.modality = dto.modality || attendance.modality;
        if (dto.checkInAt) attendance.checkInAt = new Date(dto.checkInAt);
        if (dto.checkOutAt) attendance.checkOutAt = new Date(dto.checkOutAt);
        attendance.excuseReason = dto.excuseReason ?? null;
        attendance.excuseDocumentUrl = dto.excuseDocumentUrl ?? null;
      } else {
        // Crear nuevo
        attendance = attendanceRepo.create({
          session,
          enrollment,
          status: dto.status,
          modality: dto.modality || AttendanceModality.IN_PERSON,
          checkInAt: dto.checkInAt ? new Date(dto.checkInAt) : undefined,
          checkOutAt: dto.checkOutAt ? new Date(dto.checkOutAt) : undefined,
          excuseReason: dto.excuseReason ?? null,
          excuseDocumentUrl: dto.excuseDocumentUrl ?? null,
        });
      }

      // Calcular minutos de asistencia si hay check-in y check-out
      if (attendance.checkInAt && attendance.checkOutAt) {
        attendance.minutesAttended = Math.floor(
          (attendance.checkOutAt.getTime() - attendance.checkInAt.getTime()) /
            60000,
        );
      }

      const saved = await attendanceRepo.save(attendance);

      // Actualizar porcentaje de asistencia del enrollment
      await this.recalculateAttendancePercentage(enrollment.id, manager);

      this.logger.log(
        `Asistencia registrada: Sesión ${session.title} - ${dto.status}`,
      );

      return saved;
    });
  }

  async batchRecordAttendance(
    dto: BatchRecordAttendanceDto,
  ): Promise<SessionAttendance[]> {
    const results: SessionAttendance[] = [];

    for (const entry of dto.attendances) {
      const attendance = await this.recordAttendance({
        sessionId: dto.sessionId,
        attendeeId: entry.attendeeId,
        status: entry.status,
        modality: entry.modality,
      });
      results.push(attendance);
    }

    return results;
  }

  // ========== CHECK-IN CON CÓDIGO QR ==========

  async checkIn(dto: CheckInDto): Promise<SessionAttendance> {
    return this.dataSource.transaction(async (manager) => {
      const attendanceRepo = manager.getRepository(SessionAttendance);
      const enrollmentRepo = manager.getRepository(BlockEnrollment);
      const sessionRepo = manager.getRepository(EventSession);
      const registrationRepo = manager.getRepository(Registration);

      // Validar sesión
      const session = await sessionRepo.findOne({
        where: { id: dto.sessionId },
        relations: ['event'],
      });

      if (!session) {
        throw new NotFoundException(
          this.i18n.t('evaluations.session_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Buscar registration por ticketCode
      const registration = await registrationRepo.findOne({
        where: { ticketCode: dto.ticketCode },
        relations: ['attendee'],
      });

      if (!registration) {
        throw new NotFoundException(
          this.i18n.t('evaluations.ticket_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      const attendee = registration.attendee;

      // Buscar inscripción
      const enrollment = await enrollmentRepo
        .createQueryBuilder('enrollment')
        .innerJoin('enrollment.block', 'block')
        .innerJoin('block.sessions', 'blockSession')
        .where('blockSession.id = :sessionId', { sessionId: dto.sessionId })
        .andWhere('enrollment.attendee.id = :attendeeId', {
          attendeeId: attendee.id,
        })
        .andWhere('enrollment.status IN (:...statuses)', {
          statuses: [
            BlockEnrollmentStatus.ENROLLED,
            BlockEnrollmentStatus.IN_PROGRESS,
          ],
        })
        .getOne();

      if (!enrollment) {
        throw new BadRequestException(
          this.i18n.t('evaluations.not_enrolled_in_session', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Verificar si ya tiene check-in
      let attendance = await attendanceRepo.findOne({
        where: {
          session: { id: dto.sessionId },
          enrollment: { id: enrollment.id },
        },
      });

      const now = new Date();

      if (attendance) {
        if (attendance.checkInAt) {
          throw new BadRequestException(
            this.i18n.t('evaluations.already_checked_in', {
              lang: I18nContext.current()?.lang,
            }),
          );
        }
        attendance.checkInAt = now;
        attendance.status = AttendanceStatus.PRESENT;
        attendance.modality = dto.modality || AttendanceModality.IN_PERSON;
      } else {
        attendance = attendanceRepo.create({
          session,
          enrollment,
          status: AttendanceStatus.PRESENT,
          modality: dto.modality || AttendanceModality.IN_PERSON,
          checkInAt: now,
        });
      }

      const saved = await attendanceRepo.save(attendance);

      this.logger.log(
        `Check-in: ${attendee.firstName} ${attendee.lastName} - ${session.title}`,
      );

      return saved;
    });
  }

  async checkOut(sessionId: string, ticketCode: string): Promise<SessionAttendance> {
    return this.dataSource.transaction(async (manager) => {
      const attendanceRepo = manager.getRepository(SessionAttendance);
      const enrollmentRepo = manager.getRepository(BlockEnrollment);
      const registrationRepo = manager.getRepository(Registration);

      // Buscar registration
      const registration = await registrationRepo.findOne({
        where: { ticketCode },
        relations: ['attendee'],
      });

      if (!registration) {
        throw new NotFoundException(
          this.i18n.t('evaluations.ticket_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      const attendee = registration.attendee;

      // Buscar inscripción
      const enrollment = await enrollmentRepo
        .createQueryBuilder('enrollment')
        .innerJoin('enrollment.block', 'block')
        .innerJoin('block.sessions', 'blockSession')
        .where('blockSession.id = :sessionId', { sessionId })
        .andWhere('enrollment.attendee.id = :attendeeId', {
          attendeeId: attendee.id,
        })
        .getOne();

      if (!enrollment) {
        throw new BadRequestException(
          this.i18n.t('evaluations.not_enrolled_in_session', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Buscar asistencia
      const attendance = await attendanceRepo.findOne({
        where: {
          session: { id: sessionId },
          enrollment: { id: enrollment.id },
        },
      });

      if (!attendance || !attendance.checkInAt) {
        throw new BadRequestException(
          this.i18n.t('evaluations.no_check_in', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      if (attendance.checkOutAt) {
        throw new BadRequestException(
          this.i18n.t('evaluations.already_checked_out', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      const now = new Date();
      attendance.checkOutAt = now;
      attendance.minutesAttended = Math.floor(
        (now.getTime() - attendance.checkInAt.getTime()) / 60000,
      );

      const saved = await attendanceRepo.save(attendance);

      // Actualizar porcentaje
      await this.recalculateAttendancePercentage(enrollment.id, manager);

      this.logger.log(
        `Check-out: ${attendee.firstName} ${attendee.lastName} - ${attendance.minutesAttended} min`,
      );

      return saved;
    });
  }

  // ========== RECÁLCULO DE PORCENTAJE ==========

  private async recalculateAttendancePercentage(
    enrollmentId: string,
    manager?: any,
  ): Promise<void> {
    const enrollmentRepo = manager
      ? manager.getRepository(BlockEnrollment)
      : this.enrollmentRepo;
    const attendanceRepo = manager
      ? manager.getRepository(SessionAttendance)
      : this.attendanceRepo;

    const enrollment = await enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['block', 'block.sessions'],
    });

    if (!enrollment) return;

    const totalSessions = enrollment.block.sessions.length;
    if (totalSessions === 0) {
      enrollment.attendancePercentage = 100;
      enrollment.sessionsAttended = 0;
      await enrollmentRepo.save(enrollment);
      return;
    }

    const attendances = await attendanceRepo.find({
      where: { enrollment: { id: enrollmentId } },
    });

    // Contar sesiones con asistencia válida
    const validAttendances = attendances.filter(
      (a: SessionAttendance) =>
        a.status === AttendanceStatus.PRESENT ||
        a.status === AttendanceStatus.LATE ||
        a.status === AttendanceStatus.EXCUSED,
    );

    // Asistencia parcial cuenta como 0.5
    const partialAttendances = attendances.filter(
      (a: SessionAttendance) => a.status === AttendanceStatus.PARTIAL,
    );

    const effectiveAttendances =
      validAttendances.length + partialAttendances.length * 0.5;

    enrollment.sessionsAttended = validAttendances.length;
    enrollment.attendancePercentage = Math.round(
      (effectiveAttendances / totalSessions) * 100,
    );

    await enrollmentRepo.save(enrollment);
  }

  // ========== CONEXIONES VIRTUALES ==========

  async recordVirtualConnection(
    sessionId: string,
    enrollmentId: string,
    connectionData: {
      platform?: string;
      joinedAt?: Date;
      leftAt?: Date;
      ipAddress?: string;
    },
  ): Promise<SessionAttendance> {
    let attendance = await this.attendanceRepo.findOne({
      where: {
        session: { id: sessionId },
        enrollment: { id: enrollmentId },
      },
    });

    if (!attendance) {
      const session = await this.sessionRepo.findOne({
        where: { id: sessionId },
      });
      const enrollment = await this.enrollmentRepo.findOne({
        where: { id: enrollmentId },
      });

      if (!session || !enrollment) {
        throw new NotFoundException(
          this.i18n.t('evaluations.session_or_enrollment_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      attendance = this.attendanceRepo.create({
        session,
        enrollment,
        status: AttendanceStatus.PRESENT,
        modality: AttendanceModality.VIRTUAL,
        virtualConnections: [],
      });
    }

    // Agregar conexión al array
    const connections = attendance.virtualConnections || [];
    connections.push({
      connectedAt: (connectionData.joinedAt || new Date()).toISOString(),
      disconnectedAt: connectionData.leftAt?.toISOString(),
      duration: 0,
      ip: connectionData.ipAddress,
    });
    attendance.virtualConnections = connections;

    // Calcular tiempo total de conexión
    let totalMinutes = 0;
    for (const conn of connections) {
      if (conn.connectedAt && conn.disconnectedAt) {
        totalMinutes += Math.floor(
          (new Date(conn.disconnectedAt).getTime() - new Date(conn.connectedAt).getTime()) /
            60000,
        );
      }
    }
    attendance.minutesAttended = totalMinutes;

    return this.attendanceRepo.save(attendance);
  }

  // ========== CONSULTAS ==========

  async getAttendanceBySession(sessionId: string): Promise<SessionAttendance[]> {
    return this.attendanceRepo.find({
      where: { session: { id: sessionId } },
      relations: ['enrollment', 'enrollment.attendee'],
    });
  }

  async getAttendanceByEnrollment(
    enrollmentId: string,
  ): Promise<SessionAttendance[]> {
    return this.attendanceRepo.find({
      where: { enrollment: { id: enrollmentId } },
      relations: ['session'],
    });
  }

  async getBlockAttendanceReport(blockId: string) {
    const block = await this.blockRepo.findOne({
      where: { id: blockId },
      relations: ['sessions'],
    });

    if (!block) {
      throw new NotFoundException(
        this.i18n.t('evaluations.block_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const enrollments = await this.enrollmentRepo.find({
      where: {
        block: { id: blockId },
        status: In([
          BlockEnrollmentStatus.ENROLLED,
          BlockEnrollmentStatus.IN_PROGRESS,
          BlockEnrollmentStatus.APPROVED,
          BlockEnrollmentStatus.FAILED,
        ]),
      },
      relations: ['attendee', 'attendances', 'attendances.session'],
    });

    const sessionStats = await Promise.all(
      block.sessions.map(async (session) => {
        const attendances = await this.attendanceRepo.find({
          where: { session: { id: session.id } },
        });

        return {
          sessionId: session.id,
          sessionTitle: session.title,
          date: session.startAt,
          present: attendances.filter((a) => a.status === AttendanceStatus.PRESENT)
            .length,
          late: attendances.filter((a) => a.status === AttendanceStatus.LATE).length,
          partial: attendances.filter((a) => a.status === AttendanceStatus.PARTIAL)
            .length,
          excused: attendances.filter((a) => a.status === AttendanceStatus.EXCUSED)
            .length,
          absent: attendances.filter((a) => a.status === AttendanceStatus.ABSENT)
            .length,
          notRecorded: enrollments.length - attendances.length,
        };
      }),
    );

    const participantStats = enrollments.map((e) => ({
      attendeeId: e.attendee.id,
      name: `${e.attendee.firstName} ${e.attendee.lastName}`,
      sessionsAttended: e.sessionsAttended,
      attendancePercentage: e.attendancePercentage,
      totalSessions: block.sessions.length,
      meetsMinimum: e.attendancePercentage >= block.minAttendancePercentage,
    }));

    return {
      block: {
        id: block.id,
        name: block.name,
        minAttendancePercentage: block.minAttendancePercentage,
        totalSessions: block.sessions.length,
      },
      sessions: sessionStats,
      participants: participantStats,
      summary: {
        totalParticipants: enrollments.length,
        meetingMinimum: participantStats.filter((p) => p.meetsMinimum).length,
        belowMinimum: participantStats.filter((p) => !p.meetsMinimum).length,
        averageAttendance:
          enrollments.length > 0
            ? (
                enrollments.reduce((sum, e) => sum + e.attendancePercentage, 0) /
                enrollments.length
              ).toFixed(1)
            : 0,
      },
    };
  }
}
