import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestDeletionDto {
  @ApiProperty({
    description: 'Reason for requesting account deletion',
    example: 'I no longer need this account',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
