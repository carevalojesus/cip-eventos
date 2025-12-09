import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PseudonymizePersonDto {
  @ApiProperty({
    description: 'Reason for pseudonymizing the person data',
    example: 'GDPR deletion request',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
