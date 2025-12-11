import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateOrganizerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  // Datos fiscales
  @IsString()
  @IsOptional()
  @Length(11, 11, { message: 'El RUC debe tener exactamente 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'El RUC debe contener solo números' })
  ruc?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  businessName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  fiscalAddress?: string;

  @IsString()
  @IsOptional()
  @Length(3, 3)
  baseCurrency?: string;

  @IsBoolean()
  @IsOptional()
  emitsFiscalDocuments?: boolean;

  // Textos legales
  @IsString()
  @IsOptional()
  termsText?: string;

  @IsString()
  @IsOptional()
  privacyText?: string;
}
