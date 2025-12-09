import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';

import {
  BlockEnrollment,
  BlockEnrollmentStatus,
} from '../entities/block-enrollment.entity';
import { EvaluableBlock, BlockStatus } from '../entities/evaluable-block.entity';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';

import { Attendee } from '../../attendees/entities/attendee.entity';
import {
  Registration,
  RegistrationStatus,
} from '../../registrations/entities/registration.entity';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectRepository(BlockEnrollment)
    private readonly enrollmentRepo: Repository<BlockEnrollment>,
    @InjectRepository(EvaluableBlock)
    private readonly blockRepo: Repository<EvaluableBlock>,
    @InjectRepository(Attendee)
    private readonly attendeeRepo: Repository<Attendee>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  // ========== INSCRIPCIÓN A BLOQUE ==========

  async enroll(
    attendeeId: string,
    dto: CreateEnrollmentDto,
  ): Promise<BlockEnrollment> {
    return this.dataSource.transaction(async (manager) => {
      const enrollmentRepo = manager.getRepository(BlockEnrollment);
      const blockRepo = manager.getRepository(EvaluableBlock);

      // 1. Validar bloque
      const block = await blockRepo.findOne({
        where: { id: dto.blockId },
        relations: ['event', 'ticket'],
      });

      if (!block) {
        throw new NotFoundException(
          this.i18n.t('evaluations.block_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 2. Verificar estado del bloque
      if (block.status !== BlockStatus.OPEN) {
        throw new BadRequestException(
          this.i18n.t('evaluations.block_not_open', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 3. Verificar período de inscripción
      const now = new Date();
      if (block.enrollmentStartAt && now < block.enrollmentStartAt) {
        throw new BadRequestException(
          this.i18n.t('evaluations.enrollment_not_started', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }
      if (block.enrollmentEndAt && now > block.enrollmentEndAt) {
        throw new BadRequestException(
          this.i18n.t('evaluations.enrollment_ended', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 4. Verificar capacidad
      if (block.maxParticipants) {
        const currentEnrollments = await enrollmentRepo.count({
          where: {
            block: { id: dto.blockId },
            status: BlockEnrollmentStatus.ENROLLED,
          },
        });

        if (currentEnrollments >= block.maxParticipants) {
          throw new ConflictException(
            this.i18n.t('evaluations.block_full', {
              lang: I18nContext.current()?.lang,
            }),
          );
        }
      }

      // 5. Verificar que no esté ya inscrito
      const existingEnrollment = await enrollmentRepo.findOne({
        where: {
          block: { id: dto.blockId },
          attendee: { id: attendeeId },
          status: BlockEnrollmentStatus.ENROLLED,
        },
      });

      if (existingEnrollment) {
        throw new ConflictException(
          this.i18n.t('evaluations.already_enrolled', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 6. Verificar registro al evento si es requerido
      let registration: Registration | null = null;
      if (block.requiresEventRegistration) {
        registration = await this.registrationRepo.findOne({
          where: {
            attendee: { id: attendeeId },
            event: { id: block.event.id },
            status: RegistrationStatus.CONFIRMED,
          },
        });

        if (!registration) {
          throw new BadRequestException(
            this.i18n.t('evaluations.event_registration_required', {
              lang: I18nContext.current()?.lang,
            }),
          );
        }
      }

      // 7. Cargar attendee
      const attendee = await this.attendeeRepo.findOne({
        where: { id: attendeeId },
        relations: ['user'],
      });

      if (!attendee) {
        throw new NotFoundException(
          this.i18n.t('attendees.not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // 8. Calcular precio (sin cupones por ahora, se integrará después)
      const originalPrice = block.price || 0;
      const discountAmount = 0;
      const finalPrice = Math.max(0, originalPrice - discountAmount);

      // 9. Crear inscripción
      const enrollment = enrollmentRepo.create({
        block,
        attendee,
        registration,
        status:
          finalPrice > 0
            ? BlockEnrollmentStatus.PENDING
            : BlockEnrollmentStatus.ENROLLED,
        originalPrice,
        discountAmount,
        finalPrice,
        enrolledAt: finalPrice === 0 ? new Date() : null,
      });

      const saved = await enrollmentRepo.save(enrollment);

      this.logger.log(
        `📝 Inscripción creada: ${attendee.firstName} ${attendee.lastName} -> ${block.name}`,
      );

      return saved;
    });
  }

  // ========== CONFIRMAR PAGO ==========

  async confirmPayment(enrollmentId: string): Promise<BlockEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['block', 'attendee'],
    });

    if (!enrollment) {
      throw new NotFoundException(
        this.i18n.t('evaluations.enrollment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (enrollment.status !== BlockEnrollmentStatus.PENDING) {
      throw new BadRequestException(
        this.i18n.t('evaluations.enrollment_not_pending', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    enrollment.status = BlockEnrollmentStatus.ENROLLED;
    enrollment.enrolledAt = new Date();

    return this.enrollmentRepo.save(enrollment);
  }

  // ========== CANCELAR INSCRIPCIÓN ==========

  async cancel(enrollmentId: string, reason?: string): Promise<BlockEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['block', 'attendee'],
    });

    if (!enrollment) {
      throw new NotFoundException(
        this.i18n.t('evaluations.enrollment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Solo se puede cancelar si está pendiente o inscrito
    if (
      ![BlockEnrollmentStatus.PENDING, BlockEnrollmentStatus.ENROLLED].includes(
        enrollment.status,
      )
    ) {
      throw new BadRequestException(
        this.i18n.t('evaluations.cannot_cancel_enrollment', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    enrollment.status = BlockEnrollmentStatus.CANCELLED;
    enrollment.withdrawnAt = new Date();

    this.logger.log(
      `❌ Inscripción cancelada: ${enrollment.attendee.firstName} ${enrollment.attendee.lastName} - ${enrollment.block.name}${reason ? ` (${reason})` : ''}`,
    );

    return this.enrollmentRepo.save(enrollment);
  }

  // ========== RETIRO VOLUNTARIO ==========

  async withdraw(
    enrollmentId: string,
    reason?: string,
  ): Promise<BlockEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['block', 'attendee'],
    });

    if (!enrollment) {
      throw new NotFoundException(
        this.i18n.t('evaluations.enrollment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (
      ![
        BlockEnrollmentStatus.ENROLLED,
        BlockEnrollmentStatus.IN_PROGRESS,
      ].includes(enrollment.status)
    ) {
      throw new BadRequestException(
        this.i18n.t('evaluations.cannot_withdraw', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    enrollment.status = BlockEnrollmentStatus.WITHDRAWN;
    enrollment.withdrawnAt = new Date();

    this.logger.log(
      `🚪 Retiro voluntario: ${enrollment.attendee.firstName} ${enrollment.attendee.lastName} - ${enrollment.block.name}${reason ? ` (${reason})` : ''}`,
    );

    return this.enrollmentRepo.save(enrollment);
  }

  // ========== CONSULTAS ==========

  async findByAttendee(attendeeId: string): Promise<BlockEnrollment[]> {
    return this.enrollmentRepo.find({
      where: { attendee: { id: attendeeId } },
      relations: ['block', 'block.event', 'grades', 'grades.evaluation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBlock(blockId: string): Promise<BlockEnrollment[]> {
    return this.enrollmentRepo.find({
      where: { block: { id: blockId } },
      relations: ['attendee', 'grades', 'grades.evaluation'],
      order: { attendee: { lastName: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<BlockEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id },
      relations: [
        'block',
        'block.event',
        'block.evaluations',
        'attendee',
        'grades',
        'grades.evaluation',
        'attendances',
        'attendances.session',
      ],
    });

    if (!enrollment) {
      throw new NotFoundException(
        this.i18n.t('evaluations.enrollment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return enrollment;
  }

  // ========== INICIAR BLOQUE (cambiar a IN_PROGRESS) ==========

  async startBlock(blockId: string): Promise<void> {
    const enrollments = await this.enrollmentRepo.find({
      where: {
        block: { id: blockId },
        status: BlockEnrollmentStatus.ENROLLED,
      },
    });

    for (const enrollment of enrollments) {
      enrollment.status = BlockEnrollmentStatus.IN_PROGRESS;
    }

    await this.enrollmentRepo.save(enrollments);
    this.logger.log(
      `🚀 ${enrollments.length} inscripciones iniciadas para bloque ${blockId}`,
    );
  }

  // ========== FINALIZAR EVALUACIÓN ==========

  async finalizeEnrollment(enrollmentId: string): Promise<BlockEnrollment> {
    const enrollment = await this.findOne(enrollmentId);

    if (enrollment.status !== BlockEnrollmentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        this.i18n.t('evaluations.enrollment_not_in_progress', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const block = enrollment.block;

    // Verificar asistencia mínima
    const meetsAttendance =
      enrollment.attendancePercentage >= block.minAttendancePercentage;

    // Verificar nota mínima
    const finalGrade = enrollment.finalGradeAfterRetake ?? enrollment.finalGrade;
    const meetsGrade =
      finalGrade !== null && Number(finalGrade) >= block.minPassingGrade;

    const passed = meetsAttendance && meetsGrade;

    enrollment.passed = passed;
    enrollment.status = passed
      ? BlockEnrollmentStatus.APPROVED
      : BlockEnrollmentStatus.FAILED;

    this.logger.log(
      `📊 Inscripción finalizada: ${enrollment.attendee.firstName} ${enrollment.attendee.lastName} - ${passed ? 'APROBADO' : 'DESAPROBADO'} (Nota: ${finalGrade}, Asistencia: ${enrollment.attendancePercentage}%)`,
    );

    return this.enrollmentRepo.save(enrollment);
  }
}
