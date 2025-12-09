import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { EvaluationType } from '../entities/evaluation.entity';

export class CreateEvaluationDto {
  @IsUUID()
  blockId: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(EvaluationType)
  type: EvaluationType;

  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number; // Peso en porcentaje

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxGrade?: number;

  @IsOptional()
  @IsBoolean()
  isRetake?: boolean;

  @IsOptional()
  @IsUUID()
  replacesEvaluationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @IsOptional()
  @IsDateString()
  availableUntil?: string;
}
