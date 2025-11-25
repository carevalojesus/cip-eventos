import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewPaymentDto {
  @IsBoolean()
  @IsNotEmpty()
  isApproved: boolean; // true = Aprobar, false = Rechazar

  @IsString()
  @IsOptional()
  rejectionReason?: string; // Obligatorio si isApproved es false
}
