import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../roles/entities/role.entity';

import { GradesService } from '../services/grades.service';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto';
import {
  RecordGradeDto,
  BatchRecordGradesDto,
  PublishGradesDto,
} from '../dto/record-grade.dto';

@Controller('evaluations/grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // ========== EVALUACIONES ==========

  @Post('evaluations')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  createEvaluation(@Body() dto: CreateEvaluationDto) {
    return this.gradesService.createEvaluation(dto);
  }

  @Get('evaluations/block/:blockId')
  getEvaluationsByBlock(@Param('blockId', ParseUUIDPipe) blockId: string) {
    return this.gradesService.findEvaluationsByBlock(blockId);
  }

  @Get('evaluations/:id')
  getEvaluation(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.findEvaluation(id);
  }

  @Delete('evaluations/:id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  deleteEvaluation(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.deleteEvaluation(id);
  }

  @Get('evaluations/:id/stats')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getEvaluationStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.getEvaluationStats(id);
  }

  // ========== NOTAS ==========

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  recordGrade(@Body() dto: RecordGradeDto) {
    return this.gradesService.recordGrade(dto);
  }

  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  batchRecordGrades(@Body() dto: BatchRecordGradesDto) {
    return this.gradesService.batchRecordGrades(dto);
  }

  @Post('publish')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  publishGrades(@Body() dto: PublishGradesDto) {
    return this.gradesService.publishGrades(dto);
  }

  @Get('enrollment/:enrollmentId')
  getGradesByEnrollment(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.gradesService.getGradesByEnrollment(enrollmentId);
  }

  @Get('evaluation/:evaluationId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getGradesByEvaluation(
    @Param('evaluationId', ParseUUIDPipe) evaluationId: string,
  ) {
    return this.gradesService.getGradesByEvaluation(evaluationId);
  }

  @Put('enrollment/:enrollmentId/recalculate')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  recalculateFinalGrade(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.gradesService.recalculateFinalGrade(enrollmentId);
  }
}
