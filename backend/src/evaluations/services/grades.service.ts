import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';

import { ParticipantGrade, GradeStatus } from '../entities/participant-grade.entity';
import { Evaluation, EvaluationType } from '../entities/evaluation.entity';
import { BlockEnrollment, BlockEnrollmentStatus } from '../entities/block-enrollment.entity';
import { EvaluableBlock } from '../entities/evaluable-block.entity';
import {
  RecordGradeDto,
  BatchRecordGradesDto,
  PublishGradesDto,
} from '../dto/record-grade.dto';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    @InjectRepository(ParticipantGrade)
    private readonly gradeRepo: Repository<ParticipantGrade>,
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,
    @InjectRepository(BlockEnrollment)
    private readonly enrollmentRepo: Repository<BlockEnrollment>,
    @InjectRepository(EvaluableBlock)
    private readonly blockRepo: Repository<EvaluableBlock>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  // ========== CRUD DE EVALUACIONES ==========

  async createEvaluation(dto: CreateEvaluationDto): Promise<Evaluation> {
    const block = await this.blockRepo.findOne({
      where: { id: dto.blockId },
      relations: ['evaluations'],
    });

    if (!block) {
      throw new NotFoundException(
        this.i18n.t('evaluations.block_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que los pesos no excedan 100%
    const currentWeight = block.evaluations.reduce((sum, e) => sum + e.weight, 0);
    if (currentWeight + dto.weight > 100) {
      throw new BadRequestException(
        this.i18n.t('evaluations.weight_exceeds_100', {
          lang: I18nContext.current()?.lang,
          args: { available: 100 - currentWeight },
        }),
      );
    }

    // Validar evaluación de recuperación
    if (dto.isRetake && dto.replacesEvaluationId) {
      const originalEvaluation = await this.evaluationRepo.findOne({
        where: { id: dto.replacesEvaluationId, block: { id: dto.blockId } },
      });

      if (!originalEvaluation) {
        throw new NotFoundException(
          this.i18n.t('evaluations.original_evaluation_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }
    }

    const evaluation = this.evaluationRepo.create({
      ...dto,
      block,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
      availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : undefined,
      order: dto.order ?? block.evaluations.length,
    });

    const saved = await this.evaluationRepo.save(evaluation);
    this.logger.log(`📝 Evaluación creada: ${saved.name} para bloque ${block.name}`);

    return saved;
  }

  async findEvaluationsByBlock(blockId: string): Promise<Evaluation[]> {
    return this.evaluationRepo.find({
      where: { block: { id: blockId }, isActive: true },
      order: { order: 'ASC' },
    });
  }

  async findEvaluation(id: string): Promise<Evaluation> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
      relations: ['block', 'grades', 'grades.enrollment', 'grades.enrollment.attendee'],
    });

    if (!evaluation) {
      throw new NotFoundException(
        this.i18n.t('evaluations.evaluation_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return evaluation;
  }

  async deleteEvaluation(id: string): Promise<void> {
    const evaluation = await this.findEvaluation(id);

    // Verificar si tiene notas registradas
    const gradesCount = await this.gradeRepo.count({
      where: { evaluation: { id } },
    });

    if (gradesCount > 0) {
      // Soft delete
      evaluation.isActive = false;
      await this.evaluationRepo.save(evaluation);
    } else {
      await this.evaluationRepo.remove(evaluation);
    }
  }

  // ========== REGISTRO DE NOTAS ==========

  async recordGrade(dto: RecordGradeDto): Promise<ParticipantGrade> {
    return this.dataSource.transaction(async (manager) => {
      const gradeRepo = manager.getRepository(ParticipantGrade);
      const enrollmentRepo = manager.getRepository(BlockEnrollment);
      const evaluationRepo = manager.getRepository(Evaluation);

      // Validar inscripción
      const enrollment = await enrollmentRepo.findOne({
        where: { id: dto.enrollmentId },
        relations: ['block', 'attendee'],
      });

      if (!enrollment) {
        throw new NotFoundException(
          this.i18n.t('evaluations.enrollment_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Validar evaluación
      const evaluation = await evaluationRepo.findOne({
        where: { id: dto.evaluationId },
        relations: ['block'],
      });

      if (!evaluation) {
        throw new NotFoundException(
          this.i18n.t('evaluations.evaluation_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Verificar que la evaluación pertenece al mismo bloque
      if (evaluation.block.id !== enrollment.block.id) {
        throw new BadRequestException(
          this.i18n.t('evaluations.evaluation_block_mismatch', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Validar rango de nota
      const maxGrade = evaluation.maxGrade || enrollment.block.maxGrade;
      if (dto.grade < 0 || dto.grade > maxGrade) {
        throw new BadRequestException(
          this.i18n.t('evaluations.grade_out_of_range', {
            lang: I18nContext.current()?.lang,
            args: { min: 0, max: maxGrade },
          }),
        );
      }

      // Buscar nota existente
      let grade = await gradeRepo.findOne({
        where: {
          enrollment: { id: dto.enrollmentId },
          evaluation: { id: dto.evaluationId },
          isRetakeGrade: dto.isRetakeGrade || false,
        },
      });

      // Normalizar nota a escala del bloque
      const blockMaxGrade = enrollment.block.maxGrade;
      const normalizedGrade =
        maxGrade !== blockMaxGrade
          ? (dto.grade / maxGrade) * blockMaxGrade
          : dto.grade;

      if (grade) {
        // Actualizar nota existente
        grade.grade = dto.grade;
        grade.normalizedGrade = normalizedGrade;
        grade.comments = dto.comments ?? null;
        grade.status = dto.status === 'PUBLISHED' ? GradeStatus.PUBLISHED : GradeStatus.DRAFT;
      } else {
        // Crear nueva nota
        const attemptNumber = await gradeRepo.count({
          where: {
            enrollment: { id: dto.enrollmentId },
            evaluation: { id: dto.evaluationId },
          },
        });

        grade = gradeRepo.create({
          enrollment,
          evaluation,
          grade: dto.grade,
          normalizedGrade,
          comments: dto.comments ?? null,
          status: dto.status === 'PUBLISHED' ? GradeStatus.PUBLISHED : GradeStatus.DRAFT,
          isRetakeGrade: dto.isRetakeGrade || false,
          attemptNumber: attemptNumber + 1,
        });
      }

      const saved = await gradeRepo.save(grade);

      // Si es nota de recuperación y está publicada, actualizar nota final
      if (dto.isRetakeGrade && dto.status === 'PUBLISHED') {
        await this.recalculateFinalGrade(enrollment.id);
      }

      this.logger.log(
        `📊 Nota registrada: ${enrollment.attendee.firstName} ${enrollment.attendee.lastName} - ${evaluation.name}: ${dto.grade}`,
      );

      return saved;
    });
  }

  async batchRecordGrades(dto: BatchRecordGradesDto): Promise<ParticipantGrade[]> {
    const results: ParticipantGrade[] = [];

    for (const gradeEntry of dto.grades) {
      const grade = await this.recordGrade({
        enrollmentId: gradeEntry.enrollmentId,
        evaluationId: dto.evaluationId,
        grade: gradeEntry.grade,
        comments: gradeEntry.comments,
        status: dto.status,
      });
      results.push(grade);
    }

    return results;
  }

  // ========== PUBLICAR NOTAS ==========

  async publishGrades(dto: PublishGradesDto): Promise<number> {
    const query = this.gradeRepo
      .createQueryBuilder('grade')
      .innerJoin('grade.enrollment', 'enrollment')
      .innerJoin('enrollment.block', 'block')
      .where('block.id = :blockId', { blockId: dto.blockId })
      .andWhere('grade.status = :status', { status: GradeStatus.DRAFT });

    if (dto.evaluationId) {
      query.andWhere('grade.evaluation.id = :evaluationId', {
        evaluationId: dto.evaluationId,
      });
    }

    const result = await query
      .update(ParticipantGrade)
      .set({ status: GradeStatus.PUBLISHED })
      .execute();

    this.logger.log(
      `📢 ${result.affected} notas publicadas para bloque ${dto.blockId}`,
    );

    // Recalcular notas finales de todos los inscritos
    const enrollments = await this.enrollmentRepo.find({
      where: { block: { id: dto.blockId } },
    });

    for (const enrollment of enrollments) {
      await this.recalculateFinalGrade(enrollment.id);
    }

    return result.affected || 0;
  }

  // ========== CÁLCULO DE NOTA FINAL ==========

  async recalculateFinalGrade(enrollmentId: string): Promise<BlockEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: ['block', 'block.evaluations', 'grades', 'grades.evaluation'],
    });

    if (!enrollment) {
      throw new NotFoundException(
        this.i18n.t('evaluations.enrollment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const block = enrollment.block;
    const evaluations = block.evaluations.filter(
      (e) => e.isActive && e.type !== EvaluationType.RETAKE,
    );

    // Calcular según esquema de evaluación
    let finalGrade: number;

    if (block.evaluationScheme === 'SIMPLE') {
      // Promedio simple
      const publishedGrades = enrollment.grades.filter(
        (g) => g.status === GradeStatus.PUBLISHED && !g.isRetakeGrade,
      );

      if (publishedGrades.length === 0) {
        enrollment.finalGrade = null;
        return this.enrollmentRepo.save(enrollment);
      }

      const sum = publishedGrades.reduce(
        (acc, g) => acc + Number(g.normalizedGrade),
        0,
      );
      finalGrade = sum / publishedGrades.length;
    } else {
      // Promedio ponderado
      let weightedSum = 0;
      let totalWeight = 0;

      for (const evaluation of evaluations) {
        const grade = enrollment.grades.find(
          (g) =>
            g.evaluation.id === evaluation.id &&
            g.status === GradeStatus.PUBLISHED &&
            !g.isRetakeGrade,
        );

        if (grade) {
          weightedSum += Number(grade.normalizedGrade) * (evaluation.weight / 100);
          totalWeight += evaluation.weight;
        }
      }

      if (totalWeight === 0) {
        enrollment.finalGrade = null;
        return this.enrollmentRepo.save(enrollment);
      }

      // Normalizar si no se ha evaluado todo
      finalGrade = totalWeight < 100
        ? (weightedSum / totalWeight) * 100
        : weightedSum;
    }

    // Aplicar fórmula personalizada si existe
    if (block.gradingFormula) {
      finalGrade = this.applyGradingFormula(
        block.gradingFormula,
        finalGrade,
        enrollment,
      );
    }

    enrollment.finalGrade = Math.round(finalGrade * 100) / 100;

    // Calcular nota después de recuperación si aplica
    const retakeGrades = enrollment.grades.filter(
      (g) => g.isRetakeGrade && g.status === GradeStatus.PUBLISHED,
    );

    if (retakeGrades.length > 0) {
      // Tomar la mejor nota de recuperación
      const bestRetake = Math.max(
        ...retakeGrades.map((g) => Number(g.normalizedGrade)),
      );

      // La nota final después de recuperación es el máximo entre original y recuperación
      // pero con un tope configurado (generalmente la nota mínima aprobatoria)
      enrollment.finalGradeAfterRetake = Math.max(
        Number(enrollment.finalGrade),
        Math.min(bestRetake, block.minPassingGrade),
      );
    }

    return this.enrollmentRepo.save(enrollment);
  }

  private applyGradingFormula(
    formula: string,
    baseGrade: number,
    enrollment: BlockEnrollment,
  ): number {
    // Implementación básica de fórmula
    // Soporta variables: {grade}, {attendance}, {bonus}
    try {
      let processedFormula = formula
        .replace(/{grade}/g, baseGrade.toString())
        .replace(/{attendance}/g, enrollment.attendancePercentage.toString())
        .replace(/{bonus}/g, '0');

      // Evaluar expresión matemática simple
      // NOTA: En producción usar una librería segura como mathjs
      const result = Function(`"use strict"; return (${processedFormula})`)();
      return typeof result === 'number' ? result : baseGrade;
    } catch {
      this.logger.warn(`Error aplicando fórmula de calificación: ${formula}`);
      return baseGrade;
    }
  }

  // ========== CONSULTAS ==========

  async getGradesByEnrollment(enrollmentId: string): Promise<ParticipantGrade[]> {
    return this.gradeRepo.find({
      where: { enrollment: { id: enrollmentId } },
      relations: ['evaluation'],
      order: { evaluation: { order: 'ASC' } },
    });
  }

  async getGradesByEvaluation(evaluationId: string): Promise<ParticipantGrade[]> {
    return this.gradeRepo.find({
      where: { evaluation: { id: evaluationId } },
      relations: ['enrollment', 'enrollment.attendee'],
      order: { enrollment: { attendee: { lastName: 'ASC' } } },
    });
  }

  // ========== ESTADÍSTICAS ==========

  async getEvaluationStats(evaluationId: string) {
    const evaluation = await this.findEvaluation(evaluationId);
    const grades = await this.gradeRepo.find({
      where: {
        evaluation: { id: evaluationId },
        status: GradeStatus.PUBLISHED,
        isRetakeGrade: false,
      },
    });

    const gradeValues = grades.map((g) => Number(g.grade));
    const block = evaluation.block;

    return {
      evaluation: {
        id: evaluation.id,
        name: evaluation.name,
        type: evaluation.type,
        weight: evaluation.weight,
        maxGrade: evaluation.maxGrade || block.maxGrade,
      },
      statistics: {
        totalGraded: grades.length,
        average:
          gradeValues.length > 0
            ? (gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length).toFixed(2)
            : null,
        highest: gradeValues.length > 0 ? Math.max(...gradeValues) : null,
        lowest: gradeValues.length > 0 ? Math.min(...gradeValues) : null,
        median: gradeValues.length > 0 ? this.calculateMedian(gradeValues) : null,
        standardDeviation:
          gradeValues.length > 1 ? this.calculateStdDev(gradeValues) : null,
        passingCount: gradeValues.filter((g) => g >= block.minPassingGrade).length,
        passingRate:
          gradeValues.length > 0
            ? (
                (gradeValues.filter((g) => g >= block.minPassingGrade).length /
                  gradeValues.length) *
                100
              ).toFixed(1)
            : null,
      },
      distribution: this.calculateGradeDistribution(gradeValues, block.maxGrade),
    };
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateStdDev(values: number[]): string {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance).toFixed(2);
  }

  private calculateGradeDistribution(
    values: number[],
    maxGrade: number,
  ): { range: string; count: number }[] {
    const ranges = [
      { range: '0-20%', min: 0, max: maxGrade * 0.2 },
      { range: '21-40%', min: maxGrade * 0.2, max: maxGrade * 0.4 },
      { range: '41-60%', min: maxGrade * 0.4, max: maxGrade * 0.6 },
      { range: '61-80%', min: maxGrade * 0.6, max: maxGrade * 0.8 },
      { range: '81-100%', min: maxGrade * 0.8, max: maxGrade },
    ];

    return ranges.map((r) => ({
      range: r.range,
      count: values.filter((v) => v > r.min && v <= r.max).length,
    }));
  }
}
