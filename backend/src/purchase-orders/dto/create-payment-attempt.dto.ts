import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentAttemptProvider } from '../entities/payment-attempt.entity';

export class CreatePaymentAttemptDto {
  @IsUUID()
  purchaseOrderId: string;

  @IsEnum(PaymentAttemptProvider)
  provider: PaymentAttemptProvider;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
