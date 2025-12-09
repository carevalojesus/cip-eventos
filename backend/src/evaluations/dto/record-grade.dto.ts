import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class RecordGradeDto {
  @IsUUID()
  enrollmentId: string;

  @IsUUID()
  evaluationId: string;

  @IsNumber()
  @Min(0)
  @Max(100) // Puede ser cualquier escala, se normaliza después
  grade: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED';

  @IsOptional()
  @IsBoolean()
  isRetakeGrade?: boolean;
}

export class BatchRecordGradesDto {
  @IsUUID()
  evaluationId: string;

  grades: {
    enrollmentId: string;
    grade: number;
    comments?: string;
  }[];

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED';
}

export class PublishGradesDto {
  @IsUUID()
  blockId: string;

  @IsOptional()
  @IsUUID()
  evaluationId?: string; // Si no se especifica, publica todas las notas del bloque
}
