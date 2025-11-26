import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { PaymentProvider } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  registrationId: string;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;
}
