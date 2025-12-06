import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';

import {
  EvaluableBlock,
  BlockStatus,
} from '../entities/evaluable-block.entity';
import { BlockEnrollment, BlockEnrollmentStatus } from '../entities/block-enrollment.entity';
import { Evaluation } from '../entities/evaluation.entity';
import { CreateBlockDto } from '../dto/create-block.dto';
import { UpdateBlockDto } from '../dto/update-block.dto';

import { Event } from '../../events/entities/event.entity';
import { EventSession } from '../../events/entities/event-session.entity';
import { EventTicket } from '../../events/entities/event-ticket.entity';
import { Speaker } from '../../speakers/entities/speaker.entity';

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    @InjectRepository(EvaluableBlock)
    private readonly blockRepo: Repository<EvaluableBlock>,
    @InjectRepository(BlockEnrollment)
    private readonly enrollmentRepo: Repository<BlockEnrollment>,
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventSession)
    private readonly sessionRepo: Repository<EventSession>,
    @InjectRepository(EventTicket)
    private readonly ticketRepo: Repository<EventTicket>,
    @InjectRepository(Speaker)
    private readonly speakerRepo: Repository<Speaker>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  // ========== CRUD DE BLOQUES ==========

  async create(dto: CreateBlockDto): Promise<EvaluableBlock> {
    // Validar evento
    const event = await this.eventRepo.findOne({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException(
        this.i18n.t('evaluations.event_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Cargar sesiones si se especificaron
    let sessions: EventSession[] = [];
    if (dto.sessionIds?.length) {
      sessions = await this.sessionRepo.find({
        where: { id: In(dto.sessionIds), event: { id: dto.eventId } },
      });
    }

    // Cargar instructores si se especificaron
    let instructors: Speaker[] = [];
    if (dto.instructorIds?.length) {
      instructors = await this.speakerRepo.find({
        where: { id: In(dto.instructorIds) },
      });
    }

    // Cargar ticket si se especificó
    let ticket: EventTicket | null = null;
    if (dto.ticketId) {
      ticket = await this.ticketRepo.findOne({
        where: { id: dto.ticketId, event: { id: dto.eventId } },
      });
    }

    const block = this.blockRepo.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      hours: dto.hours || 0,
      evaluationScheme: dto.evaluationScheme || 'SIMPLE',
      minPassingGrade: dto.minPassingGrade || 14,
      maxGrade: dto.maxGrade || 20,
      minAttendancePercentage: dto.minAttendancePercentage || 70,
      gradingFormula: dto.gradingFormula,
      allowsRetake: dto.allowsRetake || false,
      maxRetakeAttempts: dto.maxRetakeAttempts || 1,
      maxParticipants: dto.maxParticipants,
      price: dto.price || 0,
      requiresEventRegistration: dto.requiresEventRegistration ?? true,
      enrollmentStartAt: dto.enrollmentStartAt
        ? new Date(dto.enrollmentStartAt)
        : null,
      enrollmentEndAt: dto.enrollmentEndAt
        ? new Date(dto.enrollmentEndAt)
        : null,
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      event,
      sessions,
      instructors,
      ticket,
    });

    const saved = await this.blockRepo.save(block);
    this.logger.log(`📚 Bloque evaluable creado: ${saved.name} (${saved.id})`);

    return saved;
  }

  async findAll(eventId?: string): Promise<EvaluableBlock[]> {
    const query = this.blockRepo
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.event', 'event')
      .leftJoinAndSelect('block.sessions', 'sessions')
      .leftJoinAndSelect('block.instructors', 'instructors')
      .leftJoinAndSelect('block.ticket', 'ticket')
      .where('block.isActive = :isActive', { isActive: true });

    if (eventId) {
      query.andWhere('event.id = :eventId', { eventId });
    }

    return query.orderBy('block.startAt', 'ASC').getMany();
  }

  async findOne(id: string): Promise<EvaluableBlock> {
    const block = await this.blockRepo.findOne({
      where: { id },
      relations: [
        'event',
        'sessions',
        'sessions.speakers',
        'instructors',
        'ticket',
        'evaluations',
      ],
    });

    if (!block) {
      throw new NotFoundException(
        this.i18n.t('evaluations.block_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return block;
  }

  async update(id: string, dto: UpdateBlockDto): Promise<EvaluableBlock> {
    const block = await this.findOne(id);

    // Actualizar sesiones si se especificaron
    if (dto.sessionIds) {
      block.sessions = await this.sessionRepo.find({
        where: { id: In(dto.sessionIds) },
      });
    }

    // Actualizar instructores si se especificaron
    if (dto.instructorIds) {
      block.instructors = await this.speakerRepo.find({
        where: { id: In(dto.instructorIds) },
      });
    }

    // Actualizar ticket si se especificó
    if (dto.ticketId) {
      block.ticket = await this.ticketRepo.findOne({
        where: { id: dto.ticketId },
      });
    }

    Object.assign(block, {
      ...dto,
      enrollmentStartAt: dto.enrollmentStartAt
        ? new Date(dto.enrollmentStartAt)
        : block.enrollmentStartAt,
      enrollmentEndAt: dto.enrollmentEndAt
        ? new Date(dto.enrollmentEndAt)
        : block.enrollmentEndAt,
      startAt: dto.startAt ? new Date(dto.startAt) : block.startAt,
      endAt: dto.endAt ? new Date(dto.endAt) : block.endAt,
    });

    return this.blockRepo.save(block);
  }

  async remove(id: string): Promise<void> {
    const block = await this.findOne(id);

    // Verificar si tiene inscripciones
    const enrollmentCount = await this.enrollmentRepo.count({
      where: { block: { id } },
    });

    if (enrollmentCount > 0) {
      // Soft delete
      block.isActive = false;
      block.status = BlockStatus.CANCELLED;
      await this.blockRepo.save(block);
    } else {
      await this.blockRepo.remove(block);
    }
  }

  // ========== CAMBIO DE ESTADO ==========

  async updateStatus(id: string, status: BlockStatus): Promise<EvaluableBlock> {
    const block = await this.findOne(id);

    // Validar transición de estado
    const validTransitions: Record<BlockStatus, BlockStatus[]> = {
      [BlockStatus.DRAFT]: [BlockStatus.OPEN, BlockStatus.CANCELLED],
      [BlockStatus.OPEN]: [BlockStatus.IN_PROGRESS, BlockStatus.CANCELLED],
      [BlockStatus.IN_PROGRESS]: [BlockStatus.GRADING, BlockStatus.CANCELLED],
      [BlockStatus.GRADING]: [BlockStatus.COMPLETED],
      [BlockStatus.COMPLETED]: [],
      [BlockStatus.CANCELLED]: [],
    };

    if (!validTransitions[block.status].includes(status)) {
      throw new BadRequestException(
        this.i18n.t('evaluations.invalid_status_transition', {
          lang: I18nContext.current()?.lang,
          args: { from: block.status, to: status },
        }),
      );
    }

    block.status = status;
    return this.blockRepo.save(block);
  }

  // ========== ESTADÍSTICAS ==========

  async getBlockStats(id: string) {
    const block = await this.findOne(id);

    const enrollments = await this.enrollmentRepo.find({
      where: { block: { id } },
    });

    const enrolled = enrollments.filter(
      (e) =>
        e.status === BlockEnrollmentStatus.ENROLLED ||
        e.status === BlockEnrollmentStatus.IN_PROGRESS,
    );
    const approved = enrollments.filter(
      (e) => e.status === BlockEnrollmentStatus.APPROVED,
    );
    const failed = enrollments.filter(
      (e) => e.status === BlockEnrollmentStatus.FAILED,
    );

    const grades = enrollments
      .filter((e) => e.finalGrade !== null)
      .map((e) => Number(e.finalGrade));

    return {
      block: {
        id: block.id,
        name: block.name,
        status: block.status,
      },
      enrollments: {
        total: enrollments.length,
        enrolled: enrolled.length,
        approved: approved.length,
        failed: failed.length,
        approvalRate:
          approved.length + failed.length > 0
            ? ((approved.length / (approved.length + failed.length)) * 100).toFixed(1)
            : null,
      },
      grades: {
        count: grades.length,
        average: grades.length > 0
          ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2)
          : null,
        highest: grades.length > 0 ? Math.max(...grades) : null,
        lowest: grades.length > 0 ? Math.min(...grades) : null,
      },
      capacity: {
        maxParticipants: block.maxParticipants,
        available: block.maxParticipants
          ? block.maxParticipants - enrolled.length
          : null,
      },
    };
  }

  // ========== LISTAR PARTICIPANTES ==========

  async getParticipants(blockId: string) {
    return this.enrollmentRepo.find({
      where: { block: { id: blockId } },
      relations: ['attendee', 'grades', 'grades.evaluation'],
      order: { attendee: { lastName: 'ASC' } },
    });
  }
}
