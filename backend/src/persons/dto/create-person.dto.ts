import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { DocumentType } from '../entities/person.entity';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  // Datos del tutor (para menores)
  @IsString()
  @IsOptional()
  guardianName?: string;

  @IsString()
  @IsOptional()
  guardianDocument?: string;

  @IsString()
  @IsOptional()
  guardianPhone?: string;

  @IsString()
  @IsOptional()
  guardianAuthorizationUrl?: string;

  // Flags
  @IsBoolean()
  @IsOptional()
  flagRisk?: boolean;

  @IsBoolean()
  @IsOptional()
  flagDataObserved?: boolean;

  // ID de usuario para vincular (opcional)
  @IsString()
  @IsOptional()
  userId?: string;
}
