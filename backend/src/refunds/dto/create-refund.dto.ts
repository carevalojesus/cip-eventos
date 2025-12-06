import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RefundReason, RefundMethod } from '../entities/refund.entity';

class BankDetailsDto {
  @IsString()
  bankName: string;

  @IsString()
  accountNumber: string;

  @IsIn(['SAVINGS', 'CHECKING'])
  accountType: string;

  @IsString()
  accountHolder: string;

  @IsOptional()
  @IsString()
  cci?: string;
}

export class CreateRefundDto {
  @IsUUID()
  registrationId: string;

  @IsEnum(RefundReason)
  reason: RefundReason;

  @IsOptional()
  @IsString()
  reasonDetails?: string;

  @IsOptional()
  @IsEnum(RefundMethod)
  refundMethod?: RefundMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;
}
