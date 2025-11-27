import { IsBoolean, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class ReviewPaymentDto {
  @IsBoolean()
  @IsNotEmpty()
  isApproved: boolean; // true = Aprobar, false = Rechazar

  @ValidateIf((o: ReviewPaymentDto) => o.isApproved === false)
  @IsString()
  @IsNotEmpty()
  rejectionReason?: string; // Obligatorio si isApproved es false
}
