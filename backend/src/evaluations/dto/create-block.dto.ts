import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { BlockType } from '../entities/evaluable-block.entity';

export class CreateBlockDto {
  @IsUUID()
  eventId: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(BlockType)
  type: BlockType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hours?: number;

  // ========== CONFIGURACIÓN DE EVALUACIÓN ==========

  @IsOptional()
  @IsEnum(['SIMPLE', 'COMPOSITE'])
  evaluationScheme?: 'SIMPLE' | 'COMPOSITE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  minPassingGrade?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxGrade?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minAttendancePercentage?: number;

  @IsOptional()
  @IsString()
  gradingFormula?: string;

  @IsOptional()
  @IsBoolean()
  allowsRetake?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRetakeAttempts?: number;

  // ========== CONFIGURACIÓN DE INSCRIPCIÓN ==========

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  requiresEventRegistration?: boolean;

  // ========== FECHAS ==========

  @IsOptional()
  @IsDateString()
  enrollmentStartAt?: string;

  @IsOptional()
  @IsDateString()
  enrollmentEndAt?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  // ========== RELACIONES ==========

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sessionIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  instructorIds?: string[];

  @IsOptional()
  @IsUUID()
  ticketId?: string;
}
