import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentType } from '../enums/consent-type.enum';

export class RecordConsentDto {
  @ApiPropertyOptional({
    description: 'ID de la persona (para usuarios no registrados)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario (para usuarios registrados)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Tipo de consentimiento',
    enum: ConsentType,
    example: ConsentType.TERMS_AND_CONDITIONS,
  })
  @IsNotEmpty()
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiProperty({
    description: 'Versión del documento aceptado',
    example: 'v2.1',
  })
  @IsNotEmpty()
  @IsString()
  documentVersion: string;

  @ApiPropertyOptional({
    description: 'Dirección IP del usuario',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User Agent del navegador',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Metadata adicional en formato JSON',
    example: { source: 'registration_form', platform: 'web' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RevokeConsentDto {
  @ApiProperty({
    description: 'ID del registro de consentimiento a revocar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  consentId: string;

  @ApiPropertyOptional({
    description: 'Razón de la revocación',
    example: 'Usuario solicitó eliminar su consentimiento',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConsentHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'ID de la persona',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de consentimiento a filtrar',
    enum: ConsentType,
  })
  @IsOptional()
  @IsEnum(ConsentType)
  consentType?: ConsentType;

  @ApiPropertyOptional({
    description: 'Incluir consentimientos revocados',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeRevoked?: boolean;
}

export class ConsentStatusDto {
  @ApiProperty({
    description: 'Tipo de consentimiento',
    enum: ConsentType,
  })
  @IsNotEmpty()
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiProperty({
    description: 'Si el usuario tiene un consentimiento válido',
  })
  hasValidConsent: boolean;

  @ApiPropertyOptional({
    description: 'Versión actual del documento',
  })
  currentVersion?: string;

  @ApiPropertyOptional({
    description: 'Versión aceptada por el usuario',
  })
  acceptedVersion?: string;

  @ApiPropertyOptional({
    description: 'Fecha de aceptación',
  })
  acceptedAt?: Date;

  @ApiPropertyOptional({
    description: 'Necesita actualizar consentimiento',
  })
  needsUpdate?: boolean;
}

export class BulkRecordConsentDto {
  @ApiPropertyOptional({
    description: 'ID de la persona',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Lista de consentimientos a registrar',
    type: [RecordConsentDto],
  })
  @ValidateNested({ each: true })
  @Type(() => RecordConsentDto)
  consents: Omit<RecordConsentDto, 'personId' | 'userId'>[];

  @ApiPropertyOptional({
    description: 'Dirección IP del usuario',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User Agent del navegador',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
