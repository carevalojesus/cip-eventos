import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCouponDto } from './create-coupon.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { CouponStatus } from '../entities/coupon.entity';

export class UpdateCouponDto extends PartialType(
  OmitType(CreateCouponDto, ['code'] as const), // El código no se puede cambiar
) {
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
}
