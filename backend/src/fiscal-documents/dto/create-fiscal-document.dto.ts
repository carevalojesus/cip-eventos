import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  IsEmail,
  Length,
  Matches,
} from 'class-validator';
import { FiscalDocumentType } from '../entities/fiscal-document.entity';

export class CreateFiscalDocumentDto {
  @IsUUID()
  paymentId: string;

  @IsEnum(FiscalDocumentType)
  type: FiscalDocumentType;

  // Para Boleta
  @IsOptional()
  @IsString()
  @Length(8, 8)
  @Matches(/^[0-9]+$/, { message: 'DNI debe contener solo números' })
  dniReceiver?: string;

  // Para Factura
  @IsOptional()
  @IsString()
  @Length(11, 11)
  @Matches(/^(10|20)[0-9]{9}$/, { message: 'RUC inválido' })
  rucReceiver?: string;

  @IsString()
  nameReceiver: string;

  @IsOptional()
  @IsString()
  addressReceiver?: string;

  @IsOptional()
  @IsEmail()
  emailReceiver?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
