import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BlockEnrollment,
  BlockEnrollmentStatus,
} from '../../evaluations/entities/block-enrollment.entity';
import {
  ParticipantGrade,
  GradeStatus,
} from '../../evaluations/entities/participant-grade.entity';
import {
  SessionAttendance,
  AttendanceStatus,
} from '../../evaluations/entities/session-attendance.entity';
import { EvaluableBlock } from '../../evaluations/entities/evaluable-block.entity';
import {
  ApprovalStatusReportData,
  GradeDistributionData,
  DetailedAttendanceData,
  SessionAttendanceReportData,
  AcademicReportFilterDto,
} from '../dto/academic-report.dto';

@Injectable()
export class AcademicReportsService {
  private readonly logger = new Logger(AcademicReportsService.name);

  constructor(
    @InjectRepository(BlockEnrollment)
    private readonly enrollmentRepo: Repository<BlockEnrollment>,
    @InjectRepository(ParticipantGrade)
    private readonly gradeRepo: Repository<ParticipantGrade>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepo: Repository<SessionAttendance>,
    @InjectRepository(EvaluableBlock)
    private readonly blockRepo: Repository<EvaluableBlock>,
  ) {}

  /**
   * Listado de participantes aptos/no aptos para certificados
   */
  async getApprovalStatus(
    blockId: string,
    filters?: AcademicReportFilterDto,
  ): Promise<ApprovalStatusReportData[]> {
    this.logger.log(`Generating approval status report for block ${blockId}`);

    const queryBuilder = this.enrollmentRepo
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.attendee', 'attendee')
      .leftJoinAndSelect('enrollment.block', 'block')
      .where('enrollment.blockId = :blockId', { blockId });

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere(
        'enrollment.enrolledAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: new Date(filters.dateFrom),
          dateTo: new Date(filters.dateTo),
        },
      );
    }

    const enrollments = await queryBuilder.getMany();

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      attendeeName: `${enrollment.attendee.firstName || ''} ${enrollment.attendee.lastName || ''}`.trim(),
      attendeeEmail: enrollment.attendee.email,
      attendeeDocument: enrollment.attendee.documentNumber || '',
      finalGrade: enrollment.finalGrade
        ? Number(enrollment.finalGrade)
        : null,
      attendancePercentage: Number(enrollment.attendancePercentage),
      meetsAttendanceRequirement: enrollment.meetsAttendanceRequirement,
      passed: enrollment.passed,
      status: enrollment.status,
      certificateIssued: !!enrollment.certificateId,
      enrolledAt: enrollment.enrolledAt || enrollment.createdAt,
      gradedAt: enrollment.gradedAt,
    }));
  }

  /**
   * Distribución de notas por bloque evaluable
   */
  async getGradeDistribution(
    blockId: string,
    filters?: AcademicReportFilterDto,
  ): Promise<GradeDistributionData> {
    this.logger.log(`Generating grade distribution for block ${blockId}`);

    const block = await this.blockRepo.findOne({
      where: { id: blockId },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    const enrollments = await this.enrollmentRepo.find({
      where: { block: { id: blockId } },
    });

    const totalEnrollments = enrollments.length;
    const graded = enrollments.filter((e) => e.finalGrade !== null).length;
    const pending = totalEnrollments - graded;

    // Distribución por rangos
    const ranges = this.calculateGradeRanges(enrollments);

    // Estadísticas
    const statistics = this.calculateStatistics(enrollments, block);

    return {
      blockName: block.name,
      totalEnrollments,
      graded,
      pending,
      ranges,
      statistics,
    };
  }

  /**
   * Reporte detallado de asistencia por bloque
   */
  async getDetailedAttendance(
    blockId: string,
    filters?: AcademicReportFilterDto,
  ): Promise<DetailedAttendanceData[]> {
    this.logger.log(`Generating detailed attendance report for block ${blockId}`);

    const queryBuilder = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.attendee', 'attendee')
      .leftJoinAndSelect('att.session', 'session')
      .leftJoinAndSelect('att.enrollment', 'enrollment')
      .where('enrollment.blockId = :blockId', { blockId });

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('session.startAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(filters.dateFrom),
        dateTo: new Date(filters.dateTo),
      });
    }

    const attendances = await queryBuilder.getMany();

    return attendances.map((att) => ({
      attendeeId: att.attendee.id,
      attendeeName: `${att.attendee.firstName || ''} ${att.attendee.lastName || ''}`.trim(),
      attendeeEmail: att.attendee.email,
      sessionId: att.session.id,
      sessionName: att.session.title,
      sessionDate: att.session.startAt,
      status: att.status,
      modality: att.modality,
      checkInAt: att.checkInAt,
      checkOutAt: att.checkOutAt,
      minutesAttended: att.minutesAttended,
      attendancePercentage: Number(att.attendancePercentage),
    }));
  }

  /**
   * Reporte de asistencia agrupado por sesión
   */
  async getSessionAttendanceSummary(
    blockId: string,
  ): Promise<SessionAttendanceReportData[]> {
    this.logger.log(
      `Generating session attendance summary for block ${blockId}`,
    );

    // Obtener todas las sesiones del bloque
    const block = await this.blockRepo.findOne({
      where: { id: blockId },
      relations: ['sessions'],
    });

    if (!block) {
      throw new Error('Block not found');
    }

    const sessionIds = block.sessions?.map((s) => s.id) || [];

    const attendances = await this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.session', 'session')
      .where('att.sessionId IN (:...sessionIds)', { sessionIds })
      .getMany();

    // Obtener total de inscritos al bloque
    const totalEnrolled = await this.enrollmentRepo.count({
      where: { block: { id: blockId } },
    });

    // Agrupar por sesión
    const sessionMap = new Map<string, SessionAttendanceReportData>();

    for (const att of attendances) {
      const sessionId = att.session.id;

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          sessionId: sessionId,
          sessionName: att.session.title,
          sessionDate: att.session.startAt,
          totalEnrolled,
          totalPresent: 0,
          totalAbsent: 0,
          totalPartial: 0,
          totalLate: 0,
          totalExcused: 0,
          attendanceRate: 0,
          inPerson: 0,
          virtual: 0,
        });
      }

      const stats = sessionMap.get(sessionId)!;

      switch (att.status) {
        case AttendanceStatus.PRESENT:
          stats.totalPresent++;
          break;
        case AttendanceStatus.ABSENT:
          stats.totalAbsent++;
          break;
        case AttendanceStatus.PARTIAL:
          stats.totalPartial++;
          break;
        case AttendanceStatus.LATE:
          stats.totalLate++;
          break;
        case AttendanceStatus.EXCUSED:
          stats.totalExcused++;
          break;
      }

      if (att.modality === 'IN_PERSON') stats.inPerson++;
      if (att.modality === 'VIRTUAL') stats.virtual++;
    }

    // Calcular tasa de asistencia
    const result = Array.from(sessionMap.values()).map((session) => ({
      ...session,
      attendanceRate:
        totalEnrolled > 0 ? (session.totalPresent / totalEnrolled) * 100 : 0,
    }));

    return result;
  }

  /**
   * Reporte de participantes por evaluación específica
   */
  async getGradesByEvaluation(evaluationId: string) {
    this.logger.log(`Generating grades report for evaluation ${evaluationId}`);

    const grades = await this.gradeRepo
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.attendee', 'attendee')
      .leftJoinAndSelect('grade.evaluation', 'evaluation')
      .where('grade.evaluationId = :evaluationId', { evaluationId })
      .andWhere('grade.status = :status', { status: GradeStatus.PUBLISHED })
      .getMany();

    return grades.map((grade) => ({
      gradeId: grade.id,
      attendeeName: `${grade.enrollment.attendee.firstName || ''} ${grade.enrollment.attendee.lastName || ''}`.trim(),
      attendeeEmail: grade.enrollment.attendee.email,
      grade: Number(grade.grade),
      normalizedGrade: Number(grade.normalizedGrade),
      comments: grade.comments,
      isRetakeGrade: grade.isRetakeGrade,
      attemptNumber: grade.attemptNumber,
      publishedAt: grade.publishedAt,
    }));
  }

  // ===== HELPERS =====

  private calculateGradeRanges(enrollments: BlockEnrollment[]) {
    const ranges = [
      { range: '0-10', min: 0, max: 10, count: 0 },
      { range: '11-13', min: 11, max: 13, count: 0 },
      { range: '14-16', min: 14, max: 16, count: 0 },
      { range: '17-20', min: 17, max: 20, count: 0 },
    ];

    const gradedEnrollments = enrollments.filter((e) => e.finalGrade !== null);
    const total = gradedEnrollments.length;

    for (const enrollment of gradedEnrollments) {
      const grade = Number(enrollment.finalGrade);

      for (const range of ranges) {
        if (grade >= range.min && grade <= range.max) {
          range.count++;
          break;
        }
      }
    }

    return ranges.map((r) => ({
      range: r.range,
      count: r.count,
      percentage: total > 0 ? (r.count / total) * 100 : 0,
    }));
  }

  private calculateStatistics(
    enrollments: BlockEnrollment[],
    block: EvaluableBlock,
  ) {
    const gradedEnrollments = enrollments.filter((e) => e.finalGrade !== null);

    if (gradedEnrollments.length === 0) {
      return {
        average: 0,
        median: 0,
        highest: 0,
        lowest: 0,
        standardDeviation: 0,
        approvalRate: 0,
      };
    }

    const grades = gradedEnrollments.map((e) => Number(e.finalGrade));
    grades.sort((a, b) => a - b);

    const sum = grades.reduce((acc, g) => acc + g, 0);
    const average = sum / grades.length;

    const median =
      grades.length % 2 === 0
        ? (grades[grades.length / 2 - 1] + grades[grades.length / 2]) / 2
        : grades[Math.floor(grades.length / 2)];

    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);

    // Desviación estándar
    const variance =
      grades.reduce((acc, g) => acc + Math.pow(g - average, 2), 0) /
      grades.length;
    const standardDeviation = Math.sqrt(variance);

    // Tasa de aprobación
    const passedCount = enrollments.filter((e) => e.passed).length;
    const approvalRate =
      gradedEnrollments.length > 0
        ? (passedCount / gradedEnrollments.length) * 100
        : 0;

    return {
      average: Number(average.toFixed(2)),
      median: Number(median.toFixed(2)),
      highest: Number(highest.toFixed(2)),
      lowest: Number(lowest.toFixed(2)),
      standardDeviation: Number(standardDeviation.toFixed(2)),
      approvalRate: Number(approvalRate.toFixed(2)),
    };
  }
}
