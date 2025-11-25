import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { PaymentProvider } from '../entities/payment.entity';

export class ReportPaymentDto {
  @IsNotEmpty()
  @IsEnum(PaymentProvider)
  provider: PaymentProvider; // YAPE, PLIN, etc.

  @IsString()
  @IsNotEmpty()
  operationCode: string; // "123456"

  @IsOptional()
  @IsString()
  @IsUrl() // Descomentar si validas URLs reales
  evidenceUrl?: string; // Link a la imagen
}
