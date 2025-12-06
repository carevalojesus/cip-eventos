import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsUUID()
  ticketId: string;

  @IsOptional()
  @IsUUID()
  attendeeId?: string;

  @IsOptional()
  @IsString()
  cipCode?: string;
}
