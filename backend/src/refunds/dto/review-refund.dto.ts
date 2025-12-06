import { IsBoolean, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class ReviewRefundDto {
  @IsBoolean()
  isApproved: boolean;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  // Permite al admin ajustar el porcentaje de reembolso manualmente
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  customRefundPercentage?: number;
}
