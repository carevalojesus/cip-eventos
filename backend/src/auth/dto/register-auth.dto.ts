import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MinLength,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsentAcceptanceDto {
  @ApiProperty({
    description: 'Tipo de consentimiento',
    example: 'TERMS_AND_CONDITIONS',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Versión del documento aceptado',
    example: 'v2.1',
  })
  @IsNotEmpty()
  @IsString()
  version: string;

  @ApiProperty({
    description: 'Aceptado',
    example: true,
  })
  @IsBoolean()
  accepted: boolean;
}

export class RegisterAuthDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 8 caracteres, al menos una mayúscula y un número)',
    example: 'Password123',
  })
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una mayúscula',
  })
  @Matches(/[0-9]/, {
    message: 'La contraseña debe contener al menos un número',
  })
  password: string;

  @ApiProperty({
    description: 'Acepta los Términos y Condiciones',
    example: true,
  })
  @IsBoolean()
  acceptTerms: boolean;

  @ApiProperty({
    description: 'Acepta la Política de Privacidad',
    example: true,
  })
  @IsBoolean()
  acceptPrivacy: boolean;

  @ApiPropertyOptional({
    description: 'Acepta recibir comunicaciones de marketing (opcional)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  acceptMarketing?: boolean;

  @ApiPropertyOptional({
    description: 'Acepta el procesamiento de datos (opcional)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  acceptDataProcessing?: boolean;

  @ApiPropertyOptional({
    description: 'Versión de los términos aceptados',
    example: 'v2.1',
  })
  @IsOptional()
  @IsString()
  termsVersion?: string;

  @ApiPropertyOptional({
    description: 'Versión de la política de privacidad aceptada',
    example: 'v2.0',
  })
  @IsOptional()
  @IsString()
  privacyVersion?: string;
}
