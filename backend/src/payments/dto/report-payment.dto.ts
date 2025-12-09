import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { PaymentProvider } from '../entities/payment.entity';

export class ReportPaymentDto {
  @IsNotEmpty()
  @IsEnum(PaymentProvider)
  provider: PaymentProvider; // YAPE, PLIN, etc.

  @IsString()
  @IsNotEmpty()
  @Length(4, 30, {
    message: 'El código de operación debe tener entre 4 y 30 caracteres',
  })
  @Matches(/^[A-Za-z0-9\-_]+$/, {
    message:
      'El código de operación solo puede contener letras, números, guiones y guiones bajos',
  })
  operationCode: string; // "123456"

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'La URL de evidencia debe ser una URL válida' })
  evidenceUrl?: string; // Link a la imagen
}
