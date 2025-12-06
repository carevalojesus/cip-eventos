import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { DocumentType } from '../../attendees/entities/attendee.entity';
import { Transform } from 'class-transformer';

export class CreateRegistrationDto {
  @IsUUID()
  @IsNotEmpty()
  ticketId: string; // 👈 El usuario selecciona "Entrada General" o "Ingeniero"

  // Datos Opcionales (Obligatorios solo si es Guest)
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsEnum(DocumentType) @IsOptional() documentType?: DocumentType;
  @IsString() @IsOptional() documentNumber?: string;

  // Validación robusta del código CIP
  @IsString()
  @IsOptional()
  @MinLength(4, { message: 'El código CIP debe tener al menos 4 caracteres' })
  @MaxLength(20, { message: 'El código CIP no puede exceder 20 caracteres' })
  @Matches(/^[A-Z0-9-]+$/, {
    message:
      'El código CIP solo puede contener letras mayúsculas, números y guiones',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  cipCode?: string;

  // Código de cupón de descuento
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  couponCode?: string;

  // Aceptación de términos y condiciones
  @IsBoolean()
  @IsOptional()
  acceptedTerms?: boolean;
}
