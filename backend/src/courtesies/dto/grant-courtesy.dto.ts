import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourtesyType } from '../enums/courtesy-type.enum';
import { CourtesyScope } from '../enums/courtesy-scope.enum';
import { CreatePersonDto } from '../../persons/dto/create-person.dto';

export class GrantCourtesyDto {
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  // Opción 1: ID de persona existente
  @IsOptional()
  @IsUUID()
  personId?: string;

  // Opción 2: Datos para crear nueva persona
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePersonDto)
  personData?: CreatePersonDto;

  @IsEnum(CourtesyType)
  @IsNotEmpty()
  type: CourtesyType;

  @IsEnum(CourtesyScope)
  @IsNotEmpty()
  scope: CourtesyScope;

  // Para scope SPECIFIC_BLOCKS
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  specificBlockIds?: string[];

  // Para scope ASSIGNED_SESSIONS_ONLY y type SPEAKER
  @IsOptional()
  @IsUUID()
  speakerId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
