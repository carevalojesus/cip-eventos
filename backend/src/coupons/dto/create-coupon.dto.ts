import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  Min,
  Max,
  MaxLength,
  IsArray,
  Matches,
} from 'class-validator';
import { CouponType } from '../entities/coupon.entity';

export class CreateCouponDto {
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'El código debe contener solo letras mayúsculas, números, guiones y guiones bajos',
  })
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  @Min(0)
  @Max(100) // Para porcentaje máximo 100%
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTotalUses?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerPerson?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  requiresCipValidation?: boolean;

  @IsOptional()
  @IsBoolean()
  canCombineWithOthers?: boolean;

  @IsOptional()
  @IsBoolean()
  appliesToAllTickets?: boolean;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  applicableTicketIds?: string[];
}
