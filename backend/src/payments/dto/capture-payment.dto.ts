import { IsNotEmpty, IsString } from 'class-validator';

export class CapturePaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;
}
