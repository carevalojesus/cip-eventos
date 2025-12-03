import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProvider } from '../entities/payment.entity';

export class BillingDataDto {
  @IsIn(['DNI', 'RUC'])
  documentType: 'DNI' | 'RUC';

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  registrationId: string;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @IsOptional()
  @ValidateNested()
  @Type(() => BillingDataDto)
  billingData?: BillingDataDto;

  @IsOptional()
  @IsString()
  @IsIn(['ONLINE', 'BOX_OFFICE', 'ADMIN'])
  source?: 'ONLINE' | 'BOX_OFFICE' | 'ADMIN';
}
